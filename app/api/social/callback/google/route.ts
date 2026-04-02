import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
const REDIRECT_URI = `${BASE_URL}/api/social/callback/google`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // business_id
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?social_error=google_denied`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI, grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error("No access token");

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json();

    // Get Google Business locations
    const locRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const locData = await locRes.json();
    const account = locData.accounts?.[0];

    const supabase = createAdminClient();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await supabase.from("social_connections").upsert({
      business_id: state,
      platform: "google_business",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      platform_user_id: user.id,
      platform_username: user.email,
      platform_page_id: account?.name,
      platform_page_name: account?.accountName,
      scopes: ["https://www.googleapis.com/auth/business.manage"],
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" });

    return NextResponse.redirect(`${BASE_URL}/dashboard?social_connected=google`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${BASE_URL}/dashboard?social_error=google_failed`);
  }
}

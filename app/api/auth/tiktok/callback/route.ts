import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateB64 = searchParams.get("state");
  const error = searchParams.get("error");

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social`;

  if (error || !code || !stateB64) {
    return NextResponse.redirect(`${dashboardUrl}?connect=error&platform=tiktok`);
  }

  let state: { business_id: string; user_id: string; cv: string };
  try { state = JSON.parse(Buffer.from(stateB64, "base64").toString()); }
  catch { return NextResponse.redirect(`${dashboardUrl}?connect=error&platform=tiktok`); }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: state.cv,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.message || "No token");

    // Get user info
    const profileRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const profileData = await profileRes.json();
    const profile = profileData.data?.user || {};

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 86400));

    const supabase = createAdminClient();
    await supabase.from("social_accounts").upsert({
      business_id: state.business_id,
      platform: "tiktok",
      account_id: profile.open_id || tokenData.open_id,
      account_name: profile.display_name || "TikTok Account",
      account_picture: profile.avatar_url || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt.toISOString(),
      status: "connected",
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" });

    return NextResponse.redirect(`${dashboardUrl}?connect=success&platform=tiktok`);
  } catch (err: any) {
    console.error("TikTok OAuth error:", err);
    return NextResponse.redirect(`${dashboardUrl}?connect=error&platform=tiktok&msg=${encodeURIComponent(err.message)}`);
  }
}

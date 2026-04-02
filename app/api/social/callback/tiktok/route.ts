import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
const REDIRECT_URI = `${BASE_URL}/api/social/callback/tiktok`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // business_id
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?social_error=tiktok_denied`);
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code, grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.data?.access_token) throw new Error("No TikTok access token");

    const { access_token, refresh_token, expires_in, open_id } = tokenData.data;

    // Get user info
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const userData = await userRes.json();
    const user = userData.data?.user;

    const supabase = createAdminClient();
    await supabase.from("social_connections").upsert({
      business_id: state,
      platform: "tiktok",
      access_token,
      refresh_token,
      token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      platform_user_id: open_id,
      platform_username: user?.username || user?.display_name,
      platform_page_id: open_id,
      platform_page_name: user?.display_name,
      scopes: ["video.publish", "video.upload"],
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" });

    return NextResponse.redirect(`${BASE_URL}/dashboard?social_connected=tiktok`);
  } catch (err) {
    console.error("TikTok OAuth error:", err);
    return NextResponse.redirect(`${BASE_URL}/dashboard?social_error=tiktok_failed`);
  }
}

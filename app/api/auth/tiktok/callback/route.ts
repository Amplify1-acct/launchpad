import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const userId = state?.split(":")[0];

  if (error || !code || !userId) {
    return NextResponse.redirect(`${siteUrl}/dashboard/settings?error=tiktok_auth_failed`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = `${siteUrl}/api/auth/tiktok/callback`;

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
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    // Get user info
    const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const tikUser = userData.data?.user;

    const supabase = createAdminClient();

    const { data: customer } = await supabase
      .from("customers").select("id").eq("user_id", userId).single();
    if (!customer) throw new Error("Customer not found");

    const { data: business } = await supabase
      .from("businesses").select("id").eq("customer_id", customer.id).single();
    if (!business) throw new Error("Business not found");

    await supabase.from("social_accounts").upsert({
      business_id: business.id,
      platform: "tiktok",
      account_id: tikUser?.open_id,
      account_name: tikUser?.display_name,
      account_picture: tikUser?.avatar_url,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      status: "connected",
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" });

    return NextResponse.redirect(`${siteUrl}/dashboard/settings?connected=tiktok`);
  } catch (err: any) {
    console.error("TikTok OAuth error:", err);
    return NextResponse.redirect(`${siteUrl}/dashboard/settings?error=tiktok_auth_failed`);
  }
}

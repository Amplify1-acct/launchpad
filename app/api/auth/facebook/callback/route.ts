import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social`;

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${dashboardUrl}?connect=error&platform=facebook`);
  }

  let state: { business_id: string; user_id: string };
  try { state = JSON.parse(stateRaw); }
  catch { return NextResponse.redirect(`${dashboardUrl}?connect=error&platform=facebook`); }

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error?.message || "No token");

    // Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${appId}` +
      `&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();
    const userToken = longLivedData.access_token || tokenData.access_token;

    // Get user profile
    const profileRes = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${userToken}`
    );
    const profile = await profileRes.json();

    // Get pages managed by this user
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0]; // Use first page for now

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 58); // ~60 day token

    const supabase = createAdminClient();

    // Upsert Facebook account
    await supabase.from("social_accounts").upsert({
      business_id: state.business_id,
      platform: "facebook",
      account_id: profile.id,
      account_name: profile.name,
      account_picture: profile.picture?.data?.url || null,
      access_token: userToken,
      token_expires_at: expiresAt.toISOString(),
      page_id: page?.id || null,
      page_name: page?.name || null,
      page_access_token: page?.access_token || null,
      status: "connected",
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" });

    // Also handle Instagram if connected to this Facebook account
    if (page?.id && page?.access_token) {
      const igRes = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      const igAccountId = igData.instagram_business_account?.id;

      if (igAccountId) {
        const igProfileRes = await fetch(
          `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,name,profile_picture_url,username&access_token=${page.access_token}`
        );
        const igProfile = await igProfileRes.json();

        await supabase.from("social_accounts").upsert({
          business_id: state.business_id,
          platform: "instagram",
          account_id: igAccountId,
          account_name: igProfile.name || igProfile.username || "Instagram",
          account_picture: igProfile.profile_picture_url || null,
          access_token: page.access_token,
          token_expires_at: expiresAt.toISOString(),
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token,
          status: "connected",
          connected_at: new Date().toISOString(),
        }, { onConflict: "business_id,platform" });
      }
    }

    return NextResponse.redirect(`${dashboardUrl}?connect=success&platform=facebook`);
  } catch (err: any) {
    console.error("Facebook OAuth error:", err);
    return NextResponse.redirect(`${dashboardUrl}?connect=error&platform=facebook&msg=${encodeURIComponent(err.message)}`);
  }
}

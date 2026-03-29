import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  if (error || !code || !userId) {
    return NextResponse.redirect(`${siteUrl}/dashboard/settings?error=facebook_auth_failed`);
  }

  const clientId = process.env.FACEBOOK_APP_ID!;
  const clientSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${siteUrl}/api/auth/facebook/callback`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    const accessToken = tokenData.access_token;

    // Get user info
    const meRes = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`);
    const me = await meRes.json();

    // Get pages
    const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];

    // Get long-lived token
    const llRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`
    );
    const llData = await llRes.json();
    const longLivedToken = llData.access_token || accessToken;

    const supabase = createAdminClient();

    // Get business_id for this user
    const { data: customer } = await supabase
      .from("customers").select("id").eq("user_id", userId).single();
    if (!customer) throw new Error("Customer not found");

    const { data: business } = await supabase
      .from("businesses").select("id").eq("customer_id", customer.id).single();
    if (!business) throw new Error("Business not found");

    // Save Facebook connection
    await supabase.from("social_accounts").upsert({
      business_id: business.id,
      platform: "facebook",
      account_id: me.id,
      account_name: me.name,
      account_picture: me.picture?.data?.url,
      access_token: longLivedToken,
      page_id: page?.id,
      page_name: page?.name,
      page_access_token: page?.access_token,
      status: "connected",
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" });

    // Also save Instagram (connected via Facebook page)
    if (page) {
      const igRes = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      if (igData.instagram_business_account) {
        const igId = igData.instagram_business_account.id;
        const igInfoRes = await fetch(
          `https://graph.facebook.com/v18.0/${igId}?fields=name,username,profile_picture_url&access_token=${page.access_token}`
        );
        const igInfo = await igInfoRes.json();

        await supabase.from("social_accounts").upsert({
          business_id: business.id,
          platform: "instagram",
          account_id: igId,
          account_name: igInfo.username || igInfo.name,
          account_picture: igInfo.profile_picture_url,
          access_token: page.access_token,
          page_id: page.id,
          status: "connected",
          connected_at: new Date().toISOString(),
        }, { onConflict: "business_id,platform" });
      }
    }

    return NextResponse.redirect(`${siteUrl}/dashboard/settings?connected=facebook`);
  } catch (err: any) {
    console.error("Facebook OAuth error:", err);
    return NextResponse.redirect(`${siteUrl}/dashboard/settings?error=facebook_auth_failed`);
  }
}

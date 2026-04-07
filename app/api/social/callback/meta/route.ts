import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // business_id
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?social_error=meta_denied`);
  }

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/social/callback/meta`)}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    // Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || tokenData.access_token;

    // Get user info
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${longToken}`
    );
    const me = await meRes.json();

    // Get Facebook Pages — check personal pages first, then Business Manager pages
    let page: any = null;

    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();
    console.log("📘 Personal pages:", JSON.stringify(pagesData));

    if (pagesData.data?.length > 0) {
      page = pagesData.data[0];
    } else {
      // Try Business Manager pages
      console.log("📘 No personal pages, checking Business Manager...");
      const bizRes = await fetch(
        `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&access_token=${longToken}`
      );
      const bizData = await bizRes.json();
      console.log("📘 Businesses:", JSON.stringify(bizData));

      if (bizData.data?.length > 0) {
        const bizId = bizData.data[0].id;
        const bizPagesRes = await fetch(
          `https://graph.facebook.com/v19.0/${bizId}/owned_pages?fields=id,name,access_token&access_token=${longToken}`
        );
        const bizPages = await bizPagesRes.json();
        console.log("📘 Business pages:", JSON.stringify(bizPages));
        if (bizPages.data?.length > 0) {
          page = bizPages.data[0];
        }
      }
    }
    console.log("📘 Selected page:", JSON.stringify(page));

    const supabase = createAdminClient();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

    // Store Facebook connection
    await supabase.from("social_connections").upsert({
      business_id: state,
      platform: "facebook",
      access_token: page?.access_token || longToken, // page token never expires
      platform_user_id: me.id,
      platform_username: me.name,
      platform_page_id: page?.id,
      platform_page_name: page?.name,
      token_expires_at: page ? null : expiresAt.toISOString(), // page tokens don't expire
      scopes: ["pages_manage_posts", "pages_read_engagement"],
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" });

    // Get Instagram Business account linked to the page
    if (page?.id) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token || longToken}`
      );
      const igData = await igRes.json();
      const igAccount = igData.instagram_business_account;

      if (igAccount?.id) {
        // Get IG username
        const igUserRes = await fetch(
          `https://graph.facebook.com/v19.0/${igAccount.id}?fields=username,name&access_token=${page.access_token || longToken}`
        );
        const igUser = await igUserRes.json();

        await supabase.from("social_connections").upsert({
          business_id: state,
          platform: "instagram",
          access_token: page.access_token || longToken,
          platform_user_id: igAccount.id,
          platform_username: igUser.username || igUser.name,
          platform_page_id: igAccount.id,
          platform_page_name: igUser.name,
          token_expires_at: null,
          scopes: ["instagram_basic", "instagram_content_publish"],
          connected_at: new Date().toISOString(),
        }, { onConflict: "business_id,platform" });
      }
    }

    return NextResponse.redirect(`${BASE_URL}/dashboard?social_connected=meta`);
  } catch (err) {
    console.error("Meta OAuth error:", err);
    return NextResponse.redirect(`${BASE_URL}/dashboard?social_error=meta_failed`);
  }
}

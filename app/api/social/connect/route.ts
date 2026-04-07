import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

const META_APP_ID = process.env.META_APP_ID!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const businessId = searchParams.get("business_id");

  if (!platform || !businessId) {
    return NextResponse.json({ error: "platform and business_id required" }, { status: 400 });
  }

  // Verify business exists
  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  let authUrl = "";

  switch (platform) {
    case "meta":
    case "facebook":
    case "instagram": {
      const scopes = [
        "pages_show_list",
        "pages_manage_posts",
        "pages_read_engagement",
        "instagram_basic",
        "instagram_content_publish",
      ].join(",");
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/social/callback/meta`)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${businessId}` +
        `&response_type=code` +
        `&auth_type=rerequest` +
        `&enable_profile_selector=true`;
      break;
    }
    case "google": {
      const scopes = [
        "https://www.googleapis.com/auth/business.manage",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" ");
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/social/callback/google`)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${businessId}` +
        `&response_type=code` +
        `&access_type=offline&prompt=consent`;
      break;
    }
    case "tiktok": {
      const scopes = ["user.info.basic", "video.publish", "video.upload"].join(",");
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?` +
        `client_key=${TIKTOK_CLIENT_KEY}` +
        `&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/social/callback/tiktok`)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${businessId}` +
        `&response_type=code`;
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  return NextResponse.redirect(authUrl);
}

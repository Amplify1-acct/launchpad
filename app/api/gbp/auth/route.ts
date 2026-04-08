import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const GBP_CLIENT_ID = process.env.GOOGLE_GBP_CLIENT_ID!;
const GBP_CLIENT_SECRET = process.env.GOOGLE_GBP_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/gbp/callback`;

// GET /api/gbp/auth — redirect to Google OAuth
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const scopes = [
    "https://www.googleapis.com/auth/business.manage",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GBP_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", businessId);

  return NextResponse.redirect(authUrl.toString());
}

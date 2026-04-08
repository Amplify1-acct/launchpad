import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const GBP_CLIENT_ID = process.env.GOOGLE_GBP_CLIENT_ID!;
const GBP_CLIENT_SECRET = process.env.GOOGLE_GBP_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/gbp/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const businessId = searchParams.get("state");

  if (!code || !businessId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/website?error=gbp_auth_failed`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GBP_CLIENT_ID,
      client_secret: GBP_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString(),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.refresh_token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/website?error=gbp_no_refresh_token`);
  }

  // Get the GBP account ID
  const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const accountsData = await accountsRes.json();
  const accountId = accountsData.accounts?.[0]?.name; // e.g. "accounts/123456789"

  // Get the location (GBP listing)
  let locationId = null;
  if (accountId) {
    const locsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const locsData = await locsRes.json();
    locationId = locsData.locations?.[0]?.name; // e.g. "accounts/123/locations/456"
  }

  // Store tokens and GBP IDs in businesses table
  const supabase = createAdminClient();
  await supabase.from("businesses").update({
    gbp_refresh_token: tokenData.refresh_token,
    gbp_account_id: accountId,
    gbp_location_id: locationId,
    gbp_connected_at: new Date().toISOString(),
  }).eq("id", businessId);

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/website?success=gbp_connected`);
}

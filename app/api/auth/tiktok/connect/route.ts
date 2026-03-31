import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import crypto from "crypto";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;
  const codeVerifier = crypto.randomBytes(40).toString("hex");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // Store verifier in state (in production use a server-side store/cookie)
  const state = JSON.stringify({ business_id: businessId, user_id: user.id, cv: codeVerifier });

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic,video.publish,video.upload",
    redirect_uri: redirectUri,
    state: Buffer.from(state).toString("base64"),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(`https://www.tiktok.com/v2/auth/authorize?${params}`);
}

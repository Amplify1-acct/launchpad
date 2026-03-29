import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL!));

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/tiktok/callback`;
  const scope = "user.info.basic,video.publish,video.upload";
  const csrfState = Math.random().toString(36).substring(2);

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("scope", scope);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", `${user.id}:${csrfState}`);

  return NextResponse.redirect(url.toString());
}

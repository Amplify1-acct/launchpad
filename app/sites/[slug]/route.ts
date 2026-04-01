import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// This route serves customer sites at *.exsisto.ai
// Next.js middleware detects the subdomain and rewrites to /sites/[slug]
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const supabase = createAdminClient();

  // Look up business by subdomain slug
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("subdomain", slug)
    .single();

  if (!business) {
    return new NextResponse(notFoundHTML(slug), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Get their website HTML
  const { data: website } = await supabase
    .from("websites")
    .select("custom_html, status")
    .eq("business_id", business.id)
    .single();

  if (!website?.custom_html || website.status !== "live") {
    return new NextResponse(buildingHTML(business.name), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  return new NextResponse(website.custom_html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}

function notFoundHTML(slug: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Site not found</title>
  <style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fcf8ff;margin:0;}
  .box{text-align:center;padding:48px;}.logo{font-size:24px;font-weight:800;color:#1b1b25;margin-bottom:8px;}
  .logo span{color:#4648d4;}.sub{color:#9090a8;font-size:14px;}</style></head>
  <body><div class="box"><div class="logo">Ex<span>sisto</span></div>
  <p class="sub">No site found for <strong>${slug}.exsisto.ai</strong></p></div></body></html>`;
}

function buildingHTML(name: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${name} — Coming Soon</title>
  <meta http-equiv="refresh" content="15"/>
  <style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fcf8ff;margin:0;}
  .box{text-align:center;padding:48px;}.logo{font-size:24px;font-weight:800;color:#1b1b25;margin-bottom:8px;}
  .logo span{color:#4648d4;}.title{font-size:28px;font-weight:800;color:#1b1b25;margin:24px 0 8px;}
  .sub{color:#9090a8;font-size:14px;max-width:320px;margin:0 auto;line-height:1.6;}
  .spinner{width:32px;height:32px;border:3px solid #ede9f8;border-top-color:#4648d4;border-radius:50%;animation:spin 1s linear infinite;margin:24px auto;}
  @keyframes spin{to{transform:rotate(360deg);}}</style></head>
  <body><div class="box">
  <div class="logo">Ex<span>sisto</span></div>
  <div class="spinner"></div>
  <div class="title">${name}</div>
  <p class="sub">Your site is being built. This page will refresh automatically.</p>
  </div></body></html>`;
}

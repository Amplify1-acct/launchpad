import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";

// Serves a fully navigable preview of a site that hasn't gone live yet.
// Rewrites all internal links to stay within this preview route.
export async function GET(
  request: Request,
  { params }: { params: { business_id: string; page?: string[] } }
) {
  const secret = request.headers.get("x-admin-secret");
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");
  const token = secret || secretParam;

  if (token !== ADMIN_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { business_id } = params;
  const pagePath = (params.page || []).join("/").toLowerCase();

  const supabase = createAdminClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, subdomain")
    .eq("id", business_id)
    .single();

  if (!business) {
    return new NextResponse("Business not found", { status: 404 });
  }

  const { data: website } = await supabase
    .from("websites")
    .select("custom_html, services_html, about_html, contact_html, blog_index_html, status")
    .eq("business_id", business_id)
    .single();

  if (!website?.custom_html) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2>Site hasn't been built yet</h2>
        <p style="color:#666;margin-top:8px">Use the admin dashboard to build this site first.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const PAGE_MAP: Record<string, string> = {
    "":         "custom_html",
    "services": "services_html",
    "about":    "about_html",
    "contact":  "contact_html",
    "blog":     "blog_index_html",
  };

  const col = PAGE_MAP[pagePath] ?? "custom_html";
  let html = (website as any)[col] || website.custom_html;

  // Base URL for this preview — all relative links rewritten to stay in preview
  const basePreviewUrl = `/api/admin/preview/${business_id}?secret=${ADMIN_SECRET}`;

  // Rewrite internal links so navigation works inside the iframe
  // Pattern: href="/" or href="/about" etc → href="/api/admin/preview/[id]/about?secret=..."
  html = html.replace(
    /href="(\/(?:services|about|contact|blog)?(?:\/[^"?#]*)?)"/g,
    (match: string, path: string) => {
      const clean = path.replace(/^\//, "").replace(/\/$/, "") || "";
      const previewPath = clean
        ? `/api/admin/preview/${business_id}/${clean}?secret=${ADMIN_SECRET}`
        : `/api/admin/preview/${business_id}?secret=${ADMIN_SECRET}`;
      return `href="${previewPath}"`;
    }
  );

  // Inject a thin admin bar at the top
  const adminBar = `
<div style="position:fixed;top:0;left:0;right:0;z-index:999999;background:#1b1b25;color:#fff;
  display:flex;align-items:center;justify-content:space-between;padding:8px 16px;
  font-family:-apple-system,sans-serif;font-size:12px;font-weight:600;">
  <span style="color:#9090a8;">PREVIEW: <span style="color:#fff;">${business.name}</span></span>
  <span style="display:flex;gap:12px;align-items:center;">
    <a href="/api/admin/preview/${business_id}?secret=${ADMIN_SECRET}" 
       style="color:#9090a8;text-decoration:none;">Home</a>
    <a href="/api/admin/preview/${business_id}/about?secret=${ADMIN_SECRET}" 
       style="color:#9090a8;text-decoration:none;">About</a>
    <a href="/api/admin/preview/${business_id}/services?secret=${ADMIN_SECRET}" 
       style="color:#9090a8;text-decoration:none;">Services</a>
    <a href="/api/admin/preview/${business_id}/contact?secret=${ADMIN_SECRET}" 
       style="color:#9090a8;text-decoration:none;">Contact</a>
    <a href="/api/admin/preview/${business_id}/blog?secret=${ADMIN_SECRET}" 
       style="color:#9090a8;text-decoration:none;">Blog</a>
    <span style="color:#4a4a5a;">|</span>
    <span style="color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;font-size:10px;">
      ${website.status}
    </span>
  </span>
</div>
<div style="height:37px;"></div>`;

  html = html.replace(/<body[^>]*>/, (m: string) => m + adminBar);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

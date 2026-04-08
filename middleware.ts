import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // ── Subdomain detection ────────────────────────────────────────────────
  // Matches: mattysautomotive.exsisto.ai
  const isExsistoDomain = host.endsWith(".exsisto.ai");
  const isWww = host === "www.exsisto.ai";
  const isRoot = host === "exsisto.ai";
  const isVercelPreview = host.includes(".vercel.app");
  const isLocalhost = host.startsWith("localhost");

  if (isExsistoDomain && !isWww && !isRoot && !isVercelPreview && !isLocalhost) {
    const subdomain = host.replace(".exsisto.ai", "");
    if (!url.pathname.startsWith("/sites/")) {
      url.pathname = `/sites/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── 518advertising.com ────────────────────────────────────────────────
  const is518 = host === "518advertising.com" || host === "www.518advertising.com";
  if (is518) {
    url.pathname = "/518/index.html";
    return NextResponse.rewrite(url);
  }

  // ── Custom domain routing ──────────────────────────────────────────────
  // If request is to a non-Exsisto domain, look up customer by custom_domain
  const isKnownDomain = isExsistoDomain || isWww || isRoot || isVercelPreview || isLocalhost || is518;

  if (!isKnownDomain && !url.pathname.startsWith("/sites/") && !url.pathname.startsWith("/api/")) {
    try {
      const supabase = createAdminClient();
      // Strip www. for lookup
      const cleanHost = host.replace(/^www\./, "");
      const { data: biz } = await supabase
        .from("businesses")
        .select("subdomain")
        .eq("custom_domain", cleanHost)
        .single();

      if (biz?.subdomain) {
        url.pathname = `/sites/${biz.subdomain}${url.pathname === "/" ? "" : url.pathname}`;
        return NextResponse.rewrite(url);
      }
    } catch {
      // Not a customer domain — fall through to normal routing
    }
  }

  // ── Normal app routing ─────────────────────────────────────────────────
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)" ],
};

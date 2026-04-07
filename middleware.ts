import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // ── Subdomain detection ────────────────────────────────────────────────
  // Matches: mattysautomotive.exsisto.ai
  // Does NOT match: exsisto.ai, www.exsisto.ai, localhost, vercel.app preview URLs
  const isExsistoDomain = host.endsWith(".exsisto.ai");
  const isWww = host === "www.exsisto.ai";
  const isRoot = host === "exsisto.ai";
  const isVercelPreview = host.includes(".vercel.app");
  const isLocalhost = host.startsWith("localhost");

  if (isExsistoDomain && !isWww && !isRoot && !isVercelPreview && !isLocalhost) {
    const subdomain = host.replace(".exsisto.ai", "");

    // Don't rewrite if already on the sites route
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

  // ── Normal app routing ─────────────────────────────────────────────────
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

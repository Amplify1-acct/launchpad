import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // ── Subdomain detection ────────────────────────────────────────────────
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
  // For non-Exsisto domains, look up the customer via Supabase REST API
  // (using fetch directly — edge-runtime safe, no Node.js Supabase client)
  const isKnownDomain = isExsistoDomain || isWww || isRoot || isVercelPreview || isLocalhost || is518;

  if (!isKnownDomain && !url.pathname.startsWith("/sites/") && !url.pathname.startsWith("/api/")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const cleanHost = host.replace(/^www\./, "");
        const res = await fetch(
          `${supabaseUrl}/rest/v1/businesses?custom_domain=eq.${encodeURIComponent(cleanHost)}&select=subdomain&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
          }
        );
        const data: { subdomain: string }[] = await res.json();
        if (data?.[0]?.subdomain) {
          url.pathname = `/sites/${data[0].subdomain}${url.pathname === "/" ? "" : url.pathname}`;
          return NextResponse.rewrite(url);
        }
      } catch {
        // Not a customer domain — fall through
      }
    }
  }

  // ── Normal app routing ─────────────────────────────────────────────────
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

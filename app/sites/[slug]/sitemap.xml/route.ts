import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Get business + website data
  const [bizRes, siteRes, postsRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/businesses?subdomain=eq.${slug}&select=id,name,city,state,plan&limit=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }),
    fetch(`${supabaseUrl}/rest/v1/websites?select=generated_tokens,plan,service_detail_1_html,service_detail_2_html,service_detail_3_html,service_detail_4_html,service_detail_5_html,service_detail_6_html&limit=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }),
    fetch(`${supabaseUrl}/rest/v1/blog_posts?status=eq.published&select=slug,approved_at&order=approved_at.desc&limit=50`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }),
  ]);

  const [bizArr, siteArr, posts] = await Promise.all([bizRes.json(), siteRes.json(), postsRes.json()]);
  const biz = bizArr?.[0];
  const site = siteArr?.[0];
  if (!biz) return new NextResponse("Not found", { status: 404 });

  const domain = biz.custom_domain || `${slug}.exsisto.ai`;
  const base = `https://${domain}`;
  const now = new Date().toISOString();
  const plan = site?.plan || biz?.plan || "starter";

  const tokens = site?.generated_tokens || {};
  const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const urls: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [
    { loc: base, lastmod: now, priority: "1.0", changefreq: "weekly" },
    { loc: `${base}/about`, lastmod: now, priority: "0.8", changefreq: "monthly" },
    { loc: `${base}/contact`, lastmod: now, priority: "0.8", changefreq: "monthly" },
    { loc: `${base}/blog`, lastmod: now, priority: "0.9", changefreq: "weekly" },
  ];

  // Services page (Pro + Premium)
  if (plan !== "starter") {
    urls.push({ loc: `${base}/services`, lastmod: now, priority: "0.9", changefreq: "monthly" });

    // Service detail pages
    const maxServices = plan === "premium" ? 6 : 3;
    for (let i = 1; i <= maxServices; i++) {
      const svcName = tokens[`service_${i}_name`];
      if (svcName && site?.[`service_detail_${i}_html`]) {
        urls.push({ loc: `${base}/services/${toSlug(svcName)}`, lastmod: now, priority: "0.8", changefreq: "monthly" });
      }
    }

    // Location landing pages (Premium)
    if (plan === "premium" && tokens.service_1_name && biz.city) {
      const citySlug = toSlug(biz.city);
      const stateSlug = toSlug(biz.state || "");
      for (let i = 1; i <= 3; i++) {
        const svcName = tokens[`service_${i}_name`];
        if (svcName) {
          urls.push({ loc: `${base}/local/${toSlug(svcName)}-${citySlug}-${stateSlug}`, lastmod: now, priority: "0.9", changefreq: "monthly" });
        }
      }
    }
  }

  // Blog posts
  for (const post of (posts || [])) {
    urls.push({ loc: `${base}/blog/${post.slug}`, lastmod: post.approved_at || now, priority: "0.7", changefreq: "never" });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod.split("T")[0]}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

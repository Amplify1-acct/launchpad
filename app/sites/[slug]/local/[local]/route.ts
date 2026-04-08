import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function h(str: string) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export async function GET(
  request: Request,
  { params }: { params: { slug: string; local: string } }
) {
  const { slug, local } = params;

  // Look up business
  const bizRes = await fetch(
    `${supabaseUrl}/rest/v1/businesses?subdomain=eq.${slug}&select=id,name,city,state,phone,email,industry&limit=1`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }
  );
  const bizArr = await bizRes.json();
  const biz = bizArr?.[0];
  if (!biz) return new NextResponse("Not found", { status: 404 });

  // Check plan — Premium only
  const siteRes = await fetch(
    `${supabaseUrl}/rest/v1/websites?business_id=eq.${biz.id}&select=plan,generated_tokens&limit=1`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }
  );
  const siteArr = await siteRes.json();
  const site = siteArr?.[0];
  if (site?.plan !== "premium") return new NextResponse("Not found", { status: 404 });

  // Parse the local slug to extract service and location
  const tokens = site?.generated_tokens || {};
  const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const citySlug = toSlug(biz.city || "");
  const stateSlug = toSlug(biz.state || "");

  let serviceName = "";
  for (let i = 1; i <= 6; i++) {
    const svc = tokens[`service_${i}_name`];
    if (svc && local.startsWith(toSlug(svc))) {
      serviceName = svc;
      break;
    }
  }

  if (!serviceName) return new NextResponse("Not found", { status: 404 });

  const title = `${h(serviceName)} in ${h(biz.city)}, ${h(biz.state || "")} | ${h(biz.name)}`;
  const description = `Looking for ${serviceName.toLowerCase()} in ${biz.city}, ${biz.state || ""}? ${biz.name} provides professional ${serviceName.toLowerCase()} services to residents and businesses in ${biz.city} and surrounding areas.`;

  // Schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": { "@type": "LocalBusiness", "name": biz.name, "telephone": biz.phone || "" },
    "areaServed": { "@type": "City", "name": biz.city },
    "serviceLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": biz.city, "addressRegion": biz.state || "", "addressCountry": "US" } },
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <meta name="description" content="${description.slice(0, 160)}"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#111;background:#fff;padding-top:64px}
    nav{position:fixed;top:0;width:100%;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid #f0f0f0;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;}
  </style>
</head>
<body>
  <nav>
    <a href="/" style="font-size:16px;font-weight:900;text-decoration:none;color:#111;">${h(biz.name)}</a>
    <div style="display:flex;align-items:center;gap:24px;">
      <a href="/services" style="font-size:14px;color:#555;text-decoration:none;font-weight:500;">Services</a>
      <a href="/about" style="font-size:14px;color:#555;text-decoration:none;font-weight:500;">About</a>
      <a href="/contact" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">Contact Us</a>
    </div>
  </nav>

  <section style="background:linear-gradient(135deg,#0f0f1a,#1a1a2e);color:#fff;padding:80px 24px 96px;text-align:center;">
    <div style="max-width:640px;margin:0 auto;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-bottom:16px;">${h(biz.city)}, ${h(biz.state || "")}</div>
      <h1 style="font-size:clamp(28px,6vw,52px);font-weight:900;line-height:1.05;letter-spacing:-1px;margin-bottom:20px;">
        ${h(serviceName)} in ${h(biz.city)}
      </h1>
      <p style="font-size:17px;color:rgba(255,255,255,0.7);line-height:1.7;">${description}</p>
      <div style="margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        ${biz.phone ? `<a href="tel:${(biz.phone || "").replace(/\D/g, "")}" style="background:#fff;color:#111;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">📞 Call ${h(biz.phone)}</a>` : ""}
        <a href="/contact" style="background:#4648d4;color:#fff;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">Get Free Estimate →</a>
      </div>
    </div>
  </section>

  <section style="max-width:880px;margin:0 auto;padding:80px 24px;text-align:center;">
    <h2 style="font-size:32px;font-weight:900;margin-bottom:16px;">Why Choose ${h(biz.name)}?</h2>
    <p style="font-size:16px;color:#444;line-height:1.8;max-width:600px;margin:0 auto 48px;">
      We&apos;ve been serving ${h(biz.city)} and surrounding communities with professional ${h((biz.industry || "").toLowerCase())} services. Our team is local, licensed, and committed to your satisfaction.
    </p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;">
      ${["Local & Trusted", "Licensed & Insured", "Fast Response", "Free Estimates"].map(f =>
        `<div style="padding:24px;border:1.5px solid #f0f0f0;border-radius:16px;"><div style="font-size:24px;margin-bottom:8px;">✓</div><div style="font-size:15px;font-weight:700;">${f}</div></div>`
      ).join("")}
    </div>
  </section>

  <section style="background:#f9f9ff;padding:64px 24px;text-align:center;">
    <h2 style="font-size:28px;font-weight:900;margin-bottom:16px;">Ready to Get Started?</h2>
    <p style="font-size:16px;color:#666;margin-bottom:32px;">Contact ${h(biz.name)} today for a free estimate on ${h(serviceName.toLowerCase())} in ${h(biz.city)}.</p>
    <a href="/contact" style="background:#111;color:#fff;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;display:inline-block;">Contact Us →</a>
  </section>

  <footer style="background:#111;color:rgba(255,255,255,0.6);padding:32px 24px;text-align:center;font-size:13px;">
    © ${new Date().getFullYear()} ${h(biz.name)} · ${h(serviceName)} in ${h(biz.city)}, ${h(biz.state || "")} · Powered by Exsisto
  </footer>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

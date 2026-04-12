import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function h(str: string) { return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface LocationContent {
  headline: string;
  subheadline: string;
  intro: string;
  whyUs: string;
  processTitle: string;
  processSteps: { title: string; desc: string }[];
  faqItems: { q: string; a: string }[];
  ctaText: string;
}

async function generateLocationContent(
  serviceName: string,
  businessName: string,
  city: string,
  state: string,
  industry: string,
  description: string
): Promise<LocationContent> {
  const prompt = `Generate landing page content for a local service page. Return ONLY valid JSON, no markdown.

Business: ${businessName}
Service: ${serviceName}
Location: ${city}, ${state}
Industry: ${industry}
Description: ${description}

Return this exact JSON:
{
  "headline": "4-6 word headline about ${serviceName} in ${city}",
  "subheadline": "1 sentence value prop for ${serviceName} in ${city}",
  "intro": "2-3 sentences about providing ${serviceName} in ${city}. Mention the city naturally. Mention trust/experience.",
  "whyUs": "2-3 sentences about why locals choose ${businessName} for ${serviceName}. Be specific and local-feeling.",
  "processTitle": "3-4 word title for the process section",
  "processSteps": [
    {"title": "Step 1 title (2-3 words)", "desc": "One sentence describing this step"},
    {"title": "Step 2 title (2-3 words)", "desc": "One sentence describing this step"},
    {"title": "Step 3 title (2-3 words)", "desc": "One sentence describing this step"}
  ],
  "faqItems": [
    {"q": "Question about ${serviceName} in ${city}?", "a": "1-2 sentence answer mentioning ${businessName}"},
    {"q": "Another common question?", "a": "1-2 sentence answer"},
    {"q": "Third question about cost/timing/quality?", "a": "1-2 sentence answer"}
  ],
  "ctaText": "4-6 word CTA button text"
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string; local: string } }
) {
  const { slug, local } = params;

  // Look up business
  const bizRes = await fetch(
    `${supabaseUrl}/rest/v1/businesses?subdomain=eq.${slug}&select=id,name,city,state,phone,email,industry,address,description&limit=1`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }
  );
  const bizArr = await bizRes.json();
  const biz = bizArr?.[0];
  if (!biz) return new NextResponse("Not found", { status: 404 });

  // Check plan — Premium only
  const siteRes = await fetch(
    `${supabaseUrl}/rest/v1/websites?business_id=eq.${biz.id}&select=plan,generated_tokens,location_page_slugs&limit=1`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }
  );
  const siteArr = await siteRes.json();
  const site = siteArr?.[0];
  if (site?.plan !== "premium") return new NextResponse("Not found", { status: 404 });

  const rawTokens = site?.generated_tokens;
  const tokens: Record<string, string> = rawTokens
    ? (typeof rawTokens === "string" ? JSON.parse(rawTokens) : rawTokens)
    : {};

  // Match the local slug to a service
  let serviceName = "";
  let serviceDesc = "";
  for (let i = 1; i <= 6; i++) {
    const svc = tokens[`service_${i}_name`];
    if (svc && local === toSlug(svc) + "-" + toSlug(biz.city) + "-" + toSlug(biz.state || "")) {
      serviceName = svc;
      serviceDesc = tokens[`service_${i}_description`] || "";
      break;
    }
  }

  // Also try matching without city-state (legacy format)
  if (!serviceName) {
    for (let i = 1; i <= 6; i++) {
      const svc = tokens[`service_${i}_name`];
      if (svc && local.startsWith(toSlug(svc))) {
        serviceName = svc;
        serviceDesc = tokens[`service_${i}_description`] || "";
        break;
      }
    }
  }

  if (!serviceName) return new NextResponse("Not found", { status: 404 });

  const city = biz.city || "";
  const state = biz.state || "";
  const phone = biz.phone || "";
  const phoneRaw = phone.replace(/\D/g, "");
  const domain = (biz as any).custom_domain || (slug + ".exsisto.ai");
  const baseUrl = `https://${domain}`;

  // Generate AI content (cached via route's max-age)
  let content: LocationContent;
  try {
    content = await generateLocationContent(
      serviceName,
      biz.name,
      city,
      state,
      biz.industry || "",
      biz.description || serviceDesc
    );
  } catch {
    // Fallback content if AI fails
    content = {
      headline: `${serviceName} in ${city}`,
      subheadline: `Professional ${serviceName.toLowerCase()} services from ${biz.name}`,
      intro: `${biz.name} provides expert ${serviceName.toLowerCase()} services to residents and businesses throughout ${city}, ${state}. Our team brings years of experience and local expertise to every job.`,
      whyUs: `When you need ${serviceName.toLowerCase()} in ${city}, ${biz.name} is the trusted local choice. We're fully licensed, insured, and committed to delivering results you'll be proud of.`,
      processTitle: "How It Works",
      processSteps: [
        { title: "Free Consultation", desc: "We discuss your needs and provide a detailed, no-obligation estimate." },
        { title: "Professional Service", desc: "Our experienced team completes the work on time and on budget." },
        { title: "Your Satisfaction", desc: "We follow up to ensure you're completely happy with the results." },
      ],
      faqItems: [
        { q: `Do you offer ${serviceName.toLowerCase()} in ${city}?`, a: `Yes! ${biz.name} proudly serves ${city} and the surrounding area.` },
        { q: "Are you licensed and insured?", a: `Absolutely. ${biz.name} is fully licensed and insured for your protection.` },
        { q: "How quickly can you get started?", a: "We offer prompt scheduling and work hard to accommodate urgent needs." },
      ],
      ctaText: "Get Free Estimate",
    };
  }

  const pageTitle = `${serviceName} in ${city}, ${state} | ${biz.name}`;
  const metaDesc = `${biz.name} offers professional ${serviceName.toLowerCase()} in ${city}, ${state}. ${content.subheadline} Call today for a free estimate.`.slice(0, 160);

  // Full LocalBusiness + Service schema with GeoCoordinates
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${baseUrl}/#business`,
        "name": biz.name,
        "url": baseUrl,
        "telephone": phone,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": biz.address || "",
          "addressLocality": city,
          "addressRegion": state,
          "addressCountry": "US",
        },
        "areaServed": {
          "@type": "City",
          "name": city,
          "containedInPlace": { "@type": "State", "name": state },
        },
        "priceRange": "$$",
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "08:00",
          "closes": "18:00",
        },
      },
      {
        "@type": "Service",
        "name": serviceName,
        "description": serviceDesc || content.intro,
        "provider": { "@id": `${baseUrl}/#business` },
        "areaServed": {
          "@type": "City",
          "name": city,
          "containedInPlace": { "@type": "State", "name": state },
        },
        "serviceType": serviceName,
        "offers": {
          "@type": "Offer",
          "availability": "https://schema.org/InStock",
          "areaServed": city,
        },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
          { "@type": "ListItem", "position": 2, "name": "Services", "item": `${baseUrl}/services` },
          { "@type": "ListItem", "position": 3, "name": `${serviceName} in ${city}`, "item": `${baseUrl}/local/${local}` },
        ],
      },
      {
        "@type": "FAQPage",
        "mainEntity": content.faqItems.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": { "@type": "Answer", "text": item.a },
        })),
      },
    ],
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${h(pageTitle)}</title>
  <meta name="description" content="${h(metaDesc)}"/>
  <link rel="canonical" href="${baseUrl}/local/${local}"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#111;background:#fff;padding-top:64px}
    a{color:inherit;text-decoration:none}
    nav{position:fixed;top:0;width:100%;z-index:100;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid #f0f0f0;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;}
    .hero{background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 60%,#1e1e40 100%);color:#fff;padding:80px 24px 100px;text-align:center;}
    .hero-inner{max-width:680px;margin:0 auto;}
    .breadcrumb{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.35);margin-bottom:20px;}
    h1{font-size:clamp(30px,6vw,54px);font-weight:900;line-height:1.05;letter-spacing:-1.5px;margin-bottom:20px;}
    .hero-sub{font-size:18px;color:rgba(255,255,255,0.65);line-height:1.7;margin-bottom:36px;}
    .btn-primary{background:#4648d4;color:#fff;padding:16px 32px;border-radius:10px;font-size:15px;font-weight:700;display:inline-block;}
    .btn-outline{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,0.3);padding:15px 28px;border-radius:10px;font-size:15px;font-weight:600;display:inline-block;}
    .section{max-width:880px;margin:0 auto;padding:80px 24px;}
    .section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#4648d4;margin-bottom:12px;}
    h2{font-size:clamp(24px,4vw,38px);font-weight:900;letter-spacing:-0.5px;margin-bottom:16px;}
    .prose{font-size:16px;color:#444;line-height:1.85;}
    .grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:40px;}
    .card{padding:28px;border:1.5px solid #f0f0f0;border-radius:16px;background:#fff;}
    .card-icon{font-size:28px;margin-bottom:12px;}
    .card-title{font-size:15px;font-weight:700;margin-bottom:6px;}
    .card-desc{font-size:14px;color:#666;line-height:1.6;}
    .bg-soft{background:#f9f9ff;padding:80px 24px;}
    .why-inner{max-width:880px;margin:0 auto;}
    .faq{border-top:1.5px solid #f0f0f0;padding-top:20px;margin-top:20px;}
    .faq-q{font-size:16px;font-weight:700;margin-bottom:8px;}
    .faq-a{font-size:15px;color:#555;line-height:1.7;}
    .cta-band{background:linear-gradient(135deg,#0f0f1a,#1a1a2e);color:#fff;padding:80px 24px;text-align:center;}
    footer{background:#111;color:rgba(255,255,255,0.5);padding:40px 24px;text-align:center;font-size:13px;line-height:2;}
    .loc-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;justify-content:center;}
    .loc-link{background:rgba(255,255,255,0.08);border-radius:6px;padding:6px 14px;font-size:13px;color:rgba(255,255,255,0.6);}
    @media(max-width:768px){
      nav div:not(:first-child){display:none!important}
      .grid-3{grid-template-columns:1fr!important}
      .btn-primary,.btn-outline{display:block;text-align:center;margin:8px 0}
    }
  </style>
</head>
<body>

<nav>
  <a href="${baseUrl}" style="font-size:16px;font-weight:900;color:#111;">${h(biz.name)}</a>
  <div style="display:flex;align-items:center;gap:24px;">
    <a href="${baseUrl}/services" style="font-size:14px;color:#555;font-weight:500;">Services</a>
    <a href="${baseUrl}/about" style="font-size:14px;color:#555;font-weight:500;">About</a>
    <a href="${baseUrl}/blog" style="font-size:14px;color:#555;font-weight:500;">Blog</a>
    <a href="${baseUrl}/contact" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;">Contact Us</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-inner">
    <div class="breadcrumb">${h(city)}, ${h(state)} · ${h(biz.industry || "")}</div>
    <h1>${h(content.headline)}</h1>
    <p class="hero-sub">${h(content.subheadline)}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      ${phone ? `<a href="tel:${phoneRaw}" class="btn-primary">📞 Call ${h(phone)}</a>` : ""}
      <a href="${baseUrl}/contact" class="btn-outline">${h(content.ctaText)} →</a>
    </div>
  </div>
</section>

<!-- About this service in this city -->
<div class="section">
  <div class="section-label">${h(serviceName)} · ${h(city)}, ${h(state)}</div>
  <h2>Trusted ${h(serviceName)} Serving ${h(city)}</h2>
  <p class="prose">${h(content.intro)}</p>
  <p class="prose" style="margin-top:16px;">${h(content.whyUs)}</p>
</div>

<!-- Why choose us -->
<div class="bg-soft">
  <div class="why-inner">
    <div style="text-align:center;margin-bottom:40px;">
      <div class="section-label">Why ${h(biz.name)}</div>
      <h2>Local Experts You Can Trust</h2>
    </div>
    <div class="grid-3">
      <div class="card"><div class="card-icon">📍</div><div class="card-title">Local & Trusted</div><div class="card-desc">We're based right here in ${h(city)} — this is our community too.</div></div>
      <div class="card"><div class="card-icon">🛡️</div><div class="card-title">Licensed & Insured</div><div class="card-desc">Fully licensed and insured for every job, giving you peace of mind.</div></div>
      <div class="card"><div class="card-icon">⭐</div><div class="card-title">5-Star Service</div><div class="card-desc">Our customers in ${h(city)} consistently rate us 5 stars for quality and care.</div></div>
      <div class="card"><div class="card-icon">⚡</div><div class="card-title">Fast Response</div><div class="card-desc">We respond quickly and schedule promptly — your time matters.</div></div>
      <div class="card"><div class="card-icon">💬</div><div class="card-title">Free Estimates</div><div class="card-desc">Get a clear, upfront estimate before any work begins. No surprises.</div></div>
      <div class="card"><div class="card-icon">🤝</div><div class="card-title">Satisfaction Guaranteed</div><div class="card-desc">We stand behind our work. If you're not happy, we make it right.</div></div>
    </div>
  </div>
</div>

<!-- Process -->
<div class="section">
  <div style="text-align:center;margin-bottom:40px;">
    <div class="section-label">Our Process</div>
    <h2>${h(content.processTitle)}</h2>
  </div>
  <div class="grid-3">
    ${content.processSteps.map((step, i) => `
    <div class="card" style="text-align:center;">
      <div class="card-icon" style="font-size:36px;color:#4648d4;font-weight:900;">${i + 1}</div>
      <div class="card-title" style="font-size:17px;margin:8px 0;">${h(step.title)}</div>
      <div class="card-desc">${h(step.desc)}</div>
    </div>`).join("")}
  </div>
</div>

<!-- FAQ -->
<div class="bg-soft">
  <div class="why-inner">
    <div class="section-label" style="text-align:center;">FAQ</div>
    <h2 style="text-align:center;margin-bottom:40px;">Common Questions About ${h(serviceName)} in ${h(city)}</h2>
    ${content.faqItems.map(item => `
    <div class="faq">
      <div class="faq-q">${h(item.q)}</div>
      <div class="faq-a">${h(item.a)}</div>
    </div>`).join("")}
  </div>
</div>

<!-- CTA band -->
<div class="cta-band">
  <div style="max-width:600px;margin:0 auto;">
    <h2 style="color:#fff;margin-bottom:16px;">Ready to Get Started?</h2>
    <p style="color:rgba(255,255,255,0.65);font-size:16px;line-height:1.7;margin-bottom:36px;">
      Contact ${h(biz.name)} today for expert ${h(serviceName.toLowerCase())} in ${h(city)}, ${h(state)}. Free estimates, fast response, guaranteed satisfaction.
    </p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      ${phone ? `<a href="tel:${phoneRaw}" style="background:#fff;color:#111;padding:16px 32px;border-radius:10px;font-size:15px;font-weight:700;">📞 ${h(phone)}</a>` : ""}
      <a href="${baseUrl}/contact" style="background:#4648d4;color:#fff;padding:16px 32px;border-radius:10px;font-size:15px;font-weight:700;">${h(content.ctaText)} →</a>
    </div>
  </div>
</div>

<footer>
  <div>${h(biz.name)} · ${h(serviceName)} in ${h(city)}, ${h(state)}</div>
  ${phone ? `<div>${h(phone)}</div>` : ""}
  <div style="margin-top:16px;">
    <a href="${baseUrl}" style="color:rgba(255,255,255,0.4);font-size:12px;">Home</a> ·
    <a href="${baseUrl}/services" style="color:rgba(255,255,255,0.4);font-size:12px;">Services</a> ·
    <a href="${baseUrl}/about" style="color:rgba(255,255,255,0.4);font-size:12px;">About</a> ·
    <a href="${baseUrl}/contact" style="color:rgba(255,255,255,0.4);font-size:12px;">Contact</a>
  </div>
  <div style="margin-top:12px;font-size:11px;">© ${new Date().getFullYear()} ${h(biz.name)} · Powered by Exsisto</div>
</footer>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}

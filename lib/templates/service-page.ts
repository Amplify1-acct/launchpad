// ─── SERVICE PAGE BUILDER ─────────────────────────────────────────────────────
// Generates a full dedicated page per service with 750-word AI content.
// Called after the main site generation once we have the services list.

export interface ServicePageData {
  serviceName: string;
  serviceDescription: string;  // the short description from the main site
  content: string;             // 750-word AI-written article (HTML paragraphs)
  faqs: Array<{ question: string; answer: string }>;
  metaTitle: string;
  metaDescription: string;
}

export interface ServicePageContext {
  business: {
    name: string;
    tagline: string;
    description: string;
    phone: string;
    email: string;
    city: string;
    state: string;
    accent_color: string;
    stateLicensed?: boolean;
    serviceArea?: string;
  };
  template: "trades" | "professional";
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function servicePageSlug(serviceName: string): string {
  return `services/${slug(serviceName)}.html`;
}

function sharedFonts(template: string): string {
  if (template === "professional") {
    return `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>`;
  }
  return `<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>`;
}

function sharedVars(accent: string, template: string): string {
  if (template === "professional") {
    return `
      --accent: ${accent}; --black: #0e0e0e; --dark: #1a1a18; --text: #2c2c28;
      --mid: #6a6a62; --light: #a0a098; --white: #fff; --cream: #f5f2ed;
      --border: #e0dbd2; --radius: 2px; --shadow: 0 4px 28px rgba(0,0,0,0.07);
    `;
  }
  return `
    --accent: ${accent}; --black: #111; --dark: #1c1c1c; --text: #2a2a2a;
    --mid: #666; --light: #999; --white: #fff; --bg: #f7f7f5;
    --border: #e4e4e0; --radius: 3px; --shadow: 0 4px 24px rgba(0,0,0,0.09);
  `;
}

export function buildServicePage(
  ctx: ServicePageContext,
  data: ServicePageData
): string {
  const { business: b, template } = ctx;
  const isProf = template === "professional";
  const bodyFont = isProf ? "'DM Sans', sans-serif" : "'Barlow', sans-serif";
  const headFont = isProf ? "'Cormorant Garamond', serif" : "'Barlow Condensed', sans-serif";
  const accent = b.accent_color;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${data.metaTitle}</title>
<meta name="description" content="${data.metaDescription}"/>
<meta property="og:title" content="${data.metaTitle}"/>
<meta property="og:description" content="${data.metaDescription}"/>
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": data.serviceName,
  "provider": {
    "@type": "LocalBusiness",
    "name": b.name,
    "telephone": b.phone,
    "email": b.email,
    "address": { "@type": "PostalAddress", "addressLocality": b.city, "addressRegion": b.state }
  },
  "description": data.serviceDescription,
  "areaServed": b.serviceArea || `${b.city}, ${b.state}`
})}</script>
${sharedFonts(template)}
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { ${sharedVars(accent, template)} }
  html { scroll-behavior: smooth; }
  body { font-family: ${bodyFont}; color: var(--text); background: var(--white); line-height: 1.7; -webkit-font-smoothing: antialiased; }
  a { color: inherit; text-decoration: none; }
  h1,h2,h3,h4 { font-family: ${headFont}; line-height: 1.15; }

  /* NAV */
  nav { position: sticky; top: 0; z-index: 100; background: var(--white); border-bottom: ${isProf ? "1px" : "2px"} solid var(--border); height: ${isProf ? "70px" : "68px"}; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
  .logo { font-family: ${headFont}; font-size: 1.4rem; font-weight: ${isProf ? "700" : "800"}; color: var(--black); }
  .logo em { color: var(--accent); font-style: ${isProf ? "italic" : "normal"}; }
  .nav-links { display: flex; gap: 2rem; align-items: center; }
  .nav-links a { font-size: 0.82rem; font-weight: 600; color: var(--mid); text-transform: uppercase; letter-spacing: 0.06em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--accent); }
  .nav-cta { background: ${isProf ? "var(--black)" : "var(--accent)"}; color: white !important; padding: 0.55rem 1.4rem; border-radius: var(--radius); }
  @media (max-width: 640px) { .nav-links { display: none; } nav { padding: 0 1.25rem; } }

  /* BREADCRUMB */
  .breadcrumb { font-size: 0.75rem; color: var(--light); padding: 1rem 2.5rem; background: ${isProf ? "var(--cream)" : "var(--bg, #f7f7f5)"}; border-bottom: 1px solid var(--border); letter-spacing: 0.04em; }
  .breadcrumb a { color: var(--accent); }
  .breadcrumb span { margin: 0 6px; }

  /* PAGE HERO */
  .page-hero { background: var(--dark); padding: 4rem 2.5rem; }
  .page-hero-inner { max-width: 1100px; margin: 0 auto; }
  .page-hero-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); margin-bottom: 0.75rem; display: block; }
  .page-hero h1 { font-size: clamp(2.2rem, 4vw, 3.5rem); color: white; margin-bottom: 0.75rem; }
  .page-hero-sub { font-size: 1rem; color: rgba(255,255,255,0.55); max-width: 560px; line-height: 1.7; }

  /* CONTENT LAYOUT */
  .content-layout { max-width: 1100px; margin: 0 auto; padding: 4rem 2.5rem; display: grid; grid-template-columns: 1fr 300px; gap: 4rem; align-items: start; }
  @media (max-width: 860px) { .content-layout { grid-template-columns: 1fr; } .sidebar { display: none; } }

  /* ARTICLE */
  .article h2 { font-size: clamp(1.4rem, 2.5vw, 1.9rem); color: var(--black); margin: 2.5rem 0 1rem; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  .article h2:first-child { margin-top: 0; padding-top: 0; border-top: none; }
  .article h3 { font-size: 1.15rem; color: var(--black); margin: 1.75rem 0 0.6rem; font-weight: ${isProf ? "600" : "700"}; }
  .article p { font-size: ${isProf ? "1rem" : "0.95rem"}; color: var(--text); line-height: 1.85; margin-bottom: 1.1rem; }
  .article ul { margin: 0.75rem 0 1rem 1.5rem; }
  .article ul li { font-size: 0.95rem; color: var(--text); line-height: 1.75; margin-bottom: 0.4rem; }
  .article ul li::marker { color: var(--accent); }

  /* FAQ */
  .faq-section { margin-top: 3rem; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  .faq-section h2 { font-size: clamp(1.4rem, 2.5vw, 1.9rem); color: var(--black); margin-bottom: 1.5rem; }
  .faq-item { border-bottom: 1px solid var(--border); padding: 1rem 0; }
  .faq-q { font-weight: 700; color: var(--black); font-size: 0.95rem; margin-bottom: 0.5rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
  .faq-q:hover { color: var(--accent); }
  .faq-icon { color: var(--accent); flex-shrink: 0; transition: transform 0.2s; }
  .faq-a { font-size: 0.9rem; color: var(--mid); line-height: 1.75; padding-bottom: 0.25rem; display: none; }
  .faq-item.open .faq-a { display: block; }
  .faq-item.open .faq-icon { transform: rotate(45deg); }

  /* SIDEBAR */
  .sidebar { position: sticky; top: 88px; }
  .sidebar-card { background: ${isProf ? "var(--cream)" : "var(--bg, #f7f7f5)"}; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.5rem; }
  .sidebar-card h3 { font-size: 1rem; font-weight: 700; color: var(--black); margin-bottom: 1rem; }
  .sidebar-cta { background: var(--accent); padding: 1.5rem; border-radius: var(--radius); text-align: center; }
  .sidebar-cta h3 { color: white; font-size: 1.1rem; margin-bottom: 0.5rem; }
  .sidebar-cta p { color: rgba(255,255,255,0.75); font-size: 0.85rem; margin-bottom: 1.25rem; line-height: 1.5; }
  .sidebar-btn { display: block; background: var(--black); color: white; padding: 0.75rem 1.25rem; border-radius: var(--radius); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem; text-align: center; }
  .sidebar-phone { display: block; color: rgba(255,255,255,0.7); font-size: 0.85rem; text-align: center; margin-top: 0.5rem; }
  .related-list a { display: block; font-size: 0.85rem; color: var(--mid); padding: 0.5rem 0; border-bottom: 1px solid var(--border); transition: color 0.2s; }
  .related-list a:hover { color: var(--accent); }
  .related-list a::before { content: '→ '; color: var(--accent); }

  /* CTA BANNER */
  .cta-banner { background: var(--dark); padding: 4rem 2.5rem; margin-top: 0; text-align: center; }
  .cta-banner h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); color: white; margin-bottom: 1rem; }
  .cta-banner h2 em { color: var(--accent); font-style: normal; }
  .cta-banner p { color: rgba(255,255,255,0.55); font-size: 0.95rem; margin-bottom: 2rem; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 0.9rem 2rem; font-family: ${bodyFont}; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border-radius: var(--radius); transition: all 0.2s; }
  .btn-accent { background: var(--accent); color: white; }
  .btn-accent:hover { filter: brightness(1.08); }

  /* FOOTER */
  footer { background: var(--black); color: rgba(255,255,255,0.45); padding: 2.5rem; text-align: center; font-size: 0.8rem; }
  footer .logo { font-family: ${headFont}; font-size: 1.4rem; color: white; margin-bottom: 0.5rem; display: block; }
  footer .logo em { color: var(--accent); font-style: ${isProf ? "italic" : "normal"}; }
</style>
</head>
<body>

<nav>
  <div class="logo">${b.name.split(" ")[0]} <em>${b.name.split(" ").slice(1).join(" ")}</em></div>
  <div class="nav-links">
    <a href="../index.html">Home</a>
    <a href="../services.html" style="color:var(--accent)">Services</a>
    <a href="../about.html">About</a>
    <a href="../contact.html">Contact</a>
    <a href="../contact.html" class="nav-cta">${isProf ? "Free Consultation" : "Free Quote"}</a>
  </div>
</nav>

<div class="breadcrumb">
  <a href="../index.html">Home</a><span>›</span>
  <a href="../services.html">Services</a><span>›</span>
  ${data.serviceName}
</div>

<div class="page-hero">
  <div class="page-hero-inner">
    <span class="page-hero-label">${b.name} · ${b.serviceArea || `${b.city}, ${b.state}`}</span>
    <h1>${data.serviceName}</h1>
    <p class="page-hero-sub">${data.serviceDescription}</p>
  </div>
</div>

<div class="content-layout">
  <div class="article">
    ${data.content}

    <!-- FAQ -->
    ${data.faqs.length > 0 ? `
    <div class="faq-section">
      <h2>Frequently Asked Questions</h2>
      ${data.faqs.map(f => `
      <div class="faq-item">
        <div class="faq-q">${f.question}<span class="faq-icon">+</span></div>
        <div class="faq-a">${f.answer}</div>
      </div>`).join("")}
    </div>` : ""}

    <!-- Bottom CTA -->
    <div style="margin-top:3rem;padding:2rem;background:${isProf ? "var(--cream)" : "var(--bg,#f7f7f5)"};border-radius:var(--radius);border-left:4px solid var(--accent)">
      <div style="font-family:${headFont};font-size:1.3rem;font-weight:700;margin-bottom:0.5rem">Ready to get started?</div>
      <div style="font-size:0.9rem;color:var(--mid);margin-bottom:1.25rem">Contact ${b.name} today for a free ${isProf ? "consultation" : "estimate"}.</div>
      <a href="../contact.html" class="btn btn-accent">${isProf ? "Schedule a Free Consultation →" : "Get a Free Quote →"}</a>
    </div>
  </div>

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-cta">
      <h3>Get a Free ${isProf ? "Consultation" : "Estimate"}</h3>
      <p>Speak with ${b.name} about your ${data.serviceName.toLowerCase()} needs.</p>
      <a href="../contact.html" class="sidebar-btn">Contact Us →</a>
      ${b.phone ? `<a href="tel:${b.phone}" class="sidebar-phone">${b.phone}</a>` : ""}
    </div>
  </aside>
</div>

<div class="cta-banner">
  <h2>${b.name} — <em>${b.tagline}</em></h2>
  <p>Serving clients ${b.serviceArea || `in ${b.city}, ${b.state}`}.</p>
  <a href="../contact.html" class="btn btn-accent">${isProf ? "Schedule Your Free Consultation →" : "Get Your Free Quote →"}</a>
</div>

<footer>
  <span class="logo">${b.name.split(" ")[0]} <em>${b.name.split(" ").slice(1).join(" ")}</em></span>
  <div>© ${new Date().getFullYear()} ${b.name}. All rights reserved. Website by <a href="https://exsisto.ai" style="color:var(--accent)">Exsisto</a>.</div>
</footer>

<script>
document.querySelectorAll(".faq-item").forEach(item => {
  item.querySelector(".faq-q").addEventListener("click", () => item.classList.toggle("open"));
});
</script>
</body>
</html>`;
}

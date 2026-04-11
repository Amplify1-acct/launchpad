import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_COLUMNS: Record<string, string> = {
  "":         "custom_html",
  "services": "services_html",
  "about":    "about_html",
  "contact":  "contact_html",
  "blog":     "blog_index_html",
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string; page?: string[] } }
) {
  const { slug } = params;
  const pagePath = (params.page || []).join("/").toLowerCase();
  // Shared Supabase credentials for all REST fetches
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Look up business by subdomain using direct REST fetch
  let business: { id: string; name: string; custom_domain?: string; city?: string; state?: string } | null = null;
  try {
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?subdomain=eq.${encodeURIComponent(slug)}&select=id,name,custom_domain,city,state&limit=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Cache-Control": "no-cache" }, cache: "no-store" }
    );
    const bizData = await bizRes.json();
    business = Array.isArray(bizData) && bizData.length > 0 ? bizData[0] : null;
  } catch (e) {
    console.error("Business fetch failed:", e);
  }

  if (!business) {
    return new NextResponse(notFoundHTML(slug), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Sitemap
  if (pagePath === "sitemap.xml") {
    const [siteRes, postsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/websites?business_id=eq.${business.id}&select=generated_tokens,plan,service_detail_1_html,service_detail_2_html,service_detail_3_html,service_detail_4_html,service_detail_5_html,service_detail_6_html&limit=1`,
        { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }),
      fetch(`${supabaseUrl}/rest/v1/blog_posts?business_id=eq.${business.id}&status=eq.published&select=slug,approved_at&order=approved_at.desc&limit=50`,
        { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }),
    ]);
    const [siteArr, posts] = await Promise.all([siteRes.json(), postsRes.json()]);
    const site = siteArr?.[0];
    const rawSitemapTokens = site?.generated_tokens;
    const tokens = rawSitemapTokens ? (typeof rawSitemapTokens === 'string' ? JSON.parse(rawSitemapTokens) : rawSitemapTokens) : {};
    const plan = site?.plan || "starter";
    const toSlug2 = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const domain = (business as any).custom_domain || (slug + ".exsisto.ai");
    const base = `https://${domain}`;
    const now = new Date().toISOString();
    const urls: string[] = [
      `<url><loc>${base}</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>`,
      `<url><loc>${base}/about</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>`,
      `<url><loc>${base}/contact</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>`,
      `<url><loc>${base}/blog</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>`,
    ];
    if (plan !== "starter") {
      urls.push(`<url><loc>${base}/services</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>`);
      const maxSvc = plan === "premium" ? 6 : 3;
      for (let i = 1; i <= maxSvc; i++) {
        const svcName = tokens[`service_${i}_name`];
        if (svcName && (site as any)?.[`service_detail_${i}_html`]) {
          urls.push(`<url><loc>${base}/services/${toSlug2(svcName)}</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>`);
        }
      }
    }
    for (const post of (posts || [])) {
      urls.push(`<url><loc>${base}/blog/${post.slug}</loc><lastmod>${(post.approved_at || now).split("T")[0]}</lastmod><priority>0.7</priority><changefreq>never</changefreq></url>`);
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  }

  // Robots.txt
  if (pagePath === "robots.txt") {
    const domain = (business as any).custom_domain || (slug + ".exsisto.ai");
    const txt = `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml\n`;
    return new NextResponse(txt, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
  }

  // Blog post: /blog/[post-slug]
  const blogMatch = pagePath.match(/^blog\/(.+)$/);
  if (blogMatch) {
    const postSlug = blogMatch[1];
    const postRes = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?business_id=eq.${business.id}&slug=eq.${encodeURIComponent(postSlug)}&status=eq.published&select=title,content,excerpt,featured_image_url,approved_at&limit=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } }
    );
    const postArr = await postRes.json();
    const post = Array.isArray(postArr) && postArr.length > 0 ? postArr[0] : null;

    if (!post) {
      return new NextResponse(notFoundHTML(slug), { status: 404, headers: { "Content-Type": "text/html" } });
    }

    // Fetch services for internal linking
    const tokensRes = await fetch(
      `${supabaseUrl}/rest/v1/websites?business_id=eq.${business.id}&select=generated_tokens&limit=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }
    );
    const tokensData = await tokensRes.json();
    const tokens = tokensData?.[0]?.generated_tokens || {};
    const services: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const s = tokens[`service_${i}_name`];
      if (s) services.push(s);
    }

    // Fetch related posts (exclude current)
    const relatedRes = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?business_id=eq.${business.id}&status=eq.published&slug=neq.${encodeURIComponent(postSlug)}&select=title,slug,featured_image_url&order=approved_at.desc&limit=3`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }, cache: "no-store" }
    );
    const relatedPosts = await relatedRes.json() || [];

    return new NextResponse(renderBlogPost(business.name, post, services, relatedPosts, business.city, business.state), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  }

  // Blog index: /blog
  if (pagePath === "blog") {
    const postsRes = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?business_id=eq.${business.id}&status=eq.published&select=title,slug,excerpt,featured_image_url,approved_at,word_count&order=approved_at.desc`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } }
    );
    const posts = await postsRes.json();

    return new NextResponse(renderBlogIndex(business.name, posts || [], business.city, business.state), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
    });
  }

  // Get website record using direct REST fetch (bypasses any env var issues with supabase-js on subdomains)
  let website: Record<string, any> | null = null;
  try {
    const siteRes = await fetch(
      `${supabaseUrl}/rest/v1/websites?business_id=eq.${business.id}&select=custom_html,services_html,about_html,contact_html,blog_index_html,status,service_detail_1_html,service_detail_2_html,service_detail_3_html,service_detail_4_html,service_detail_5_html,service_detail_6_html,generated_tokens&limit=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Cache-Control": "no-cache" }, cache: "no-store" }
    );
    const siteData = await siteRes.json();
    website = Array.isArray(siteData) && siteData.length > 0 ? siteData[0] : null;
  } catch (e) {
    console.error("Website fetch failed:", e);
  }

  if (!website) {
    return new NextResponse(buildingHTML(business.name), {
      status: 200,
      headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
    });
  }

  if (website.status !== "live") {
    // If no HTML yet, show building screen
    return new NextResponse(buildingHTML(business.name), {
      status: 200,
      headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
    });
  }

  // Handle /services/[slug] — service detail pages
  if (pagePath.startsWith("services/")) {
    const serviceSlug = pagePath.replace("services/", "");
    const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const rawTokens = website.generated_tokens;
    const tokens = rawTokens ? (typeof rawTokens === 'string' ? JSON.parse(rawTokens) : rawTokens) : {};
    for (let i = 1; i <= 6; i++) {
      const svcName = tokens[`service_${i}_name`];
      if (svcName && toSlug(svcName) === serviceSlug) {
        const detailHtml = (website as any)[`service_detail_${i}_html`];
        if (detailHtml) {
          return new NextResponse(detailHtml, {
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
          });
        }
      }
    }
    // Service detail page not found or not generated for this plan
    return new NextResponse("Page not found", { status: 404 });
  }

  // Pick the right page HTML
  const col = PAGE_COLUMNS[pagePath] || "custom_html";
  const html = (website as any)[col] || website.custom_html;

  if (!html) {
    return new NextResponse(buildingHTML(business.name), {
      headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
    });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}

function renderBlogIndex(bizName: string, posts: any[], city?: string, state?: string): string {
  const postCards = posts.map(p => `
    <a class="post-card" href="/blog/${p.slug}">
      ${p.featured_image_url ? `<img src="${p.featured_image_url}" alt="${p.title + (city ? ' in ' + city : '')}" class="post-img"/>` : `<div class="post-img-placeholder"></div>`}
      <div class="post-info">
        <div class="post-date">${p.approved_at ? new Date(p.approved_at).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"}) : ""}</div>
        <div class="post-title">${p.title}</div>
        ${p.excerpt ? `<div class="post-excerpt">${p.excerpt}</div>` : ""}
        <div class="post-meta">${p.word_count ? `~${p.word_count} words` : ""}</div>
      </div>
    </a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Blog | ${bizName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#111;background:#fff}
    nav{padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
    .logo{font-size:16px;font-weight:900;text-decoration:none;color:#111}
    .back{font-size:13px;color:#666;text-decoration:none}
    .back:hover{color:#111}
    .hero{background:#f9f9f9;padding:64px 24px;text-align:center}
    .hero h1{font-size:clamp(28px,5vw,48px);font-weight:900;letter-spacing:-1px;margin-bottom:12px}
    .hero p{font-size:16px;color:#666}
    .posts{max-width:860px;margin:0 auto;padding:48px 24px;display:grid;gap:32px}
    .post-card{display:grid;grid-template-columns:280px 1fr;gap:24px;text-decoration:none;color:inherit;border-bottom:1px solid #f0f0f0;padding-bottom:32px}
    .post-card:last-child{border-bottom:none}
    .post-img{width:100%;height:180px;object-fit:cover;border-radius:10px;display:block}
    .post-img-placeholder{width:100%;height:180px;background:#f0f0f0;border-radius:10px}
    .post-info{display:flex;flex-direction:column;justify-content:center;gap:8px}
    .post-date{font-size:12px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .post-title{font-size:20px;font-weight:800;line-height:1.3;color:#111}
    .post-card:hover .post-title{color:#4648d4}
    .post-excerpt{font-size:14px;color:#666;line-height:1.6}
    .post-meta{font-size:12px;color:#bbb}
    .empty{text-align:center;padding:80px 24px;color:#999}
    footer{text-align:center;padding:32px;background:#f9f9f9;font-size:13px;color:#999}
    @media(max-width:600px){.post-card{grid-template-columns:1fr}.post-img{height:200px}}
  </style>
</head>
<body>
  <nav>
    <a class="logo" href="/">${bizName}</a>
    <a class="back" href="/">← Home</a>
  </nav>
  <div class="hero">
    <h1>Our Blog</h1>
    <p>Tips, news, and insights from ${bizName}</p>
  </div>
  <div class="posts">
    ${posts.length > 0 ? postCards : '<div class="empty">No posts yet — check back soon.</div>'}
  </div>
  <footer>${bizName} · Powered by Exsisto</footer>
</body>
</html>`;
}

// Convert service name to URL slug
function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Inject service page links into blog post body text
// Build a list of matchable keywords from a service name
// "Organic Deep Conditioning" -> ["deep conditioning", "conditioning"]
function getServiceKeywords(name: string): string[] {
  const stop = new Set(["and","or","the","a","an","for","of","in","with","our","your",
    "natural","organic","professional","expert","special","events","services","bridal","care"]);
  const lower = name.toLowerCase();
  const words = lower.split(/\s+/).filter((w: string) => w.length > 3 && !stop.has(w));
  const kws: string[] = [];
  // Cleaned full name (strip leading/trailing stop words)
  const cleaned = lower.replace(/^(natural|organic|professional|expert)\s+/,"").replace(/\s+(services|solutions|care)$/,"");
  if (cleaned.length > 4 && cleaned !== lower) kws.push(cleaned);
  // Full name
  kws.push(lower);
  // First two significant words
  if (words.length >= 2) kws.push(words[0] + " " + words[1]);
  // Individual significant words
  words.forEach((w: string) => { if (w.length > 4) kws.push(w); });
  return Array.from(new Set(kws)).sort((a: string, b: string) => b.length - a.length);
}

function injectServiceLinks(text: string, services: string[]): string {
  if (!services?.length || !text) return text;
  let result = text;
  const linked = new Set<string>();
  for (const svc of services) {
    const slug = toSlug(svc);
    if (linked.has(slug)) continue;
    for (const kw of getServiceKeywords(svc)) {
      const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp("\\b(" + esc + ")\\b", "gi");
      let hit = false;
      const attempt = result.replace(rx, (m: string) => {
        if (hit) return m;
        hit = true;
        return `<a href="/services/${slug}" style="color:#4648d4;text-decoration:underline;font-weight:600;">${m}</a>`;
      });
      if (hit) { result = attempt; linked.add(slug); break; }
    }
  }
  return result;
}

function renderBlogPost(bizName: string, post: any, services: string[] = [], relatedPosts: any[] = [], city?: string, state?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${post.title} | ${bizName}</title>
  <meta name="description" content="${post.excerpt || ""}"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#111;background:#fff;line-height:1.7}
    nav{padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
    .logo{font-size:16px;font-weight:900;text-decoration:none;color:#111}
    .back{font-size:13px;color:#666;text-decoration:none}
    .back:hover{color:#111}
    .hero-img{width:100%;height:400px;object-fit:cover;display:block}
    article{max-width:720px;margin:0 auto;padding:48px 24px 80px}
    .date{font-size:13px;color:#999;margin-bottom:16px}
    h1{font-size:clamp(28px,5vw,42px);font-weight:900;line-height:1.1;letter-spacing:-1px;margin-bottom:24px}
    .body{font-size:17px;color:#333;line-height:1.8}
    .body p{margin-bottom:20px}
    .body h2{font-size:24px;font-weight:800;margin:32px 0 12px}
    .body h3{font-size:20px;font-weight:700;margin:24px 0 10px}
    .body ul,.body ol{margin:0 0 20px 24px}
    .body li{margin-bottom:8px}
    footer{text-align:center;padding:32px;background:#f9f9f9;font-size:13px;color:#999}
  </style>
</head>
<body>
  <nav>
    <a class="logo" href="/">${bizName}</a>
    <a class="back" href="/blog">← All Posts</a>
  </nav>
  ${post.featured_image_url ? `<img class="hero-img" src="${post.featured_image_url}" alt="${post.title + (city ? ' | ' + city + ', ' + state : '')}" />` : ""}
  <article>
    <div class="date">${post.approved_at ? new Date(post.approved_at).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"}) : ""}</div>
    <h1>${post.title}</h1>
    <div class="body">${injectServiceLinks((post.content || ""), services).split("\n\n").map((p: string) => `<p>${p}</p>`).join("")}</div>
    ${relatedPosts.length > 0 ? `
    <div style="margin-top:48px;padding-top:32px;border-top:1.5px solid #f0f0f0;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:20px;">Related Posts</div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${relatedPosts.map((p: any) => `
          <a href="/blog/${p.slug}" style="display:flex;gap:16px;text-decoration:none;color:inherit;align-items:center;">
            ${p.featured_image_url ? `<img src="${p.featured_image_url}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;" alt="${p.title + (city ? ' in ' + city : '')}"/>` : `<div style="width:80px;height:60px;background:#f5f3ff;border-radius:8px;flex-shrink:0;"></div>`}
            <div style="font-size:15px;font-weight:700;color:#111;line-height:1.4;">${p.title}</div>
          </a>`).join("")}
      </div>
    </div>` : ""}
  </article>
  <footer>${bizName} · Powered by Exsisto</footer>
</body>
</html>`;
}

function notFoundHTML(slug: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Not Found</title>
  <style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fcf8ff;margin:0;}
  .box{text-align:center;padding:48px;}.logo{font-size:24px;font-weight:800;color:#1b1b25;margin-bottom:8px;}
  .logo span{color:#4648d4;}.sub{color:#9090a8;font-size:14px;}</style></head>
  <body><div class="box"><div class="logo">Ex<span>sisto</span></div>
  <p class="sub">Page not found on <strong>${slug}.exsisto.ai</strong></p>
  <p style="margin-top:16px"><a href="/" style="color:#4648d4">← Back to home</a></p>
  </div></body></html>`;
}

function readyHTML(name: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${name} — Coming Soon</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fcf8ff;margin:0}
    .box{text-align:center;padding:48px 32px;max-width:440px}
    .logo{font-size:22px;font-weight:800;color:#1b1b25;margin-bottom:32px}
    .logo span{color:#4648d4}
    .badge{display:inline-block;background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:20px}
    .title{font-size:26px;font-weight:800;color:#1b1b25;margin-bottom:10px;line-height:1.2}
    .sub{color:#6b6b8a;font-size:14px;line-height:1.6;margin-bottom:28px}
    .btn{display:inline-block;background:#4648d4;color:#fff;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;transition:opacity 0.2s}
    .btn:hover{opacity:0.9}
    .hint{font-size:12px;color:#9090a8;margin-top:16px}
  </style></head>
  <body><div class="box">
    <div class="logo">Ex<span>sisto</span></div>
    <div class="badge">✓ Site Ready</div>
    <div class="title">${name} is almost live!</div>
    <p class="sub">Your website has been built and is ready to review. Log in to your dashboard to preview and publish it.</p>
    <a class="btn" href="https://exsisto.ai/login">Review &amp; Publish →</a>
    <p class="hint">Already logged in? <a href="https://exsisto.ai/dashboard/website" style="color:#4648d4">Go to your dashboard</a></p>
  </div></body></html>`;
}

function buildingHTML(name: string): string {
  return `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"/>
  <title>${name} — Building Your Site</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9f9ff;color:#1b1b25}
    .box{text-align:center;padding:48px 32px;max-width:480px;width:100%}
    .logo{font-size:20px;font-weight:800;color:#1b1b25;margin-bottom:40px}
    .logo span{color:#4648d4}
    .icon{font-size:52px;margin-bottom:20px;display:block}
    h1{font-size:24px;font-weight:800;margin-bottom:10px}
    .sub{color:#9090a8;font-size:15px;line-height:1.7;margin-bottom:28px}
    .progress-bar{width:100%;height:6px;background:#ede9f8;border-radius:100px;margin-bottom:12px;overflow:hidden}
    .progress-fill{height:100%;background:linear-gradient(90deg,#4648d4,#6366f1);border-radius:100px;animation:prog 270s linear forwards}
    @keyframes prog{from{width:2%}to{width:95%}}
    .timer{font-size:13px;color:#9090a8;margin-bottom:28px}
    .timer b{color:#4648d4}
    .steps{display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:28px}
    .step{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-radius:10px;font-size:14px;background:#fff;border:1.5px solid #ede9f8}
    .step-icon{font-size:18px;flex-shrink:0;margin-top:1px}
    .step-label{font-weight:600;color:#1b1b25}
    .step-desc{font-size:12px;color:#9090a8;margin-top:2px}
    .note{font-size:12px;color:#c0c0d0}
    .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#4648d4;animation:pulse 1.5s ease-in-out infinite;margin-right:6px;vertical-align:middle}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  </style>
</head>
<body>
<div class="box">
  <div class="logo">Ex<span>sisto</span></div>
  <span class="icon">🚀</span>
  <h1>Building ${name}</h1>
  <p class="sub">Your AI-powered website is being created right now. This usually takes 3–5 minutes.</p>
  <div class="progress-bar"><div class="progress-fill"></div></div>
  <p class="timer">Estimated time remaining: <b id="t">4:30</b></p>
  <div class="steps">
    <div class="step"><span class="step-icon">✍️</span><div><div class="step-label">Writing your content</div><div class="step-desc">AI generating copy, headlines &amp; descriptions</div></div></div>
    <div class="step"><span class="step-icon">🎨</span><div><div class="step-label">Generating your images</div><div class="step-desc">Creating custom photos for your business</div></div></div>
    <div class="step"><span class="step-icon">🔍</span><div><div class="step-label">Setting up SEO &amp; schema</div><div class="step-desc">Optimizing pages for local search</div></div></div>
    <div class="step"><span class="step-icon">📝</span><div><div class="step-label">Writing your first blog posts</div><div class="step-desc">Fresh content ready to publish</div></div></div>
  </div>
  <p class="note"><span class="dot"></span>Page refreshes every 20 seconds</p>
</div>
<script>
  var s=270;
  function tick(){
    if(s<=0){location.reload();return;}
    var m=Math.floor(s/60),sec=s%60;
    var el=document.getElementById('t');
    if(el)el.textContent=m+':'+(sec<10?'0':'')+sec;
    s--;
  }
  tick();setInterval(tick,1000);
  setTimeout(function(){location.reload();},20000);
</script>
</body></html>`;
}


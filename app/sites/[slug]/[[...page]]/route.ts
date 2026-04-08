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
  // Debug: return JSON status info
  if (request.url.includes("?debug=1")) {
    const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      const r1 = await fetch(`${supabaseUrl2}/rest/v1/businesses?subdomain=eq.${encodeURIComponent(slug)}&select=id,name&limit=1`,
        { headers: { Authorization: `Bearer ${serviceKey2}`, apikey: serviceKey2 ?? "", "Cache-Control": "no-cache" }, cache: "no-store" });
      const b1 = await r1.json();
      const biz2 = b1?.[0];
      const r2 = biz2 ? await fetch(`${supabaseUrl2}/rest/v1/websites?business_id=eq.${biz2.id}&select=status&limit=1`,
        { headers: { Authorization: `Bearer ${serviceKey2}`, apikey: serviceKey2 ?? "", "Cache-Control": "no-cache" }, cache: "no-store" }) : null;
      const w2 = r2 ? await r2.json() : null;
      return NextResponse.json({ slug, bizFound: !!biz2, bizId: biz2?.id, siteStatus: w2?.[0]?.status, hasUrl: !!supabaseUrl2, hasKey: !!serviceKey2, keyPrefix: serviceKey2?.substring(0, 10) });
    } catch(e: any) { return NextResponse.json({ error: e.message }); }
  }

  // Shared Supabase credentials for all REST fetches
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Look up business by subdomain using direct REST fetch
  let business: { id: string; name: string } | null = null;
  try {
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?subdomain=eq.${encodeURIComponent(slug)}&select=id,name&limit=1`,
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

    return new NextResponse(renderBlogPost(business.name, post), {
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

    return new NextResponse(renderBlogIndex(business.name, posts || []), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
    });
  }

  // Get website record using direct REST fetch (bypasses any env var issues with supabase-js on subdomains)
  let website: Record<string, any> | null = null;
  try {
    const siteRes = await fetch(
      `${supabaseUrl}/rest/v1/websites?business_id=eq.${business.id}&select=custom_html,services_html,about_html,contact_html,blog_index_html,status&limit=1`,
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
    const isReady = website.status === "ready_for_review";
    return new NextResponse(isReady ? readyHTML(business.name) : buildingHTML(business.name), {
      status: 200,
      headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
    });
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

function renderBlogIndex(bizName: string, posts: any[]): string {
  const postCards = posts.map(p => `
    <a class="post-card" href="/blog/${p.slug}">
      ${p.featured_image_url ? `<img src="${p.featured_image_url}" alt="${p.title}" class="post-img"/>` : `<div class="post-img-placeholder"></div>`}
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

function renderBlogPost(bizName: string, post: any): string {
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
  ${post.featured_image_url ? `<img class="hero-img" src="${post.featured_image_url}" alt="${post.title}"/>` : ""}
  <article>
    <div class="date">${post.approved_at ? new Date(post.approved_at).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"}) : ""}</div>
    <h1>${post.title}</h1>
    <div class="body">${(post.content || "").split("\n\n").map((p: string) => `<p>${p}</p>`).join("")}</div>
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

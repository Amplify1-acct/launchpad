import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

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
  const supabase = createAdminClient();

  // Look up business by subdomain
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("subdomain", slug)
    .single();

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
    const { data: post } = await supabase
      .from("blog_posts")
      .select("title, body, excerpt, featured_image_url, published_at")
      .eq("business_id", business.id)
      .eq("slug", postSlug)
      .eq("status", "published")
      .single();

    if (!post) {
      return new NextResponse(notFoundHTML(slug), { status: 404, headers: { "Content-Type": "text/html" } });
    }

    return new NextResponse(renderBlogPost(business.name, post), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  }

  // Blog index: /blog
  if (pagePath === "blog") {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("title, slug, excerpt, featured_image_url, approved_at, word_count")
      .eq("business_id", business.id)
      .eq("status", "published")
      .order("approved_at", { ascending: false });

    return new NextResponse(renderBlogIndex(business.name, posts || []), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
    });
  }

  // Get website record (bypass RLS with service role)
  const { data: website, error: webError } = await supabase
    .from("websites")
    .select("custom_html, services_html, about_html, contact_html, blog_index_html, status")
    .eq("business_id", business.id)
    .maybeSingle();
  
  console.log("DEBUG website query:", { businessId: business.id, status: website?.status, error: webError?.message, found: !!website });

  console.log("DEBUG site route:", { slug, pagePath, businessId: business.id, websiteStatus: website?.status, hasHtml: !!website?.custom_html });
  
  if (!website) {
    console.log("DEBUG: no website found for business", business.id);
    return new NextResponse(buildingHTML(business.name), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (website.status !== "live") {
    console.log("DEBUG: website not live, status =", website.status);
    return new NextResponse(buildingHTML(business.name), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Pick the right page HTML
  const col = PAGE_COLUMNS[pagePath] || "custom_html";
  const html = (website as any)[col] || website.custom_html;

  if (!html) {
    return new NextResponse(buildingHTML(business.name), {
      headers: { "Content-Type": "text/html" },
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
    <div class="date">${post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"}) : ""}</div>
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

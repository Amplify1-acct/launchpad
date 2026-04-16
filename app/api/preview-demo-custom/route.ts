import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPABASE_IMG = "https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images";

const DEMO_MAP: Record<string, { folder: string; bizName: string; city: string; state: string }> = {
  bold:  { folder: "mattys-automotive",      bizName: "Matty's Automotive",    city: "Springfield",   state: "NJ" },
  warm:  { folder: "greenscape-landscaping",  bizName: "GreenScape Landscaping", city: "Westfield",    state: "NJ" },
  clean: { folder: "procomfort-hvac",         bizName: "ProComfort HVAC",       city: "Scotch Plains", state: "NJ" },
};

const DEMO_IMG_BASE: Record<string, string> = {
  bold:  `${SUPABASE_IMG}/client-sites/mattys-automotive`,
  warm:  `${SUPABASE_IMG}/client-sites/greenscape-landscaping`,
  clean: `${SUPABASE_IMG}/client-sites/procomfort-hvac`,
};

const DEMO_COPY: Record<string, {
  h1: string; heroBody: string; aboutH2: string; aboutBody: string; ctaH2: string;
  services: Array<{name:string;desc:string}>;
  process: Array<{title:string;desc:string}>;
  blogTitles: string[];
}> = {
  bold: {
    h1: "Springfield's Trusted Auto Experts",
    heroBody: "For over 18 years, Matty's Automotive has been Springfield's go-to shop for honest, reliable car care.",
    aboutH2: "Family-Owned Since 2006",
    aboutBody: "Matty's Automotive has been proudly serving Springfield and surrounding New Jersey communities for nearly two decades.",
    ctaH2: "Schedule Your Service Today",
    process: [
      {title:"Call Us",          desc:"Give us a call at (908) 555-0147 to describe your car's symptoms. We'll provide an honest assessment and schedule your appointment."},
      {title:"Expert Diagnosis", desc:"Our certified mechanics will thoroughly inspect your vehicle using state-of-the-art equipment. You'll get a clear explanation of any issues we find."},
      {title:"Quality Repair",   desc:"We use only quality parts and proven techniques. Your car will be ready when promised and backed by our satisfaction guarantee."},
    ],
    blogTitles: [
      "5 Critical Warning Signs Your Car Needs Immediate Attention in Springfield, NJ",
      "How to Choose a Trustworthy Auto Shop in Springfield, NJ: Your Complete Guide",
    ],
    services: [
      {name:"Oil Changes",          desc:"Quick professional oil changes using premium lubricants to keep your engine running smoothly."},
      {name:"Brake Service",        desc:"Complete brake inspection, repair, and replacement to keep you safe on Springfield roads."},
      {name:"Engine Diagnostics",   desc:"Advanced computer diagnostics to quickly identify and solve engine problems fast."},
      {name:"Battery & Electrical", desc:"Full electrical testing, battery replacement, and alternator service you can count on."},
      {name:"AC & Heat",            desc:"Climate control repair and maintenance to keep you comfortable in any weather."},
      {name:"NJ State Inspection",  desc:"Official New Jersey state inspection services to keep your registration current."},
    ],
  },
  warm: {
    h1: "Westfield's Premier Landscaping Experts",
    heroBody: "For over 18 years, GreenScape has been transforming Westfield properties into stunning outdoor retreats.",
    aboutH2: "Rooted in Westfield",
    aboutBody: "Since 2005, GreenScape Landscaping has been proudly serving Westfield and surrounding communities.",
    ctaH2: "Ready to Transform Your Outdoor Space?",
    process: [
      {title:"Free Estimate",   desc:"We visit your property, assess your needs, and provide a detailed free estimate with no pressure."},
      {title:"We Get to Work",  desc:"Our crew arrives on time, works efficiently, and treats your property with care and respect."},
      {title:"You Love It",     desc:"We don't leave until you're completely satisfied. Your property, transformed exactly as promised."},
    ],
    blogTitles: [
      "5 Signs Your Westfield Lawn Needs Professional Attention This Season",
      "How to Choose the Best Landscaping Company in Westfield, NJ",
    ],
    services: [
      {name:"Lawn Care & Maintenance", desc:"Keep your Westfield lawn lush and healthy with our comprehensive mowing and treatment programs."},
      {name:"Landscape Design",        desc:"Transform your outdoor space with custom designs tailored to your lifestyle and property."},
      {name:"Tree & Shrub Trimming",   desc:"Expert pruning services to maintain the health and beauty of your trees and shrubs."},
      {name:"Mulching & Garden Beds",  desc:"Professional mulching and garden bed maintenance to protect plants and boost curb appeal."},
      {name:"Irrigation Systems",      desc:"Efficient irrigation installation and maintenance to keep your landscape perfectly hydrated."},
      {name:"Snow Removal",            desc:"Reliable snow removal to keep your Westfield property safe and accessible all winter."},
    ],
  },
  clean: {
    h1: "Scotch Plains HVAC Experts",
    heroBody: "ProComfort HVAC delivers reliable heating and cooling solutions to Scotch Plains families and businesses.",
    aboutH2: "Your Neighborhood HVAC Team",
    aboutBody: "For over two decades, ProComfort HVAC has been Scotch Plains' trusted heating and cooling partner.",
    ctaH2: "Ready for Year-Round Comfort?",
    process: [
      {title:"Schedule Service",      desc:"Call us or book online for a convenient appointment. We offer flexible times that work with your schedule."},
      {title:"Expert Diagnosis",      desc:"Our certified tech inspects your system thoroughly and explains all issues clearly. No surprises."},
      {title:"Professional Solution", desc:"We complete all work using quality parts and best practices. Your satisfaction is guaranteed."},
    ],
    blogTitles: [
      "Beat the Heat: 7 Expert Tips to Lower Your Energy Bill This Summer in Scotch Plains, NJ",
      "4 Warning Signs Your Scotch Plains AC Needs Emergency Repair This Summer",
    ],
    services: [
      {name:"AC Installation & Repair", desc:"Expert air conditioning installation and repairs for all major brands, done right the first time."},
      {name:"Furnace & Heating",        desc:"Comprehensive heating services including furnace repair, installation, and seasonal tune-ups."},
      {name:"Air Quality & Filtration", desc:"Advanced indoor air quality solutions to remove allergens and pollutants from your home."},
      {name:"Duct Cleaning",            desc:"Professional ductwork cleaning to improve airflow and reduce allergens throughout your home."},
      {name:"Maintenance Plans",        desc:"Preventive maintenance programs to keep your HVAC system running efficiently year-round."},
      {name:"Emergency Service",        desc:"24/7 emergency HVAC repairs when you need us most — no matter the hour we respond fast."},
    ],
  },
};

function generateSlug(bizName: string): string {
  const base = bizName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 30);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${base}-${rand}`;
}

async function generateCustomCopy(bizName: string, city: string, state: string, desc: string, servicesList: string, customers: string) {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 900,
    messages: [{
      role: "user",
      content: `Write homepage copy for a small business website demo.

Business: "${bizName}" — ${city}, ${state}
Description: "${desc}"
Services: "${servicesList}"
Target customers: "${customers || "local residents and businesses"}"

Return ONLY valid JSON, no markdown:
{
  "h1": "City-first punchy headline, max 8 words",
  "heroBody": "2-3 warm confident sentences, 35-45 words, mentions business name and city",
  "services": [
    {"name":"service name","desc":"one sentence 15-20 words specific to this service"},
    {"name":"service name","desc":"one sentence 15-20 words"},
    {"name":"service name","desc":"one sentence 15-20 words"},
    {"name":"service name","desc":"one sentence 15-20 words"},
    {"name":"service name","desc":"one sentence 15-20 words"},
    {"name":"service name","desc":"one sentence 15-20 words"}
  ],
  "aboutH2": "4-6 word about headline specific to their story",
  "aboutBody": "3 sentences 50-60 words warm and specific, mentions name and city",
  "ctaH2": "Action CTA 5-7 words specific to what they do",
  "process": [
    {"title":"2-3 word step","desc":"how customer starts, 15-20 words"},
    {"title":"2-3 word step","desc":"what happens next, 15-20 words"},
    {"title":"2-3 word step","desc":"the outcome, 15-20 words"}
  ],
  "blogTitles": [
    "SEO blog title specific to business and city, 8-12 words",
    "Second SEO blog title different angle, 8-12 words"
  ]
}`,
    }],
  });
  const text = (msg.content[0] as { type: string; text: string }).text.trim().replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

async function dispatchWorkflow(slug: string, bizName: string, city: string, basePrompt: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) { console.error("No GITHUB_TOKEN"); return; }

  await fetch(
    "https://api.github.com/repos/Amplify1-acct/launchpad/actions/workflows/generate-custom-demo.yml/dispatches",
    {
      method: "POST",
      headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          demo_slug:   slug,
          biz_name:    bizName,
          city:        city,
          base_prompt: basePrompt.substring(0, 400),
        },
      }),
    }
  );
}

function applySwaps(html: string, copy: any, orig: any, demo: any, bizName: string, newCity: string, newState: string, images: any) {
  // Name + city
  if (bizName) html = html.split(demo.bizName).join(bizName);
  html = html.split(demo.city).join(newCity);
  html = html.split(` ${demo.state}`).join(` ${newState}`);
  html = html.split(`,${demo.state}`).join(`,${newState}`);

  // Images — swap custom images in; hide any gallery slots we didn't generate
  const styleKey = demo.folder.includes("auto") ? "bold" : demo.folder.includes("green") ? "warm" : "clean";
  const demoBase = DEMO_IMG_BASE[styleKey];
  const slots = ["hero", "about", "img3", "img4", "img5", "img6", "img7"];
  for (const slot of slots) {
    const customUrl = images?.[slot];
    if (customUrl) {
      // Swap with our generated image
      html = html.split(`${demoBase}/${slot}.jpg`).join(customUrl);
      html = html.split(`${demoBase}/${slot}.png`).join(customUrl);
    } else if (["img5", "img6", "img7"].includes(slot)) {
      // No image generated for this slot — remove the wrapping div entirely
      const imgPath = `${demoBase}/${slot}.jpg`;
      const imgPathPng = `${demoBase}/${slot}.png`;
      // Find and remove the <div ...><img src="...imgN.jpg"...></div>
      html = html.replace(
        new RegExp(`<div[^>]*>\s*<img[^>]*${slot}\.jpg[^>]*>\s*<\/div>`, "g"), ""
      );
      html = html.replace(
        new RegExp(`<div[^>]*>\s*<img[^>]*${slot}\.png[^>]*>\s*<\/div>`, "g"), ""
      );
    }
  }

  // H1
  const oldH1 = orig.h1.replace(demo.city, newCity).replace("Springfield", newCity).replace("Westfield", newCity).replace("Scotch Plains", newCity);
  html = html.includes(oldH1) ? html.split(oldH1).join(copy.h1) : html.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/, `<h1$1>${copy.h1}</h1>`);

  // Hero body
  const heroSwapped = orig.heroBody.split(demo.bizName).join(bizName).split(demo.city).join(newCity);
  const bIdx = html.indexOf(heroSwapped.substring(0, 40));
  if (bIdx !== -1) { const pe = html.indexOf("</p>", bIdx); if (pe !== -1) html = html.substring(0, bIdx) + copy.heroBody + html.substring(pe); }

  // Services — only swap slots where we have a distinct AI-generated service
  if (Array.isArray(copy.services) && copy.services.length > 0) {
    orig.services.forEach((s: any, i: number) => {
      const n = copy.services[i]; // no fallback — only swap if we have this exact slot
      if (!n) return;
      if (s.name && n.name && n.name !== copy.services[0]?.name) {
        // Only swap if different from first (catches repeated fallback bug)
        html = html.split(s.name).join(n.name);
        if (s.desc && n.desc) html = html.split(s.desc).join(n.desc);
      } else if (i === 0) {
        // Always swap the first one
        if (s.name && n.name) html = html.split(s.name).join(n.name);
        if (s.desc && n.desc) html = html.split(s.desc).join(n.desc);
      }
    });
  }

  // About
  if (copy.aboutH2 && orig.aboutH2) html = html.split(orig.aboutH2).join(copy.aboutH2);
  if (copy.aboutBody && orig.aboutBody) {
    const ab = orig.aboutBody.split(demo.bizName).join(bizName).split(demo.city).join(newCity);
    const ai = html.indexOf(ab.substring(0, 40));
    if (ai !== -1) { const ae = html.indexOf("</p>", ai); if (ae !== -1) html = html.substring(0, ai) + copy.aboutBody + html.substring(ae); }
    else { const oi = html.indexOf(orig.aboutBody.substring(0, 40)); if (oi !== -1) { const oe = html.indexOf("</p>", oi); if (oe !== -1) html = html.substring(0, oi) + copy.aboutBody + html.substring(oe); } }
  }
  if (copy.ctaH2 && orig.ctaH2) html = html.split(orig.ctaH2).join(copy.ctaH2);

  // Process
  if (Array.isArray(copy.process) && Array.isArray(orig.process)) {
    orig.process.forEach((s: any, i: number) => {
      const n = copy.process[i];
      if (!n) return;
      if (s.title && n.title) html = html.split(s.title).join(n.title);
      if (s.desc  && n.desc)  html = html.split(s.desc).join(n.desc);
    });
  }

  // Blog titles — replace ALL h3 tags in the blog section that contain city/demo text
  if (Array.isArray(copy.blogTitles) && copy.blogTitles.length >= 2) {
    // First try targeted swap of known template titles
    if (Array.isArray(orig.blogTitles)) {
      orig.blogTitles.forEach((t: string, i: number) => {
        const sw = t.replace(demo.city, newCity).replace("Springfield", newCity).replace("Westfield", newCity).replace("Scotch Plains", newCity);
        const nt = copy.blogTitles[i];
        if (nt) { html = html.split(sw).join(nt); html = html.split(t).join(nt); }
      });
    }
    // Fallback: find any h3 inside the blog section and replace sequentially
    let blogIdx = html.indexOf("OUR BLOG");
    if (blogIdx === -1) blogIdx = html.indexOf("LATEST ARTICLES");
    if (blogIdx === -1) blogIdx = html.indexOf("Latest Articles");
    if (blogIdx !== -1) {
      let titleNum = 0;
      const blogSection = html.substring(blogIdx);
      const replaced = blogSection.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/g, (match: string, attrs: string, inner: string) => {
        if (titleNum < copy.blogTitles.length && inner.length > 20 && !inner.includes("Read More")) {
          const newTitle = copy.blogTitles[titleNum++];
          return `<h3${attrs}>${newTitle}</h3>`;
        }
        return match;
      });
      html = html.substring(0, blogIdx) + replaced;
    }
  }

  // Nav dropdown
  html = html.replace(/<div class="nav-dropdown-menu">([\s\S]*?)<\/div>/, () => {
    const items = (copy.services || []).slice(0, 6).map((s: any) => {
      const name = typeof s === "string" ? s : s.name;
      return `<span style="display:block;padding:8px 16px;font-size:13px;cursor:default;">${name}</span>`;
    }).join("");
    return `<div class="nav-dropdown-menu">${items}</div>`;
  });

  return html;
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const style     = searchParams.get("style")     || "bold";
  const bizName   = (searchParams.get("biz")      || "").trim();
  const cityRaw   = (searchParams.get("city")     || "").trim();
  const desc      = (searchParams.get("desc")     || "").trim();
  const servicesList = (searchParams.get("services") || "").trim();
  const customers = (searchParams.get("customers")|| "").trim();
  const email     = (searchParams.get("email")     || "").trim();
  const format    = searchParams.get("format");
  const slugParam = searchParams.get("slug");       // set when polling redirect fires

  const demo   = DEMO_MAP[style] || DEMO_MAP.bold;
  const parts  = cityRaw.split(",").map((s: string) => s.trim());
  const cityPart = parts[0] || demo.city;
  const stateFromCity = cityPart.match(/\b([A-Z]{2})$/)?.[1];
  const newCity  = stateFromCity ? cityPart.replace(/\s+[A-Z]{2}$/, "").trim() : cityPart;
  const newState = parts[1] || stateFromCity || demo.state;

  // ── Slug redirect: browser was polling, images are ready, render full HTML ──
  if (slugParam) {
    const { data: build } = await supabase
      .from("demo_builds")
      .select("*")
      .eq("slug", slugParam)
      .single();

    if (!build || build.status !== "ready") {
      return NextResponse.json({ error: "Not ready" }, { status: 202 });
    }

    const copy = build.copy;
    const images = build.images || {};
    const orig = DEMO_COPY[build.style] || DEMO_COPY.bold;
    const demoMeta = DEMO_MAP[build.style] || DEMO_MAP.bold;

    let html = readFileSync(join(process.cwd(), "public", "sites", demoMeta.folder, "index.html"), "utf-8");
    html = applySwaps(html, copy, orig, demoMeta, build.biz_name, build.city, build.state, images);

    const styleLabel = build.style === "bold" ? "Dark & Bold" : build.style === "warm" ? "Warm & Natural" : "Clean & Modern";
    const banner = `<div id="xpb" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#4648d4;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;font-family:system-ui,sans-serif;font-size:13px;box-shadow:0 2px 16px rgba(0,0,0,0.3);gap:12px;">
  <div style="display:flex;align-items:center;gap:10px;"><span>✨</span><span>Custom demo: <strong>${build.biz_name}</strong> in ${build.city}, ${build.state}</span><span style="background:rgba(255,255,255,0.18);border-radius:4px;padding:2px 8px;font-size:11px;">${styleLabel}</span></div>
  <a href="/order" style="background:#fff;color:#4648d4;font-weight:700;font-size:13px;border-radius:8px;padding:7px 18px;text-decoration:none;">Get Started →</a>
</div>
<style>body>*:not(#xpb){margin-top:48px!important;}</style>`;
    html = html.replace(/<body([^>]*)>/, `<body$1>${banner}`);
    html = html.replace(/<a\s+([^>]*?)href=['"](?!https?:\/\/|mailto:|tel:)([^'"]*?)['"]/gi, '<a $1href="#" onclick="return false;" style="cursor:default;"');
    html = html.replace(/<form/gi, '<form onsubmit="return false;"');

    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }

  // ── Initial request: generate copy, create DB row, dispatch workflow ────────
  if (!bizName || !desc) {
    return NextResponse.json({ error: "Missing biz or desc" }, { status: 400 });
  }

  // Create slug + Supabase row IMMEDIATELY with placeholder copy
  // so we can return the pending page to the user right away
  const slug = generateSlug(bizName);
  // Parse services from input — pad to 6 if fewer provided
  const parsedServices = servicesList.split("\n").filter(Boolean).slice(0, 6).map((s: string) => ({
    name: s.trim(),
    desc: `Professional ${s.trim().toLowerCase()} services in ${newCity}.`
  }));
  // Pad to 6 with generic entries so template slots don't repeat
  while (parsedServices.length < 6) {
    parsedServices.push({ name: `Our Services`, desc: `Quality service delivered with care in ${newCity}, ${newState}.` });
  }

  const placeholderCopy = {
    h1: `${newCity} ${bizName}`,
    heroBody: `${bizName} proudly serves ${newCity}, ${newState}.`,
    services: parsedServices,
    aboutH2: `About ${bizName}`,
    aboutBody: `${bizName} is a trusted local business in ${newCity}.`,
    ctaH2: "Get Started Today",
    process: [
      {title:"Reach Out",      desc:"Contact us to discuss your needs and get an honest assessment."},
      {title:"We Get to Work", desc:"Our team delivers quality work efficiently and with care."},
      {title:"You Are Happy",  desc:"We stand behind everything we do, guaranteed."},
    ],
    blogTitles: [
      `Top Tips from ${bizName} in ${newCity}, ${newState}`,
      `Why ${newCity} Residents Trust ${bizName}`,
    ],
  };

  await supabase.from("demo_builds").insert({
    slug,
    status: "pending",
    biz_name: bizName,
    city: newCity,
    state: newState,
    style,
    copy: placeholderCopy,
    images: {},
    email: email || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Generate real copy + dispatch workflow — both must complete before response
  // (Vercel kills anything that runs after response is sent)
  try {
    const realCopy = await generateCustomCopy(bizName, newCity, newState, desc, servicesList, customers);
    await supabase.from("demo_builds").update({ copy: realCopy }).eq("slug", slug);
  } catch (err) {
    console.error("Copy generation failed, using placeholder:", err);
  }

  // Dispatch image generation workflow
  await dispatchWorkflow(slug, bizName, `${newCity}, ${newState}`, desc);

  // JSON mode (mobile) — return copy + slug immediately, images will be placeholders
  if (format === "json") {
    const demoBase = DEMO_IMG_BASE[style] || DEMO_IMG_BASE.bold;
    return NextResponse.json({
      slug,
      status: "pending",
      h1: placeholderCopy.h1,
      heroBody: placeholderCopy.heroBody,
      services: placeholderCopy.services || [],
      heroImage: `${demoBase}/hero.jpg`,
      galleryImages: [`${demoBase}/img3.jpg`, `${demoBase}/img4.jpg`, `${demoBase}/img5.jpg`],
      matched: true,
      city: `${newCity}, ${newState}`,
    });
  }

  // Desktop: return pending page — JS will poll and redirect when ready
  const pollUrl = `/api/preview-demo-custom?slug=${slug}`;
  const pendingHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Building your custom demo — ${bizName}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:system-ui,sans-serif;background:#0d0d14;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:24px;padding:20px;}
    @keyframes bounce{0%,100%{transform:translateY(0) rotate(-8deg);}50%{transform:translateY(-16px) rotate(8deg);}}
    @keyframes dot{0%,80%,100%{opacity:.3;transform:scale(.7);}40%{opacity:1;transform:scale(1);}}
    .emoji{font-size:72px;animation:bounce 1s ease-in-out infinite;}
    .msg{font-size:22px;font-weight:700;max-width:500px;text-align:center;line-height:1.3;}
    .sub{font-size:15px;color:#9090a8;max-width:440px;text-align:center;line-height:1.6;}
    .dots{display:flex;gap:10px;}
    .dot{width:11px;height:11px;border-radius:50%;background:#4648d4;animation:dot 1.2s ease-in-out infinite;}
    .dot:nth-child(2){animation-delay:.2s;}.dot:nth-child(3){animation-delay:.4s;}
    .progress{width:320px;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;margin-top:8px;}
    .progress-bar{height:100%;background:#4648d4;border-radius:4px;width:0%;transition:width 0.5s ease;}
  </style>
</head>
<body>
  <div class="emoji" id="em">✨</div>
  <div class="msg" id="mg">Building your custom demo</div>
  <div class="sub" id="sb">AI is generating custom images for your business and writing custom copy — takes 3–5 minutes</div>
  <div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
  <div class="progress"><div class="progress-bar" id="pb"></div></div>
  <script>
    var steps = [
      {e:"✨", m:"Building your custom demo", s:"AI is generating custom images for your business"},
      {e:"🎨", m:"Generating images with Nano Banana", s:"Building photos specific to what you do"},
      {e:"✍️", m:"Writing your custom copy", s:"Every word crafted around your description"},
      {e:"🔧", m:"Assembling your site", s:"Putting it all together just for you"},
      {e:"🚀", m:"Almost ready...", s:"Final touches on your custom demo"}
    ];
    var i = 0, elapsed = 0;
    var interval = setInterval(function() {
      i = (i + 1) % steps.length;
      document.getElementById("em").textContent = steps[i].e;
      document.getElementById("mg").textContent = steps[i].m;
      document.getElementById("sb").textContent = steps[i].s;
      elapsed += 20;
      document.getElementById("pb").style.width = Math.min(elapsed / 300 * 100, 90) + "%";
    }, 20000);

    // Poll every 5 seconds
    function poll() {
      fetch("/api/demo-status?slug=${slug}")
        .then(function(r){ return r.json(); })
        .then(function(data) {
          if (data.status === "ready") {
            clearInterval(interval);
            document.getElementById("pb").style.width = "100%";
            document.getElementById("mg").textContent = "Your demo is ready!";
            document.getElementById("sb").textContent = "Loading your custom site...";
            document.getElementById("em").textContent = "🎉";
            setTimeout(function() {
              window.location.href = "${pollUrl}";
            }, 800);
          } else if (data.status === "failed") {
            clearInterval(interval);
            document.getElementById("em").textContent = "😔";
            document.getElementById("mg").textContent = "Something went wrong";
            document.getElementById("sb").textContent = "We couldn't generate your demo. Please try again.";
          } else {
            setTimeout(poll, 5000);
          }
        })
        .catch(function() { setTimeout(poll, 8000); });
    }
    setTimeout(poll, 5000);
  </script>
</body>
</html>`;

  return new NextResponse(pendingHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

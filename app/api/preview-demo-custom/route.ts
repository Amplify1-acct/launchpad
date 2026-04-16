import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";

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

const DEMO_COPY: Record<string, { h1: string; heroBody: string; aboutH2: string; aboutBody: string; ctaH2: string; services: Array<{name:string;desc:string}>; process: Array<{title:string;desc:string}>; blogTitles: string[] }> = {
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
      {title:"Free Estimate",    desc:"We visit your property, assess your needs, and provide a detailed free estimate with no pressure."},
      {title:"We Get to Work",   desc:"Our crew arrives on time, works efficiently, and treats your property with care and respect."},
      {title:"You Love It",      desc:"We don't leave until you're completely satisfied. Your property, transformed exactly as promised."},
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
      {title:"Schedule Service",     desc:"Call us or book online to schedule a convenient appointment. We offer flexible times that work with your busy schedule."},
      {title:"Expert Diagnosis",     desc:"Our certified tech thoroughly inspects your system and explains all issues clearly. No confusing jargon, no surprise charges."},
      {title:"Professional Solution",desc:"We complete all work efficiently using quality parts and industry best practices. Your satisfaction is guaranteed with every service call."},
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

async function generateCustomCopy(bizName: string, city: string, state: string, desc: string, servicesList: string, customers: string, style: string) {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `You are writing homepage copy for a custom small business website demo.

Business name: "${bizName}"
Location: ${city}, ${state}
Business description: "${desc}"
Services offered: "${servicesList}"
Target customers: "${customers || "local residents and businesses"}"

Write compelling, specific copy based ONLY on what this business actually does. Do not use generic placeholder text.

Return ONLY valid JSON, no markdown, no explanation:
{
  "h1": "Punchy hero headline, city name first, max 8 words, specific to what they do",
  "heroBody": "2-3 warm confident sentences, 35-45 words, specific to their actual business, mentions business name and city",
  "services": [
    {"name": "Exact service name from their list", "desc": "One sentence, 15-20 words, specific to this service"},
    {"name": "Exact service name from their list", "desc": "One sentence, 15-20 words, specific to this service"},
    {"name": "Exact service name from their list", "desc": "One sentence, 15-20 words, specific to this service"},
    {"name": "Exact service name from their list", "desc": "One sentence, 15-20 words, specific to this service"},
    {"name": "Exact service name from their list", "desc": "One sentence, 15-20 words, specific to this service"},
    {"name": "Exact service name from their list", "desc": "One sentence, 15-20 words, specific to this service"}
  ],
  "aboutH2": "4-6 word about section headline, specific to their story",
  "aboutBody": "3 sentences, 50-60 words, warm and specific to their business, mentions name and city",
  "ctaH2": "Action CTA specific to what they do, 5-7 words",
  "process": [
    {"title": "Step 1, 2-3 words", "desc": "How a customer starts with this specific business, 15-20 words"},
    {"title": "Step 2, 2-3 words", "desc": "What happens next, specific to their process, 15-20 words"},
    {"title": "Step 3, 2-3 words", "desc": "The outcome for the customer, specific, 15-20 words"}
  ],
  "blogTitles": [
    "SEO blog title specific to this business and city, 8-12 words",
    "Second SEO blog title, different angle, 8-12 words"
  ],
  "imagePrompt": "A professional photograph for a ${bizName} business in ${city}. ${desc.substring(0, 150)}. Photorealistic, high quality, natural lighting, no text, no logos, no people's faces clearly visible."
}`,
    }],
  });
  const text = (msg.content[0] as { type: string; text: string }).text.trim().replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

async function generateImageViaWorkflow(imagePrompt: string, bizName: string): Promise<string | null> {
  // Trigger GitHub Actions workflow to generate image via Nano Banana
  // For now, return a placeholder — full Nano Banana integration requires workflow dispatch
  // We'll use a Supabase stock image as fallback
  try {
    const slug = bizName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").substring(0, 30);
    // Dispatch GitHub Actions workflow for image generation
    const token = process.env.GITHUB_TOKEN || "";
    if (!token) return null;

    await fetch("https://api.github.com/repos/Amplify1-acct/launchpad/actions/workflows/generate-demo-image.yml/dispatches", {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { prompt: imagePrompt, slug },
      }),
    });
    return null; // Async — image won't be ready immediately
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const style     = searchParams.get("style") || "bold";
  const bizName   = (searchParams.get("biz")       || "").trim();
  const cityRaw   = (searchParams.get("city")      || "").trim();
  const desc      = (searchParams.get("desc")      || "").trim();
  const servicesList = (searchParams.get("services") || "").trim();
  const customers = (searchParams.get("customers") || "").trim();
  const format    = searchParams.get("format");

  const demo   = DEMO_MAP[style] || DEMO_MAP.bold;
  const parts  = cityRaw.split(",").map((s: string) => s.trim());
  const cityPart   = parts[0] || demo.city;
  const stateFromCity = cityPart.match(/\b([A-Z]{2})$/)?.[1];
  const newCity  = stateFromCity ? cityPart.replace(/\s+[A-Z]{2}$/, "").trim() : cityPart;
  const newState = parts[1] || stateFromCity || demo.state;

  // Generate AI copy from the rich description
  let copy: any;
  try {
    copy = await generateCustomCopy(bizName, newCity, newState, desc, servicesList, customers, style);
  } catch {
    copy = {
      h1: `${newCity}'s Trusted ${bizName} Experts`,
      heroBody: `${bizName} has been proudly serving ${newCity}, ${newState}. We're committed to quality work and honest service every time.`,
      services: servicesList.split("\n").filter(Boolean).slice(0, 6).map((s: string) => ({
        name: s.trim(),
        desc: `Professional ${s.trim().toLowerCase()} services tailored to your needs in ${newCity}.`
      })),
      aboutH2: `Proudly Serving ${newCity}`,
      aboutBody: `${bizName} is a trusted local business serving ${newCity} and the surrounding community with dedication and care.`,
      ctaH2: "Ready to Get Started?",
      process: [
        {title:"Reach Out",    desc:`Contact us to discuss your needs. We'll listen carefully and provide honest guidance.`},
        {title:"We Get to Work",desc:`Our team delivers quality work efficiently, treating your property with care and respect.`},
        {title:"You're Happy", desc:`We stand behind everything we do. Your satisfaction is guaranteed, every single time.`},
      ],
      blogTitles: [
        `Everything You Need to Know About ${bizName} in ${newCity}, ${newState}`,
        `Why ${newCity} Residents Trust ${bizName} for Quality Service`,
      ],
      imagePrompt: `Professional photograph for ${bizName} in ${newCity}. ${desc.substring(0, 150)}.`,
    };
  }

  // JSON mode for mobile card
  if (format === "json") {
    const demoBase = DEMO_IMG_BASE[style] || DEMO_IMG_BASE.bold;
    return NextResponse.json({
      h1:           copy.h1,
      heroBody:     copy.heroBody,
      services:     copy.services || [],
      heroImage:    `${demoBase}/hero.jpg`,
      galleryImages: [`${demoBase}/img3.jpg`, `${demoBase}/img4.jpg`, `${demoBase}/img5.jpg`],
      matched:      true,
      city:         `${newCity}, ${newState}`,
    });
  }

  // Desktop HTML mode — swap template with custom copy
  try {
    const htmlPath = join(process.cwd(), "public", "sites", demo.folder, "index.html");
    let html = readFileSync(htmlPath, "utf-8");
    const orig = DEMO_COPY[style] || DEMO_COPY.bold;

    // Name + city swap
    if (bizName) html = html.split(demo.bizName).join(bizName);
    html = html.split(demo.city).join(newCity);
    html = html.split(` ${demo.state}`).join(` ${newState}`);
    html = html.split(`,${demo.state}`).join(`,${newState}`);

    // H1
    const oldH1 = orig.h1.replace(demo.city, newCity).replace("Springfield", newCity).replace("Westfield", newCity).replace("Scotch Plains", newCity);
    html = html.includes(oldH1) ? html.split(oldH1).join(copy.h1) : html.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/, `<h1$1>${copy.h1}</h1>`);

    // Hero body
    const heroSwapped = orig.heroBody.split(demo.bizName).join(bizName).split(demo.city).join(newCity);
    const bIdx = html.indexOf(heroSwapped.substring(0, 40));
    if (bIdx !== -1) { const pe = html.indexOf("</p>", bIdx); if (pe !== -1) html = html.substring(0, bIdx) + copy.heroBody + html.substring(pe); }

    // Services
    if (Array.isArray(copy.services) && copy.services.length >= 1) {
      orig.services.forEach((origSvc: any, i: number) => {
        const newSvc = copy.services[i] || copy.services[copy.services.length - 1];
        if (origSvc.name && newSvc.name) html = html.split(origSvc.name).join(newSvc.name);
        if (origSvc.desc && newSvc.desc) html = html.split(origSvc.desc).join(newSvc.desc);
      });
    }

    // About
    if (copy.aboutH2 && orig.aboutH2) html = html.split(orig.aboutH2).join(copy.aboutH2);
    if (copy.aboutBody && orig.aboutBody) {
      const abSwapped = orig.aboutBody.split(demo.bizName).join(bizName).split(demo.city).join(newCity);
      const aIdx = html.indexOf(abSwapped.substring(0, 40));
      if (aIdx !== -1) { const ae = html.indexOf("</p>", aIdx); if (ae !== -1) html = html.substring(0, aIdx) + copy.aboutBody + html.substring(ae); }
      else { const oIdx = html.indexOf(orig.aboutBody.substring(0, 40)); if (oIdx !== -1) { const oe = html.indexOf("</p>", oIdx); if (oe !== -1) html = html.substring(0, oIdx) + copy.aboutBody + html.substring(oe); } }
    }
    if (copy.ctaH2 && orig.ctaH2) html = html.split(orig.ctaH2).join(copy.ctaH2);

    // Process steps
    if (Array.isArray(copy.process) && Array.isArray(orig.process)) {
      orig.process.forEach((s: any, i: number) => {
        const n = copy.process[i];
        if (!n) return;
        if (s.title && n.title) html = html.split(s.title).join(n.title);
        if (s.desc  && n.desc)  html = html.split(s.desc).join(n.desc);
      });
    }

    // Blog titles
    if (Array.isArray(copy.blogTitles) && Array.isArray(orig.blogTitles)) {
      orig.blogTitles.forEach((t: string, i: number) => {
        const swapped = t.replace(demo.city, newCity).replace("Springfield", newCity).replace("Westfield", newCity).replace("Scotch Plains", newCity);
        const nt = copy.blogTitles[i];
        if (nt) { html = html.split(swapped).join(nt); html = html.split(t).join(nt); }
      });
    }

    // Nav dropdown — replace with custom services
    html = html.replace(/<div class="nav-dropdown-menu">([\s\S]*?)<\/div>/, (_: string) => {
      const items = (copy.services || []).slice(0, 6).map((s: any) => {
        const name = typeof s === "string" ? s : s.name;
        return `<span style="display:block;padding:8px 16px;font-size:13px;cursor:default;">${name}</span>`;
      }).join("");
      return `<div class="nav-dropdown-menu">${items}</div>`;
    });

    // Preview banner
    const styleLabel = style === "bold" ? "Dark & Bold" : style === "warm" ? "Warm & Natural" : "Clean & Modern";
    const banner = `<div id="xpb" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#4648d4;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;font-family:system-ui,sans-serif;font-size:13px;box-shadow:0 2px 16px rgba(0,0,0,0.3);gap:12px;">
  <div style="display:flex;align-items:center;gap:10px;">
    <span>✨</span>
    <span>Custom demo: <strong>${bizName}</strong> in ${newCity}, ${newState}</span>
    <span style="background:rgba(255,255,255,0.18);border-radius:4px;padding:2px 8px;font-size:11px;">${styleLabel}</span>
  </div>
  <a href="/order" style="background:#fff;color:#4648d4;font-weight:700;font-size:13px;border-radius:8px;padding:7px 18px;text-decoration:none;">Get Started →</a>
</div>
<style>body>*:not(#xpb){margin-top:48px!important;}</style>`;
    html = html.replace(/<body([^>]*)>/, `<body$1>${banner}`);

    // Disable all links
    html = html.replace(/<a\s+([^>]*?)href=['"](?!https?:\/\/|mailto:|tel:)([^'"]*?)['"]/gi, '<a $1href="#" onclick="return false;" style="cursor:default;"');
    html = html.replace(/<form/gi, '<form onsubmit="return false;"');

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("preview-demo-custom error:", err);
    return NextResponse.json({ error: "Custom demo failed" }, { status: 500 });
  }
}

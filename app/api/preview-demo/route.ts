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

const INDUSTRY_LIB: Record<string, string> = {
  automotive:  `${SUPABASE_IMG}/automotive`,
  plumbing:    `${SUPABASE_IMG}/plumbing`,
  hvac:        `${SUPABASE_IMG}/hvac`,
  landscaping: `${SUPABASE_IMG}/landscaping`,
  dental:      `${SUPABASE_IMG}/dental`,
  roofing:     `${SUPABASE_IMG}/roofing`,
  electrical:  `${SUPABASE_IMG}/electrical`,
  cleaning:    `${SUPABASE_IMG}/cleaning`,
  painting:    `${SUPABASE_IMG}/painting`,
  restaurant:  `${SUPABASE_IMG}/restaurant`,
  moving:      `${SUPABASE_IMG}/moving`,
  gym:         `${SUPABASE_IMG}/gym`,
  pet:         `${SUPABASE_IMG}/pet`,
  remodeling:  `${SUPABASE_IMG}/remodeling`,
  salon:       `${SUPABASE_IMG}/salon`,
};

const TYPE_TO_INDUSTRY: Array<[RegExp, string]> = [
  [/plumb|pipe|drain|sewer|water heater/i,                          "plumbing"],
  [/hvac|heat|air.?cond|furnace|cool|boiler|duct/i,                 "hvac"],
  [/landscap|lawn|garden|tree|turf|mow|sprinkler|irrigation/i,      "landscaping"],
  [/dent|teeth|orthodon|oral|hygien/i,                               "dental"],
  [/roof|gutter|shingle/i,                                           "roofing"],
  [/electr|wir|panel|outlet|generator/i,                             "electrical"],
  [/clean|maid|janitorial|pressure.?wash|carpet|window wash/i,       "cleaning"],
  [/paint|stain|coating|drywall|plaster/i,                           "painting"],
  [/remodel|bathroom|kitchen|basement|renovation|tile|flooring|cabinet|handyman/i, "remodeling"],
  [/gym|fitness|crossfit|personal.?train|yoga|pilates|workout/i,      "gym"],
  [/pet|dog|cat|veterinar|grooming|animal|kennel|boarding/i,          "pet"],
  [/restaurant|food|cafe|pizza|burger|diner|sushi|catering|baker|bakery|pastry|donut|coffee.?shop|sandwich/i, "restaurant"],
  [/moving|mover|storage|haul|junk/i,                                "moving"],
  [/auto|car|truck|vehicle|mechanic|tire|brake|oil.?change|transmission/i, "automotive"],
  [/salon|barber|spa|hair|stylist|beauty|nail|waxing|massage/i,             "salon"],
];

function detectIndustry(bizType: string, bizName: string): string | null {
  const text = `${bizType} ${bizName}`;
  for (const [pattern, industry] of TYPE_TO_INDUSTRY) {
    if (pattern.test(text)) return industry;
  }
  return null;
}

const DEMO_COPY: Record<string, { h1: string; heroBody: string; aboutH2: string; aboutBody: string; ctaH2: string; services: Array<{name:string;desc:string}>; process?: Array<{title:string;desc:string}>; blogTitles?: string[] }> = {
  bold: {
    h1: "Springfield's Trusted Auto Experts",
    heroBody: "For over 18 years, Matty's Automotive has been Springfield's go-to shop for honest, reliable car care. We treat your vehicle like our own, delivering ",
    aboutH2:  "Family-Owned Since 2006",
    aboutBody: "Matty's Automotive has been proudly serving Springfield and surrounding New Jersey communities for nearly two decades. We built our reputation on straight talk, fair pricing, and getting the job done right the first time.",
    ctaH2:    "Schedule Your Service Today",
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
    heroBody: "For over 18 years, GreenScape has been transforming Westfield properties into stunning outdoor retreats. From custom landscape designs to year-round maintenance, we bring your vision to life with expert craftsmanship and local expertise.",
    aboutH2:  "Rooted in Westfield",
    aboutBody: "Since 2005, GreenScape Landscaping has been proudly serving Westfield and surrounding communities with exceptional outdoor solutions. Our team understands the unique climate and soil conditions of central New Jersey, ensuring every project thrives season after season.",
    ctaH2:    "Ready to Transform Your Outdoor Space?",
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
    heroBody: "ProComfort HVAC delivers reliable heating and cooling solutions to Scotch Plains families and businesses. Our local technicians provide expert service with a personal touch, ensuring your comfort year-round.",
    aboutH2:  "Your Neighborhood HVAC Team",
    aboutBody: "For over two decades, ProComfort HVAC has been Scotch Plains' trusted heating and cooling partner. We're a local family business that understands New Jersey's challenging weather and your home's unique comfort needs.",
    ctaH2:    "Ready for Year-Round Comfort?",
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

async function getAICopy(bizName: string, city: string, state: string, style: string, bizType?: string) {
  const original = DEMO_COPY[style] || DEMO_COPY.bold;
  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `You are writing homepage copy for a small business website preview. 

Business name: "${bizName}"
Business type: ${bizType || "unknown — guess from the name"}
Location: ${city}, ${state}

IMPORTANT: Write copy specific to THIS business and what they actually do. Ignore any template or default industry. If it is a hot dog stand, write about hot dogs. If it is a florist, write about flowers.

Return ONLY valid JSON, no markdown, no explanation:
{
  "h1": "${city}'s [vivid superlative] [exactly what they do] — punchy, max 7 words after city name",
  "heroBody": "2 sentences, warm and confident, specific to their actual business, mentions the business name and city, 30-40 words",
  "services": [
    {"name": "Service Name", "desc": "One sentence, 15-20 words, specific to this business"},
    {"name": "Service Name", "desc": "One sentence, 15-20 words, specific to this business"},
    {"name": "Service Name", "desc": "One sentence, 15-20 words, specific to this business"},
    {"name": "Service Name", "desc": "One sentence, 15-20 words, specific to this business"},
    {"name": "Service Name", "desc": "One sentence, 15-20 words, specific to this business"},
    {"name": "Service Name", "desc": "One sentence, 15-20 words, specific to this business"}
  ],
  "aboutH2": "Short punchy about section headline, 4-6 words, no generic phrases like 'Your Neighborhood X Team'",
  "aboutBody": "3 sentences about the business, warm and specific, mentions business name and city, 50-60 words",
  "ctaH2": "Action-oriented CTA headline specific to what this business does, 5-7 words",
  "process": [
    {"title": "Step 1 title, 2-3 words", "desc": "One sentence, how a customer starts working with this specific business, 15-20 words"},
    {"title": "Step 2 title, 2-3 words", "desc": "One sentence, what happens next in the process, 15-20 words"},
    {"title": "Step 3 title, 2-3 words", "desc": "One sentence, the outcome/result for the customer, 15-20 words"}
  ],
  "blogTitles": [
    "SEO-optimized blog title specific to this business type and city, 8-12 words",
    "Second SEO-optimized blog title, different angle, 8-12 words"
  ]
}`,
      }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text.trim().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch {
    const typeWord = bizType || bizName.split(" ").slice(-1)[0];
    const svcMap: Record<string, Array<{name:string;desc:string}>> = {
      "restaurant": [{name:"Dine-In",desc:`Fresh meals served daily in a warm atmosphere in ${city}.`},{name:"Takeout & Delivery",desc:`Hot food ready for pickup or delivery across ${city}.`},{name:"Catering",desc:`Full-service catering for events and parties in ${city}.`},{name:"Private Events",desc:`Host your next event with our full catering services.`},{name:"Daily Specials",desc:`Rotating fresh menu items made from locally sourced ingredients.`},{name:"Gift Cards",desc:`Give the gift of great food for any occasion.`}],
      "bakery": [{name:"Custom Cakes",desc:`Handcrafted cakes for weddings, birthdays, and special events.`},{name:"Fresh Baked Goods",desc:`Daily breads, pastries, and treats made from scratch.`},{name:"Custom Orders",desc:`Tell us what you want and we will create something uniquely yours.`},{name:"Wholesale",desc:`Bulk orders available for restaurants and corporate clients.`},{name:"Seasonal Specials",desc:`Limited seasonal items baked fresh for holidays.`},{name:"Local Delivery",desc:`Fresh goods delivered to your door across ${city}.`}],
      "candle": [{name:"Custom Candles",desc:`Handcrafted candles made to order with your choice of scent and style.`},{name:"Wedding Collections",desc:`Beautiful candle collections designed for weddings and special events.`},{name:"Gift Sets",desc:`Curated candle gift sets perfect for any occasion.`},{name:"Corporate Gifts",desc:`Branded candle gifts for businesses and corporate events.`},{name:"Seasonal Collections",desc:`Limited edition seasonal scents released throughout the year.`},{name:"Wholesale Orders",desc:`Bulk candle orders available for retailers and event planners.`}],
    };
    const bizLower = (bizType + " " + bizName).toLowerCase();
    const svcKey = Object.keys(svcMap).find(k => bizLower.includes(k));
    const services = svcKey ? svcMap[svcKey] : [
      {name:`${typeWord} Services`, desc:`Professional ${typeWord.toLowerCase()} services in ${city}.`},
      {name:"Free Consultation",    desc:`Honest assessment and quote with no hidden fees.`},
      {name:"Quality Work",         desc:`Every job done right the first time, guaranteed.`},
      {name:"Licensed & Insured",   desc:`Fully licensed and insured for your peace of mind.`},
      {name:"Local Experts",        desc:`Proudly serving ${city} and surrounding communities.`},
      {name:"Fast Response",        desc:`We respond quickly and get the job done on your schedule.`},
    ];
    return {
      h1: `${city}'s Trusted ${typeWord} Experts`,
      heroBody: `${bizName} has been proudly serving ${city}, ${state}. Quality work and honest service, every time.`,
      aboutH2: `Proudly Serving ${city}`,
      aboutBody: `${bizName} is a trusted local business in ${city}. We take pride in delivering quality work.`,
      ctaH2: "Ready to Get Started?",
      process: [
        {title:"Call Us",        desc:"Give us a call to discuss your needs. Honest assessment, no pressure."},
        {title:"We Get to Work", desc:"Our team delivers quality work efficiently and with care."},
        {title:"You Are Happy",  desc:"We stand behind our work 100%. Satisfaction guaranteed."},
      ],
      blogTitles: [
        `Top ${typeWord} Tips Every ${city} Resident Should Know`,
        `How to Choose the Best ${typeWord} in ${city}, ${state}`,
      ],
      services,
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const style   = searchParams.get("style") || "bold";
  const bizNameRaw = (searchParams.get("biz") || "").trim();
  const bizType = (searchParams.get("type") || "").trim();
  const cityRaw = (searchParams.get("city") || "").trim();

  // ── Input normalization — fix user casing/typing ──────────────────────────
  // Title case helper: respects small words and existing acronyms
  const SMALL_WORDS = new Set(["of","the","and","an","a","or","for","in","on","at","to","by"]);
  function titleCase(s: string): string {
    return s.split(/(\s+|-)/).map((part, i) => {
      if (/^\s+$/.test(part) || part === "-") return part;
      const lower = part.toLowerCase();
      // Keep all-caps 2-3 letter tokens (likely acronyms: LLC, DMV, etc.)
      if (/^[A-Z]{2,3}$/.test(part)) return part;
      // Apostrophe words: Tony's, O'Brien — capitalize multi-char segments only
      if (lower.includes("'")) {
        return lower.split("'").map((seg, idx) => {
          if (idx === 0) return seg.charAt(0).toUpperCase() + seg.slice(1);
          // Possessive 's stays lowercase; O'Brien capitalizes Brien
          if (seg.length <= 1) return seg;
          return seg.charAt(0).toUpperCase() + seg.slice(1);
        }).join("'");
      }
      // Small words stay lowercase unless first word
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join("");
  }

  const bizName = bizNameRaw ? titleCase(bizNameRaw) : "";

  const demo     = DEMO_MAP[style] || DEMO_MAP.bold;
  const parts    = cityRaw.split(",").map((s: string) => s.trim());
  // Accept state abbreviation in any case: "nj", "Nj", "NJ" — also at end of cityPart
  const cityPart = parts[0] || demo.city;
  const stateFromCity = cityPart.match(/\b([A-Za-z]{2})$/)?.[1];
  const cityNoState = stateFromCity ? cityPart.replace(/\s+[A-Za-z]{2}$/, "").trim() : cityPart;
  const newCity  = titleCase(cityNoState);
  const stateRaw = parts[1] || stateFromCity || demo.state;
  const newState = stateRaw.toUpperCase();

  // ── JSON mode for mobile card preview ──────────────────────────────────────
  const format = searchParams.get("format");
  if (format === "json") {
    const copy = bizName ? await getAICopy(bizName, newCity, newState, style, bizType) : null;
    const industry = detectIndustry(bizType, bizName);
    const matched = !!industry;
    const _demoImgBase = DEMO_IMG_BASE[style] || DEMO_IMG_BASE.bold;
    const heroImage = industry && INDUSTRY_LIB[industry]
      ? `${INDUSTRY_LIB[industry]}/hero.png`
      : `${_demoImgBase}/hero.jpg`;
    // Gallery images — use industry library if slots exist, else demo site fallback
    // NOTE: salon library has hero.png only; use demo gallery for salon
    const _demoBase = _demoImgBase;
    const hasIndustryGallery = industry && INDUSTRY_LIB[industry] && matched && industry !== "salon";
    const galleryBase = hasIndustryGallery ? INDUSTRY_LIB[industry] : _demoBase;
    const galExt = hasIndustryGallery ? "png" : "jpg";
    const galleryImages = [
      `${galleryBase}/img3.${galExt}`,
      `${galleryBase}/img4.${galExt}`,
      `${galleryBase}/img5.${galExt}`,
    ];

    return NextResponse.json({
      h1:        copy?.h1        || `${newCity}'s Trusted Experts`,
      heroBody:  copy?.heroBody  || `${bizName} is proud to serve ${newCity}, ${newState}.`,
      services:  copy?.services  || [],
      heroImage,
      galleryImages,
      matched,
      city: `${newCity}, ${newState.toUpperCase()}`,
    });
  }

  try {
    const htmlPath = join(process.cwd(), "public", "sites", demo.folder, "index.html");
    let html = readFileSync(htmlPath, "utf-8");

    // Step 1: Name + city swap
    if (bizName) html = html.split(demo.bizName).join(bizName);
    html = html.split(demo.city).join(newCity);
    html = html.split(` ${demo.state}`).join(` ${newState}`);
    html = html.split(`,${demo.state}`).join(`,${newState}`);

    // Step 2: Industry image swap
    const industry = detectIndustry(bizType, bizName);
    const industryBase = industry ? INDUSTRY_LIB[industry] : null;
    const demoBase = DEMO_IMG_BASE[style] || DEMO_IMG_BASE.bold;

    if (industryBase) {
      // Salon library has hero only — swap hero only, leave gallery as demo
      const slots = industry === "salon"
        ? ["hero"]
        : ["hero", "about", "img3", "img4", "img5", "img6", "img7"];
      for (const slot of slots) {
        html = html.split(`${demoBase}/${slot}.jpg`).join(`${industryBase}/${slot}.png`);
        html = html.split(`${demoBase}/${slot}.png`).join(`${industryBase}/${slot}.png`);
      }
    }
    // No swap needed for non-matched industries — demo site images stay as-is

    // Step 3: AI copy rewrite
    let copy: any = null;
    if (bizName) {
      copy = await getAICopy(bizName, newCity, newState, style, bizType);
      const orig = DEMO_COPY[style] || DEMO_COPY.bold;

      const oldH1Swapped = orig.h1
        .replace(demo.city, newCity)
        .replace("Springfield", newCity).replace("Westfield", newCity).replace("Scotch Plains", newCity);
      if (html.includes(oldH1Swapped)) {
        html = html.split(oldH1Swapped).join(copy.h1);
      } else {
        html = html.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/, `<h1$1>${copy.h1}</h1>`);
      }

            const heroBodySwapped = orig.heroBody
        .split(demo.bizName).join(bizName || demo.bizName)
        .split(demo.city).join(newCity);
      // First try direct match, then fallback to replacing first <p> after <h1>
      const bodyIdx40 = html.indexOf(heroBodySwapped.substring(0, 40));
      if (bodyIdx40 !== -1) {
        const pEnd = html.indexOf("</p>", bodyIdx40);
        if (pEnd !== -1) {
          html = html.substring(0, bodyIdx40) + copy.heroBody + html.substring(pEnd);
        }
      } else {
        const h1End = html.indexOf("</h1>");
        if (h1End !== -1) {
          const pOpen  = html.indexOf("<p ", h1End);
          const pContent = html.indexOf(">", pOpen) + 1;
          const pClose = html.indexOf("</p>", pOpen);
          if (pOpen !== -1 && pClose !== -1) {
            html = html.substring(0, pContent) + copy.heroBody + html.substring(pClose);
          }
        }
      }
      

      if (Array.isArray(copy.services) && copy.services.length >= 6) {
        orig.services.forEach((origSvc: any, i: number) => {
          const newSvc  = copy.services[i];
          if (!newSvc) return;
          const origName = typeof origSvc === "string" ? origSvc : origSvc.name;
          const origDesc = typeof origSvc === "string" ? null    : origSvc.desc;
          const newName  = typeof newSvc  === "string" ? newSvc  : newSvc.name;
          const newDesc  = typeof newSvc  === "string" ? null    : newSvc.desc;
          if (origName && newName) html = html.split(origName).join(newName);
          if (origDesc && newDesc) html = html.split(origDesc).join(newDesc);
        });
      }

      // Swap about section h2, body, and CTA h2
      if (copy.aboutH2 && orig.aboutH2) {
        html = html.split(orig.aboutH2).join(copy.aboutH2);
        // Also try city-swapped version
        const aboutH2City = orig.aboutH2.replace(demo.city, newCity);
        html = html.split(aboutH2City).join(copy.aboutH2);
      }
      if (copy.aboutBody && orig.aboutBody) {
        const aboutBodySwapped = orig.aboutBody
          .split(demo.bizName).join(bizName || demo.bizName)
          .split(demo.city).join(newCity);
        const abIdx = html.indexOf(aboutBodySwapped.substring(0, 40));
        if (abIdx !== -1) {
          const abEnd = html.indexOf("</p>", abIdx);
          if (abEnd !== -1) html = html.substring(0, abIdx) + copy.aboutBody + html.substring(abEnd);
        } else {
          // fallback: find original text
          const origIdx = html.indexOf(orig.aboutBody.substring(0, 40));
          if (origIdx !== -1) {
            const origEnd = html.indexOf("</p>", origIdx);
            if (origEnd !== -1) html = html.substring(0, origIdx) + copy.aboutBody + html.substring(origEnd);
          }
        }
      }
      if (copy.ctaH2 && orig.ctaH2) {
        html = html.split(orig.ctaH2).join(copy.ctaH2);
      }

      // Swap process steps
      if (Array.isArray(copy.process) && Array.isArray(orig.process)) {
        orig.process.forEach((origStep: any, i: number) => {
          const newStep = copy.process[i];
          if (!newStep) return;
          if (origStep.title && newStep.title) html = html.split(origStep.title).join(newStep.title);
          if (origStep.desc  && newStep.desc)  html = html.split(origStep.desc).join(newStep.desc);
        });
      }

      // Swap blog post titles (city-swapped version)
      if (Array.isArray(copy.blogTitles) && Array.isArray(orig.blogTitles)) {
        orig.blogTitles.forEach((origTitle: string, i: number) => {
          const swapped = origTitle.replace(demo.city, newCity).replace("Springfield", newCity).replace("Westfield", newCity).replace("Scotch Plains", newCity);
          const newTitle = copy.blogTitles[i];
          if (newTitle) {
            html = html.split(swapped).join(newTitle);
            html = html.split(origTitle).join(newTitle);
          }
        });
      }
    }

    // Step 4: Preview banner
    const displayBiz = bizName || demo.bizName;
    const displayLoc = cityRaw || `${demo.city}, ${demo.state}`;
    const styleLabel = style === "bold" ? "Dark & Bold" : style === "warm" ? "Warm & Natural" : "Clean & Modern";

    const banner = `<div id="xpb" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#4648d4;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:8px 16px;font-family:system-ui,sans-serif;font-size:13px;box-shadow:0 2px 16px rgba(0,0,0,0.3);gap:8px;min-height:44px;">
  <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;overflow:hidden;">
    <span style="flex-shrink:0;">&#10024;</span>
    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Previewing <strong>${displayBiz}</strong> in ${displayLoc}</span>
    <span style="background:rgba(255,255,255,0.18);border-radius:4px;padding:2px 8px;font-size:11px;">${styleLabel}</span>
  </div>
  <a href="/order" style="background:#fff;color:#4648d4;font-weight:700;font-size:13px;border-radius:8px;padding:7px 18px;text-decoration:none;white-space:nowrap;">Get Started</a>
</div>
<style>body>*:not(#xpb){margin-top:0!important;}nav{position:sticky;top:44px!important;}body{padding-top:44px;}</style>`;

    html = html.replace(/<body([^>]*)>/, `<body$1>${banner}`);

    // Disable ALL internal links — preview is homepage only
    html = html.replace(/<a\s+([^>]*?)href=["'](?!https?:\/\/|mailto:|tel:)([^"']*?)["']/gi,
      '<a $1href="#" onclick="return false;" style="cursor:default;"');
    // Kill form submissions
    html = html.replace(/<form/gi, '<form onsubmit="return false;"');

    // Replace nav dropdown service links with AI-generated service names (no links, display only)
    html = html.replace(/<div class="nav-dropdown-menu">([\s\S]*?)<\/div>/, (_match: string, _inner: string) => {
      // Use whatever services ended up in the copy (already swapped above)
      // Just show them as non-clickable spans
      const svcList = Array.isArray(copy?.services) ? copy.services : (DEMO_COPY[style] || DEMO_COPY.bold).services;
      const items = svcList.slice(0, 6).map((s: any) => {
        const name = typeof s === "string" ? s : s.name;
        return `<span style="display:block;padding:8px 16px;font-size:13px;cursor:default;">${name}</span>`;
      }).join("");
      return `<div class="nav-dropdown-menu">${items}</div>`;
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err: any) {
    console.error("preview-demo error:", err);
    return NextResponse.json({ error: "Demo not found" }, { status: 404 });
  }
}

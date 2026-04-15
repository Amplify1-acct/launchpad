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
  [/remodel|bathroom|kitchen|basement|renovation|contractor|tile|flooring|cabinet/i, "painting"],
  [/restaurant|food|cafe|pizza|burger|diner|sushi|catering/i,        "restaurant"],
  [/moving|mover|storage|haul|junk/i,                                "moving"],
  [/auto|car|truck|vehicle|mechanic|tire|brake|oil.?change|transmission/i, "automotive"],
];

function detectIndustry(bizType: string, bizName: string): string | null {
  const text = `${bizType} ${bizName}`;
  for (const [pattern, industry] of TYPE_TO_INDUSTRY) {
    if (pattern.test(text)) return industry;
  }
  return null;
}

const DEMO_COPY: Record<string, { h1: string; heroBody: string; services: string[] }> = {
  bold: {
    h1: "Springfield's Trusted Auto Experts",
    heroBody: "For over 18 years, Matty's Automotive has been Springfield's go-to shop for honest, reliable car care. We treat your vehicle like our own, delivering ",
    services: ["Oil Changes", "Brake Service", "Engine Diagnostics", "Tire Rotation", "AC Repair", "Transmission Service"],
  },
  warm: {
    h1: "Westfield's Premier Landscaping Experts",
    heroBody: "GreenScape Landscaping has been transforming Westfield yards for over a decade. From lawn care to full landscape design, we make your outdoor space something to be proud of.",
    services: ["Lawn Mowing", "Landscape Design", "Mulching", "Tree Trimming", "Irrigation", "Snow Removal"],
  },
  clean: {
    h1: "Scotch Plains HVAC Experts",
    heroBody: "ProComfort HVAC keeps Scotch Plains homes and businesses comfortable year-round. Fast response, honest pricing, and work that's guaranteed.",
    services: ["AC Installation", "Furnace Repair", "Heat Pump Service", "Duct Cleaning", "Thermostat Install", "Emergency HVAC"],
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
  "services": ["Specific Service 1", "Specific Service 2", "Specific Service 3", "Specific Service 4", "Specific Service 5", "Specific Service 6"]
}`,
      }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text.trim().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return {
      h1: `${city}'s Trusted ${bizName.split(" ").slice(-1)[0]} Experts`,
      heroBody: `${bizName} has been serving ${city}, ${state} with pride. We're committed to quality work and honest service every time.`,
      services: original.services,
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const style   = searchParams.get("style") || "bold";
  const bizName = (searchParams.get("biz") || "").trim();
  const bizType = (searchParams.get("type") || "").trim();
  const cityRaw = (searchParams.get("city") || "").trim();

  const demo     = DEMO_MAP[style] || DEMO_MAP.bold;
  const parts    = cityRaw.split(",").map((s: string) => s.trim());
  const newCity  = parts[0] || demo.city;
  const newState = parts[1] || demo.state;

  // ── JSON mode for mobile card preview ──────────────────────────────────────
  const format = searchParams.get("format");
  if (format === "json") {
    const copy = bizName ? await getAICopy(bizName, newCity, newState, style, bizType) : null;
    const industry = detectIndustry(bizType, bizName);
    const matched = !!industry;
    const heroImage = industry && INDUSTRY_LIB[industry]
      ? `${INDUSTRY_LIB[industry]}/hero.png`
      : null;
    return NextResponse.json({
      h1:        copy?.h1        || `${newCity}'s Trusted Experts`,
      heroBody:  copy?.heroBody  || `${bizName} is proud to serve ${newCity}, ${newState}.`,
      services:  copy?.services  || [],
      heroImage,
      matched,
      city: `${newCity}, ${newState}`,
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
      // Swap hero — all industries have hero.png
      html = html.split(`${demoBase}/hero.jpg`).join(`${industryBase}/hero.png`);
      html = html.split(`${demoBase}/hero.png`).join(`${industryBase}/hero.png`);
      // Swap remaining slots if library has them (future-proof when we fill them in)
      for (const slot of ["about", "img3", "img4", "img5", "img6", "img7"]) {
        html = html.split(`${demoBase}/${slot}.jpg`).join(`${industryBase}/${slot}.png`);
        html = html.split(`${demoBase}/${slot}.png`).join(`${industryBase}/${slot}.png`);
      }
    }

    // Step 3: AI copy rewrite
    if (bizName) {
      const copy = await getAICopy(bizName, newCity, newState, style, bizType);
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
      const searchStart = heroBodySwapped.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const bodyMatch = html.search(new RegExp(searchStart));
      if (bodyMatch !== -1) {
        const pEnd = html.indexOf("</p>", bodyMatch);
        if (pEnd !== -1) {
          html = html.substring(0, bodyMatch) + copy.heroBody + html.substring(pEnd);
        }
      }

      if (Array.isArray(copy.services) && copy.services.length >= 6) {
        orig.services.forEach((svc: string, i: number) => {
          if (copy.services[i]) html = html.split(svc).join(copy.services[i]);
        });
      }
    }

    // Step 4: Preview banner
    const displayBiz = bizName || demo.bizName;
    const displayLoc = cityRaw || `${demo.city}, ${demo.state}`;
    const styleLabel = style === "bold" ? "Dark & Bold" : style === "warm" ? "Warm & Natural" : "Clean & Modern";

    const banner = `<div id="xpb" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#4648d4;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;font-family:system-ui,sans-serif;font-size:13px;box-shadow:0 2px 16px rgba(0,0,0,0.3);gap:12px;">
  <div style="display:flex;align-items:center;gap:10px;">
    <span>✨</span>
    <span>Previewing <strong>${displayBiz}</strong> in ${displayLoc}</span>
    <span style="background:rgba(255,255,255,0.18);border-radius:4px;padding:2px 8px;font-size:11px;">${styleLabel}</span>
  </div>
  <a href="/order" style="background:#fff;color:#4648d4;font-weight:700;font-size:13px;border-radius:8px;padding:7px 18px;text-decoration:none;">Get Started →</a>
</div>
<style>body>*:not(#xpb){margin-top:48px!important;}</style>`;

    html = html.replace(/<body([^>]*)>/, `<body$1>${banner}`);

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

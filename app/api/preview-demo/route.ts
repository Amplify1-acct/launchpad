import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";

const DEMO_MAP: Record<string, { folder: string; bizName: string; city: string; state: string }> = {
  bold:  { folder: "mattys-automotive",      bizName: "Matty's Automotive",    city: "Springfield",   state: "NJ" },
  warm:  { folder: "greenscape-landscaping",  bizName: "GreenScape Landscaping", city: "Westfield",    state: "NJ" },
  clean: { folder: "procomfort-hvac",         bizName: "ProComfort HVAC",       city: "Scotch Plains", state: "NJ" },
};

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

async function getAICopy(bizName: string, city: string, state: string, style: string) {
  const original = DEMO_COPY[style] || DEMO_COPY.bold;
  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Rewrite website copy for a small business preview. Business: "${bizName}" in ${city}, ${state}. Guess the industry and services from the name.

Return ONLY valid JSON, no markdown:
{
  "h1": "${city}'s [superlative] [what they do] — max 6 words after the city",
  "heroBody": "2 warm confident sentences mentioning the business name and city, 30-40 words total",
  "services": ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5", "Service 6"]
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
  const cityRaw = (searchParams.get("city") || "").trim();

  const demo   = DEMO_MAP[style] || DEMO_MAP.bold;
  const parts    = cityRaw.split(",").map((s: string) => s.trim());
  const newCity  = parts[0] || demo.city;
  const newState = parts[1] || demo.state;

  try {
    const htmlPath = join(process.cwd(), "public", "sites", demo.folder, "index.html");
    let html = readFileSync(htmlPath, "utf-8");

    // Step 1: string swap
    if (bizName) html = html.split(demo.bizName).join(bizName);
    html = html.split(demo.city).join(newCity);
    html = html.split(` ${demo.state}`).join(` ${newState}`);
    html = html.split(`,${demo.state}`).join(`,${newState}`);

    // Step 2: AI copy rewrite
    if (bizName) {
      const copy = await getAICopy(bizName, newCity, newState, style);
      const orig = DEMO_COPY[style] || DEMO_COPY.bold;

      // Replace H1
      const oldH1Swapped = orig.h1
        .replace(orig.city || demo.city, newCity)
        .replace("Springfield", newCity).replace("Westfield", newCity).replace("Scotch Plains", newCity);
      if (html.includes(oldH1Swapped)) {
        html = html.split(oldH1Swapped).join(copy.h1);
      } else {
        // Try the already-swapped version
        html = html.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/, `<h1$1>${copy.h1}</h1>`);
      }

      // Replace hero body — find first long <p> after hero
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

      // Replace services
      if (Array.isArray(copy.services) && copy.services.length >= 6) {
        orig.services.forEach((svc, i) => {
          if (copy.services[i]) html = html.split(svc).join(copy.services[i]);
        });
      }
    }

    // Step 3: Preview banner
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

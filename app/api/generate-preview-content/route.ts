import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const DEFAULT_SERVICES: Record<string, string[]> = {
  auto: ["Full Restoration","Custom Paint","Engine Rebuilds","Chrome Work","Storage","Appraisals"],
  restaurant: ["Dine-In","Takeout","Catering","Private Events","Bar","Weekend Brunch"],
  gym: ["Personal Training","Group Classes","Nutrition","Strength","Yoga","Recovery"],
  plumbing: ["Emergency Repairs","Drain Cleaning","Water Heaters","Pipe Work","Remodels","Leak Detection"],
  dental: ["General Care","Whitening","Implants","Invisalign","Emergency","Cosmetic"],
  law: ["Free Consultation","Case Review","Litigation","Negotiation","Appeals","Settlement"],
  salon: ["Cuts & Color","Highlights","Extensions","Bridal","Treatments","Blowouts"],
  realestate: ["Buyer Rep","Seller Services","Luxury Homes","Investment","First-Time Buyers","Market Analysis"],
  pet: ["Grooming","Boarding","Daycare","Training","Mobile Service","Wellness"],
  hvac: ["AC Install","Heating Repair","Duct Cleaning","Maintenance","Emergency","Smart Thermostats"],
  bakery: ["Artisan Breads","Custom Cakes","Pastries","Wedding Cakes","Gluten-Free","Coffee"],
  landscaping: ["Lawn Care","Landscape Design","Irrigation","Tree Service","Hardscaping","Snow Removal"],
};

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch {}

  const { industry = "", bizType = "", city = "your city" } = body;

  const fallbackServices = DEFAULT_SERVICES[industry] || ["Professional Service","Consultation","Quality Work","Expert Care","Fast Response","Free Estimates"];

  const fallback = {
    headline: `${bizType || industry} — ${city}\'s Trusted Professionals`,
    tagline: `Quality ${bizType || industry} services delivered with care.`,
    subtext: `Serving ${city} with professional, reliable service. Contact us today for a free estimate.`,
    services: fallbackServices,
    stat1: "15+", stat1Label: "Years Experience",
    stat2: "500+", stat2Label: "Happy Clients",
  };

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Write website hero copy for a local small business. Return ONLY valid JSON, no markdown.

Business type: ${bizType}
Industry: ${industry}
City: ${city}

{
  "headline": "Bold 6-9 word hero headline specific to ${bizType} in ${city}",
  "tagline": "One punchy sentence about their unique value",
  "subtext": "Two sentences, professional and local-feeling, no generic filler",
  "services": ["Service 1","Service 2","Service 3","Service 4","Service 5","Service 6"],
  "stat1": "20+",
  "stat1Label": "Years Experience",
  "stat2": "500+",
  "stat2Label": "Happy Clients"
}

Make services specific to ${bizType}. Stats should be realistic for this type of business.`,
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const clean = raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({
      headline:    parsed.headline    || fallback.headline,
      tagline:     parsed.tagline     || fallback.tagline,
      subtext:     parsed.subtext     || fallback.subtext,
      services:    Array.isArray(parsed.services) ? parsed.services : fallback.services,
      stat1:       parsed.stat1       || fallback.stat1,
      stat1Label:  parsed.stat1Label  || fallback.stat1Label,
      stat2:       parsed.stat2       || fallback.stat2,
      stat2Label:  parsed.stat2Label  || fallback.stat2Label,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}

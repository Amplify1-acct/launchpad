import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface PreviewBody {
  name?: string;
  industry?: string;
  city?: string;
  phone?: string;
  customIndustry?: string;
  description?: string;
  services?: string[];
  yearsInBusiness?: string;
  differentiator?: string;
  stat1Label?: string;
  stat1Value?: string;
  stat2Label?: string;
  stat2Value?: string;
}

export async function POST(req: Request) {
  let body: PreviewBody = {};
  try { body = await req.json() as PreviewBody; } catch { /* use defaults */ }

  const name = body.name || "Your Business";
  const industry = body.industry || "";
  const city = body.city || "your city";
  const phone = body.phone || "";
  const customIndustry = body.customIndustry || "";
  const description = body.description || "";
  const rawServices = body.services;
  const yearsInBusiness = body.yearsInBusiness || "";
  const differentiator = body.differentiator || "";
  const stat1Label = body.stat1Label || "Years in Business";
  const stat1Value = body.stat1Value || "";
  const stat2Label = body.stat2Label || "Clients Served";
  const stat2Value = body.stat2Value || "";

  const industryLabel = industry === "other"
    ? (customIndustry || "business")
    : (industry || "business");

  const serviceList: string = Array.isArray(rawServices)
    ? rawServices.slice(0, 6).join(", ")
    : "";

  const fallback = {
    headline: `${name} — Trusted ${industryLabel} Professionals in ${city}`,
    tagline: `Quality ${industryLabel} services delivered with care and expertise.`,
    subtext: `Serving ${city} with professional, reliable ${industryLabel} services${yearsInBusiness ? ` for over ${yearsInBusiness} years` : ""}. Contact us today for a free estimate.`,
    serviceHeadline: "Our Services",
    aboutText: `${name} is a trusted ${industryLabel} business serving ${city} and the surrounding community. ${differentiator || "We pride ourselves on quality workmanship and exceptional customer service."}`,
    stat1: stat1Value || (yearsInBusiness ? `${yearsInBusiness}+` : "10+"),
    stat1Label: stat1Label,
    stat2: stat2Value || "500+",
    stat2Label: stat2Label,
  };

  const prompt = `Write website hero copy for a real small business. Use their actual info — do NOT invent facts.

Business: ${name}
Type: ${industryLabel}
City: ${city}
Description: ${description || "not provided"}
Services: ${serviceList || "not provided"}
Years in business: ${yearsInBusiness || "not provided"}
What makes them different: ${differentiator || "not provided"}

Return ONLY a raw JSON object. No markdown, no backticks, no explanation:
{
  "headline": "Bold 6-9 word hero headline specific to their business",
  "tagline": "One punchy sentence about their unique value",
  "subtext": "Two sentences using their real description, professional tone",
  "serviceHeadline": "Section heading for their services",
  "aboutText": "2-3 sentences using their actual description and differentiator",
  "stat1": "${stat1Value || yearsInBusiness || "15+"}",
  "stat1Label": "${stat1Label}",
  "stat2": "${stat2Value || "500+"}",
  "stat2Label": "${stat2Label}"
}`;

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const clean = raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean) as Record<string, string>;

    return NextResponse.json({
      headline:        parsed.headline        || fallback.headline,
      tagline:         parsed.tagline         || fallback.tagline,
      subtext:         parsed.subtext         || fallback.subtext,
      serviceHeadline: parsed.serviceHeadline || fallback.serviceHeadline,
      aboutText:       parsed.aboutText       || fallback.aboutText,
      stat1:           parsed.stat1           || fallback.stat1,
      stat1Label:      parsed.stat1Label      || fallback.stat1Label,
      stat2:           parsed.stat2           || fallback.stat2,
      stat2Label:      parsed.stat2Label      || fallback.stat2Label,
      services:        rawServices || [],
    });
  } catch {
    return NextResponse.json(fallback);
  }
}

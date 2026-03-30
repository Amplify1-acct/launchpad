import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const {
    name = "Your Business",
    industry = "",
    city = "your city",
    phone = "",
    customIndustry = "",
    description = "",
    services = [],
    yearsInBusiness = "",
    differentiator = "",
    stat1Label = "Years in Business",
    stat1Value = "",
    stat2Label = "Clients Served",
    stat2Value = "",
  } = body as {
    name?: string; industry?: string; city?: string; phone?: string;
    customIndustry?: string; description?: string; services?: string[];
    yearsInBusiness?: string; differentiator?: string;
    stat1Label?: string; stat1Value?: string;
    stat2Label?: string; stat2Value?: string;
  };

  const industryLabel = industry === "other"
    ? (customIndustry || "business")
    : (industry || "business");

  const serviceList = Array.isArray(services) ? (services as string[]).slice(0, 6).join(", ") : "";

  const fallback = {
    headline: `${name} — ${city}\'s Trusted ${industryLabel} Professionals`,
    tagline: `Quality ${industryLabel} services delivered with care and expertise.`,
    subtext: `Serving ${city} with professional, reliable ${industryLabel} services since ${yearsInBusiness || "day one"}. Contact us today for a free estimate.`,
    serviceHeadline: "Our Services",
    aboutText: `${name} is a trusted ${industryLabel} business serving ${city} and the surrounding community. We pride ourselves on quality workmanship and exceptional customer service.`,
    stat1: stat1Value || (yearsInBusiness ? yearsInBusiness + "+" : "10+"),
    stat1Label: stat1Label || "Years Experience",
    stat2: stat2Value || "500+",
    stat2Label: stat2Label || "Happy Clients",
  };

  const prompt = `You are writing website copy for a real small business. Use the information provided — do NOT invent facts.

BUSINESS INFO:
- Name: ${name}
- Type: ${industryLabel}
- City: ${city}
- Phone: ${phone || "not provided"}
- Description: ${description || "not provided"}
- Services: ${serviceList || "not provided"}
- Years in Business: ${yearsInBusiness || "not provided"}
- What makes them different: ${differentiator || "not provided"}

Write copy that feels authentic, local, and specific to their actual business. Use their real description and services.

Return ONLY a JSON object, no markdown, no backticks, no explanation:
{
  "headline": "Bold 6-9 word hero headline specific to what they actually do",
  "tagline": "One punchy sentence about their unique value proposition",
  "subtext": "Two sentences using their real description — professional and trustworthy sounding",
  "serviceHeadline": "Section heading for their services (e.g. \"What We Offer\" or \"Our Specialties\")",
  "aboutText": "2-3 sentences for their about section using their actual description and differentiator",
  "stat1": "${stat1Value || (yearsInBusiness || "15") + "+"}",
  "stat1Label": "${stat1Label || "Years in Business"}",
  "stat2": "${stat2Value || "500+"}",
  "stat2Label": "${stat2Label || "Happy Clients"}"
}`;

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const clean = raw.replace(/\`\`\`(?:json)?\n?/g, "").replace(/\`\`\`/g, "").trim();
    const parsed = JSON.parse(clean);

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
      services:        serviceList ? serviceList.split(", ") : [],
    });
  } catch {
    return NextResponse.json(fallback);
  }
}

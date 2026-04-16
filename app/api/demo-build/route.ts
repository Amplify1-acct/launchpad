import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

async function dispatchWorkflow(slug: string, bizName: string, city: string, desc: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return;
  await fetch(
    "https://api.github.com/repos/Amplify1-acct/launchpad/actions/workflows/generate-custom-demo.yml/dispatches",
    {
      method: "POST",
      headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main", inputs: { demo_slug: slug, biz_name: bizName, city, base_prompt: desc.substring(0, 400) } }),
    }
  );
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== "exsisto-internal-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, bizName, city, desc, servicesList, customers } = await request.json();
  if (!slug || !bizName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [cityPart, statePart] = city.split(",").map((s: string) => s.trim());

  // Generate copy and update DB
  try {
    const copy = await generateCustomCopy(bizName, cityPart, statePart || "NJ", desc, servicesList, customers);
    await supabase.from("demo_builds").update({ copy }).eq("slug", slug);
  } catch (err) {
    console.error("Copy generation failed:", err);
  }

  // Dispatch image workflow
  await dispatchWorkflow(slug, bizName, city, desc);

  return NextResponse.json({ ok: true, slug });
}

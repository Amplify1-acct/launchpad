import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { name, industry, city, phone } = await req.json();

    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Generate a short, punchy headline and tagline for a small business website.

Business: ${name}
Industry: ${industry}
City: ${city}

Respond with ONLY valid JSON, no other text:
{
  "headline": "5-8 word hero headline for their website",
  "tagline": "One sentence that captures what makes them great",
  "description": "2 sentences about the business for the about section"
}

Make it specific to their industry and feel authentic, not generic. No quotes inside the strings.`,
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(text.trim());
    return NextResponse.json(parsed);
  } catch (err) {
    // Return fallback content so the page still works
    return NextResponse.json({
      headline: "Professional Service You Can Trust",
      tagline: "Serving your community with quality and care.",
      description: "We are dedicated to providing exceptional service to every customer.",
    });
  }
}

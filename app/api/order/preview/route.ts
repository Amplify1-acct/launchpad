import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const client = new Anthropic();

const ACCENT_COLORS: Record<string, string> = {
  auto:        "#dc2626",
  bakery:      "#b45309",
  dental:      "#0891b2",
  gym:         "#7c3aed",
  hvac:        "#1d4ed8",
  landscaping: "#16a34a",
  law:         "#1e293b",
  pet:         "#f59e0b",
  plumbing:    "#1d4ed8",
  realestate:  "#0f766e",
  restaurant:  "#dc2626",
  salon:       "#db2777",
  other:       "#4648d4",
};

const STOCK_IMAGES: Record<string, string> = {
  auto:        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
  bakery:      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  dental:      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80",
  gym:         "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  hvac:        "https://images.unsplash.com/photo-1621905251189-08b45249b29e?w=800&q=80",
  landscaping: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  law:         "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
  pet:         "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
  plumbing:    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80",
  realestate:  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  restaurant:  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  salon:       "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
  other:       "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
};

export const maxDuration = 45;

export async function POST(request: Request) {
  const { businessName, industry, city, state, phone, description, services, template } = await request.json();

  if (!businessName || !industry) {
    return NextResponse.json({ error: "businessName and industry required" }, { status: 400 });
  }

  const templateName = template || "skeleton-clean";
  const accentColor = ACCENT_COLORS[industry] || "#4648d4";
  const heroImage = STOCK_IMAGES[industry] || STOCK_IMAGES.other;
  const location = [city, state].filter(Boolean).join(", ") || "Your City";
  const serviceList = services || "";
  const year = new Date().getFullYear();

  // Generate tokens with Claude
  let tokens: Record<string, string> = {};

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: `Generate website copy tokens for a local business. Return ONLY a valid JSON object, no markdown, no explanation.

Business: ${businessName}
Industry: ${industry}
Location: ${location}
Description: ${description || `${industry} business in ${location}`}
Services: ${serviceList || ""}

Return this exact JSON structure with realistic, specific copy:
{
  "hero_headline": "Bold 6-8 word headline for ${businessName}",
  "hero_highlight": "2-3 word italic highlight phrase within the headline (a key phrase from it)",
  "hero_subheadline": "One compelling sentence about what makes them great in ${location}",
  "cta": "Book Free Estimate",
  "trust_1": "Licensed & Insured",
  "trust_2": "Serving ${location}",
  "trust_3": "5-Star Rated",
  "why_headline": "Why ${location} Chooses ${businessName}",
  "why_description": "Two sentences about their value proposition, specific to their services",
  "feature_1_title": "First key differentiator",
  "feature_1_description": "One sentence expanding on it",
  "feature_2_title": "Second key differentiator",
  "feature_2_description": "One sentence expanding on it",
  "feature_3_title": "Third key differentiator",
  "feature_3_description": "One sentence expanding on it",
  "services_heading": "Our Services",
  "service_1_name": "First service name",
  "service_1_icon": "🔧",
  "service_1_description": "Short description",
  "service_2_name": "Second service name",
  "service_2_icon": "⚡",
  "service_2_description": "Short description",
  "service_3_name": "Third service name",
  "service_3_icon": "🛠️",
  "service_3_description": "Short description",
  "service_4_name": "Fourth service name",
  "service_4_icon": "✅",
  "service_4_description": "Short description",
  "service_5_name": "Fifth service name",
  "service_5_icon": "🏆",
  "service_5_description": "Short description",
  "service_6_name": "Sixth service name",
  "service_6_icon": "💯",
  "service_6_description": "Short description",
  "stat_1_value": "500+",
  "stat_1_label": "Happy Customers",
  "process_heading": "How It Works",
  "step_1_title": "Step 1 title",
  "step_1_description": "Brief step description",
  "step_2_title": "Step 2 title",
  "step_2_description": "Brief step description",
  "step_3_title": "Step 3 title",
  "step_3_description": "Brief step description",
  "step_4_title": "Step 4 title",
  "step_4_description": "Brief step description",
  "reviews_heading": "What Our Customers Say",
  "review_1_name": "Sarah M.",
  "review_1_initials": "SM",
  "review_1_detail": "${location} resident",
  "review_1_text": "Realistic 1-2 sentence review specific to this business type",
  "review_2_name": "John D.",
  "review_2_initials": "JD",
  "review_2_detail": "${location} homeowner",
  "review_2_text": "Realistic 1-2 sentence review specific to this business type",
  "review_3_name": "Maria L.",
  "review_3_initials": "ML",
  "review_3_detail": "Local customer",
  "review_3_text": "Realistic 1-2 sentence review specific to this business type",
  "review_rating": "4.9",
  "review_count": "127",
  "contact_heading": "Get In Touch",
  "contact_description": "Ready to get started? Contact us today for a free estimate."
}`,
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    tokens = JSON.parse(clean);
  } catch (e) {
    console.error("Token generation failed:", e);
    // Fallback tokens
    tokens = {
      hero_headline: `Professional ${industry} Services in ${location}`,
      hero_highlight: `${industry} Services`,
      hero_subheadline: `${businessName} delivers expert ${industry} solutions to ${location} residents.`,
      cta: "Get a Free Estimate",
      trust_1: "Licensed & Insured", trust_2: `Serving ${location}`, trust_3: "5-Star Rated",
      why_headline: `Why ${location} Chooses ${businessName}`,
      why_description: `We deliver professional ${industry} services with honesty and care. Your satisfaction is our top priority.`,
      feature_1_title: "Expert Team", feature_1_description: "Trained professionals with years of experience.",
      feature_2_title: "Fast Response", feature_2_description: "We show up on time, every time.",
      feature_3_title: "Fair Pricing", feature_3_description: "Transparent quotes with no hidden fees.",
      services_heading: "Our Services",
      service_1_name: "Service 1", service_1_icon: "🔧", service_1_description: "Professional service delivered right.",
      service_2_name: "Service 2", service_2_icon: "⚡", service_2_description: "Fast and reliable every time.",
      service_3_name: "Service 3", service_3_icon: "🛠️", service_3_description: "Quality work guaranteed.",
      service_4_name: "Service 4", service_4_icon: "✅", service_4_description: "Done right the first time.",
      service_5_name: "Service 5", service_5_icon: "🏆", service_5_description: "Award-winning results.",
      service_6_name: "Service 6", service_6_icon: "💯", service_6_description: "100% satisfaction guaranteed.",
      stat_1_value: "500+", stat_1_label: "Happy Customers",
      process_heading: "How It Works",
      step_1_title: "Contact Us", step_1_description: "Call or fill out our form.",
      step_2_title: "Get a Quote", step_2_description: "We assess and give you a fair price.",
      step_3_title: "We Get to Work", step_3_description: "Our team handles everything.",
      step_4_title: "You're Satisfied", step_4_description: "We don't leave until you're happy.",
      reviews_heading: "What Our Customers Say",
      review_1_name: "Sarah M.", review_1_initials: "SM", review_1_detail: `${location} resident`,
      review_1_text: "Outstanding service from start to finish. Highly recommend!",
      review_2_name: "John D.", review_2_initials: "JD", review_2_detail: "Local homeowner",
      review_2_text: "Professional, punctual, and fairly priced. Will use again.",
      review_3_name: "Maria L.", review_3_initials: "ML", review_3_detail: "Satisfied customer",
      review_3_text: "Best in the area. Couldn't be happier with the results.",
      review_rating: "4.9", review_count: "127",
      contact_heading: "Get In Touch",
      contact_description: "Ready to get started? Contact us today for a free estimate.",
    };
  }

  // Static tokens from form data
  const staticTokens: Record<string, string> = {
    business_name: businessName,
    city: city || "Your City",
    state: state || "",
    address: city ? `${city}, ${state || ""}` : "Your City",
    phone: phone || "(555) 555-5555",
    phone_raw: (phone || "5555555555").replace(/\D/g, ""),
    email: "info@" + businessName.toLowerCase().replace(/\s+/g, "") + ".com",
    hours: "Mon–Fri 8am–6pm · Sat 9am–4pm",
    accent_color: accentColor,
    hero_image_url: heroImage,
    about_image_url: heroImage,
    meta_title: `${businessName} — ${location}`,
    meta_description: `${businessName} provides professional ${industry} services in ${location}.`,
    year: String(year),
  };

  const allTokens = { ...tokens, ...staticTokens };

  // Load template and fill tokens
  let html: string;
  try {
    html = readFileSync(join(process.cwd(), "templates", `${templateName}.html`), "utf-8");
  } catch {
    html = readFileSync(join(process.cwd(), "templates", "skeleton-clean.html"), "utf-8");
  }

  // Replace all {{token}} placeholders
  for (const [key, value] of Object.entries(allTokens)) {
    html = html.replaceAll(`{{${key}}}`, value || "");
  }

  // Clear any remaining unfilled tokens
  html = html.replace(/\{\{[^}]+\}\}/g, "");

  return NextResponse.json({ html });
}

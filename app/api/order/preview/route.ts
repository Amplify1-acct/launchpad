import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const client = new Anthropic();

export const maxDuration = 45;

// Each Stitch template with its hardcoded business name, phone, city to replace
const STITCH_TEMPLATES: Record<string, {
  label: string;
  biz: string[];      // all variations of biz name in the file
  phone: string[];    // all phone formats in the file
  city: string[];     // city/state strings to replace
}> = {
  auto: {
    label: "Automotive Bold",
    biz: ["MATTY'S AUTOMOTIVE", "Matty's Automotive"],
    phone: [],
    city: [],
  },
  dental: {
    label: "Clean Professional",
    biz: ["Bright Smile Dental"],
    phone: ["(908) 555-0134", "9085550134"],
    city: ["Scotch Plains, NJ", "Scotch Plains"],
  },
  gym: {
    label: "Dark & Powerful",
    biz: ["IRON PEAK", "Iron Peak"],
    phone: ["(908) 555-0178", "9085550178"],
    city: ["SUMMIT, NEW JERSEY", "Summit, NJ", "Summit"],
  },
  hvac: {
    label: "Modern Technical",
    biz: ["Cool Breeze HVAC", "Cool Breeze"],
    phone: ["(908) 555-0134", "9085550134"],
    city: [],
  },
  law: {
    label: "Prestige Dark",
    biz: ["Morgan & Associates", "Morgan &amp; Associates"],
    phone: ["(973) 555-0189", "9735550189"],
    city: ["Newark, NJ", "Newark"],
  },
  pet: {
    label: "Warm & Friendly",
    biz: ["Happy Paws Pet Care", "Happy Paws"],
    phone: ["(908) 555-0123", "9085550123"],
    city: ["Cranford, NJ", "Cranford"],
  },
  plumbing: {
    label: "Trustworthy Blue",
    biz: ["FlowRight Plumbing", "FlowRight"],
    phone: ["(908) 555-0112", "9085550112"],
    city: ["Westfield, NJ", "Westfield"],
  },
  realestate: {
    label: "Luxury Minimal",
    biz: ["Summit Realty Group", "Summit Realty"],
    phone: ["(908) 555-0145", "9085550145"],
    city: [],
  },
  restaurant: {
    label: "Elegant & Rich",
    biz: ["La Bella Cucina"],
    phone: [],
    city: ["Hoboken, NJ", "Hoboken"],
  },
  salon: {
    label: "Editorial Chic",
    biz: ["Velvet Studio"],
    phone: [],
    city: ["Westfield, NJ", "Westfield"],
  },
};

function swapContent(
  html: string,
  templateKey: string,
  businessName: string,
  phone: string,
  city: string,
  state: string,
): string {
  const t = STITCH_TEMPLATES[templateKey];
  if (!t) return html;

  const location = [city, state].filter(Boolean).join(", ");
  const phoneRaw = phone.replace(/\D/g, "");
  const phoneFormatted = phone || "(555) 555-5555";

  // Replace business name (all variations)
  for (const biz of t.biz) {
    html = html.replaceAll(biz, businessName);
  }

  // Replace phone (all formats)
  for (const ph of t.phone) {
    html = html.replaceAll(ph, ph.includes("(") ? phoneFormatted : phoneRaw);
  }

  // Replace city/state (all variations)
  for (const c of t.city) {
    html = html.replaceAll(c, location || city || "Your City");
  }

  // Also swap tel: href attributes
  if (phoneRaw) {
    html = html.replace(/href="tel:\d+"/g, `href="tel:${phoneRaw}"`);
  }

  // Update page title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${businessName} | ${location}</title>`);

  return html;
}

export async function POST(request: Request) {
  const {
    businessName,
    industry,
    city,
    state,
    phone,
    description,
    services,
    template,   // which Stitch template key to use
  } = await request.json();

  if (!businessName) {
    return NextResponse.json({ error: "businessName required" }, { status: 400 });
  }

  const templateKey = template || "plumbing";
  const location = [city, state].filter(Boolean).join(", ");

  // Load the Stitch template HTML
  let html: string;
  try {
    html = readFileSync(
      join(process.cwd(), "public", "stitch-templates", `${templateKey}.html`),
      "utf-8"
    );
  } catch {
    return NextResponse.json({ error: `Template ${templateKey} not found` }, { status: 404 });
  }

  // Step 1: Simple string swaps (biz name, phone, city)
  html = swapContent(html, templateKey, businessName, phone || "", city || "", state || "");

  // Step 2: Use Claude Haiku to generate a headline + subheadline specific to their business
  // (quick, cheap — just rewrites the hero section copy)
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Write a hero headline and subheadline for this business website. Return ONLY valid JSON.

Business: ${businessName}
What they do: ${description || services || industry || "local services"}
Location: ${location}

{
  "headline": "Bold 5-8 word headline that says what they do",
  "subheadline": "One sentence, compelling, specific to their business and location"
}`,
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, "").trim());

    // Inject the headline — find the <h1> tag and replace its text content
    // Each template has a different h1 structure, so we do a targeted replacement
    if (parsed.headline) {
      // Replace the first significant h1 text block
      html = html.replace(
        /(<h1[^>]*>)([\s\S]*?)(<\/h1>)/,
        `$1${parsed.headline}$3`
      );
    }
    if (parsed.subheadline) {
      // Replace the first <p> after the h1 that looks like a subheadline
      html = html.replace(
        /(<h1[\s\S]*?<\/h1>[\s
]*<p[^>]*>)([\s\S]*?)(<\/p>)/,
        `$1${parsed.subheadline}$3`
      );
    }
  } catch (e) {
    // Headline generation failed — keep original, that's fine
    console.error("Headline gen failed:", e);
  }

  // Step 3: Add a preview disclaimer overlay at the top
  const disclaimer = `
<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#1b1b25;
  display:flex;align-items:center;justify-content:space-between;padding:8px 16px;
  font-family:-apple-system,sans-serif;font-size:12px;gap:12px;flex-wrap:wrap;">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="color:#6366f1;font-weight:700;letter-spacing:0.5px;font-size:11px;">PREVIEW</span>
    <span style="color:#fff;font-weight:600;">${businessName}</span>
    <span style="background:#2d2d3d;color:#9090a8;font-size:11px;padding:3px 10px;border-radius:100px;">
      Images are samples · Copy will be customized for your business
    </span>
  </div>
</div>
<div style="height:42px;"></div>`;

  html = html.replace("<body", disclaimer + "<body");

  // Actually inject after <body> opening tag
  html = html.replace(/(<body[^>]*>)/, `$1${disclaimer}`).replace(disclaimer + "<body", "<body");

  return NextResponse.json({ html, templateKey });
}

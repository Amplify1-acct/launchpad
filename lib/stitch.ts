// lib/stitch.ts
// Server-side Stitch API client using GCP service account credentials

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

// Get a GCP access token from service account credentials
async function getAccessToken(): Promise<string> {
  const keyJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!keyJson) throw new Error("GCP_SERVICE_ACCOUNT_JSON not set");

  const key: ServiceAccountKey = JSON.parse(keyJson);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

  const unsigned = `${b64url(header)}.${b64url(payload)}`;

  // Sign with RS256 using the private key
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign
    .sign(key.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${unsigned}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch(key.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

const STITCH_BASE = "https://stitch.googleapis.com/v1";
const PROJECT_ID = "gen-lang-client-0553736847";

// Create a new Stitch project
async function createProject(title: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${STITCH_BASE}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-goog-user-project": PROJECT_ID,
    },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!data.name) throw new Error(`Create project failed: ${JSON.stringify(data)}`);
  return data.name.split("/").pop(); // return just the project ID
}

// Generate a screen from text prompt
async function generateScreen(
  projectId: string,
  prompt: string,
  deviceType = "DESKTOP"
): Promise<{ screenId: string; htmlUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${STITCH_BASE}/projects/${projectId}/screens:generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-goog-user-project": PROJECT_ID,
    },
    body: JSON.stringify({
      prompt,
      device_type: deviceType,
      model_id: "GEMINI_3_PRO",
    }),
  });
  const data = await res.json();

  // Extract screen ID and HTML download URL from response
  const screen = data.outputComponents?.find((c: any) => c.design?.screens?.length > 0)
    ?.design?.screens?.[0];

  if (!screen) throw new Error(`No screen generated: ${JSON.stringify(data)}`);

  return {
    screenId: screen.id,
    htmlUrl: screen.htmlCode?.downloadUrl,
  };
}

// Fetch HTML content of a screen
async function fetchScreenHtml(htmlUrl: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(htmlUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch screen HTML: ${res.status}`);
  return res.text();
}

// Use Claude to normalize free-text industry into design context
async function normalizeIndustry(industry: string): Promise<{
  category: string;
  accentColor: string;
  cta: string;
  vibe: string;
  navLabel: string;
}> {
  const prompt = `Given this business industry: "${industry}"

Return a JSON object with these fields:
- category: one of "trades", "professional", "clinical", "food", "retail", "creative", "fitness"
- accentColor: a hex color that fits this industry (e.g. law firm = #8b4513, plumbing = #1e40af, dental = #0d7694, auto shop = #dc2626, bakery = #d97706)
- cta: the best call-to-action button text for this industry (e.g. "Get a Free Quote", "Book Appointment", "Free Consultation", "Order Now")
- vibe: 2-3 words describing the design aesthetic (e.g. "bold and rugged", "clean and clinical", "warm and inviting")
- navLabel: what to call the services section (e.g. "Services", "Practice Areas", "Our Menu", "Our Work")

Respond ONLY with valid JSON, no markdown.`;

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const text = res.content[0].type === "text" ? res.content[0].text : "{}";
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {
      category: "professional", accentColor: "#111", cta: "Contact Us", vibe: "professional", navLabel: "Services"
    };
  } catch {
    return { category: "professional", accentColor: "#111", cta: "Contact Us", vibe: "professional", navLabel: "Services" };
  }
}

// Main function: generate a complete site for a business
export async function generateStitchSite(params: {
  businessName: string;
  industry: string;
  city: string;
  state: string;
  services: string[];
  phone?: string;
  accentColor?: string;
}): Promise<string> {
  const { businessName, industry, city, state, services, phone, accentColor = "#0d7694" } = params;

  const serviceList = services.slice(0, 3).join(", ");

  // Use Claude to understand any free-text industry
  const industryContext = await normalizeIndustry(industry);
  const effectiveAccent = accentColor !== "#0d7694" ? accentColor : industryContext.accentColor;
  const ctaLabel = industryContext.cta;
  const vibe = industryContext.vibe;
  const navLabel = industryContext.navLabel;

  const prompt = `Design a homepage for "${businessName}", a ${industry} business in ${city}, ${state}.

Business details:
- Industry: ${industry}
- Services: ${serviceList || industry + " services"}
- Phone: ${phone || "(555) 000-0000"}
- Primary brand color: ${effectiveAccent}

Design direction: ${vibe} aesthetic — feel genuinely designed for this type of business, not generic.

Page sections required:
1. Sticky nav: business name logo, nav links (Home / ${navLabel} / About / Contact), phone number, "${ctaLabel}" button
2. Hero: strong headline mentioning ${city}, subheadline about the business, two CTAs ("${ctaLabel}" + secondary), hero image area
3. Stats bar: 3 trust indicators appropriate for ${industry} (years experience, customers served, rating etc.)
4. ${navLabel} section: 3 cards for ${serviceList || "their main services"}, each with icon, title, description, learn more link
5. Testimonial: one compelling customer quote with attribution
6. CTA banner: gradient background using ${effectiveAccent}, bold headline, "${ctaLabel}" button
7. Footer: business name, services list, contact info (address, phone, email), hours, copyright

Color: use ${effectiveAccent} as the primary accent throughout — buttons, headings, icons, borders.
Typography: modern, readable, pair a strong display font with clean body text.
Quality: high-end, polished — this should look like it cost $10,000 to build.`;

  // Create project and generate screen
  const projectId = await createProject(`${businessName} — Exsisto`);
  const { htmlUrl } = await generateScreen(projectId, prompt);
  const html = await fetchScreenHtml(htmlUrl);
  return html;
}

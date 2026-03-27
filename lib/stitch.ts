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
  const ctaLabel =
    industry.toLowerCase().includes("dental") ? "Book Appointment" :
    industry.toLowerCase().includes("law") ? "Free Consultation" :
    industry.toLowerCase().includes("plumb") || industry.toLowerCase().includes("hvac") ? "Get a Free Quote" :
    "Contact Us";

  const prompt = `${industry} business website homepage for "${businessName}" located in ${city}, ${state}.

Services offered: ${serviceList || industry + " services"}
Primary accent color: ${accentColor}
Phone: ${phone || "(555) 000-0000"}
CTA button text: "${ctaLabel}"

Design requirements:
- Professional, modern, trustworthy aesthetic appropriate for a ${industry} business
- Sticky navigation with business name, nav links, phone number, and CTA button
- Hero section with compelling headline mentioning ${city} and the business name
- Stats/social proof bar (years in business, clients served, satisfaction rate)
- Services section with 3 cards for: ${serviceList}
- Customer testimonial section
- Bold call-to-action section with gradient background using ${accentColor}
- Footer with contact info, hours, and quick links
- Use ${accentColor} as the primary accent/brand color throughout
- High-end, polished design — NOT generic or template-looking
- Generous whitespace, strong typography`;

  // Create project and generate screen
  const projectId = await createProject(`${businessName} — Exsisto`);
  const { htmlUrl } = await generateScreen(projectId, prompt);
  const html = await fetchScreenHtml(htmlUrl);
  return html;
}

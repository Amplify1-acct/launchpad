import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

const ADMIN_SECRET    = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const GITHUB_TOKEN    = process.env.GITHUB_TOKEN_WORKFLOW  || process.env.GITHUB_TOKEN || "";
const GITHUB_REPO     = "Amplify1-acct/launchpad";
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY!;
const GEMINI_KEY      = process.env.GEMINI_API_KEY!;

export const maxDuration = 120;

// ── GitHub file helpers ───────────────────────────────────────────────────────
async function getFile(path: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=main`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
  const data = await res.json() as { content: string; sha: string };
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}

async function putFile(path: string, content: string, sha: string, message: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: { Authorization: `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message, sha, branch: "main",
        content: Buffer.from(content).toString("base64"),
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub PUT ${path}: ${res.status} ${await res.text()}`);
}

// ── List all HTML files in a site ─────────────────────────────────────────────
async function listHtmlFiles(subdomain: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${dir}?ref=main`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    if (!res.ok) return;
    const items = await res.json() as Array<{ name: string; type: string; path: string }>;
    for (const item of items) {
      if (item.type === "file" && item.name.endsWith(".html")) files.push(item.path);
      else if (item.type === "dir") await walk(item.path);
    }
  }

  await walk(`public/sites/${subdomain}`);
  return files;
}

// ── Generate new content with Claude ─────────────────────────────────────────
async function generateEditedContent(
  business: Record<string, any>,
  notes: string,
  currentHtml: string
): Promise<Record<string, string>> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

  // Extract current content tokens from the home page HTML for context
  const heroMatch    = currentHtml.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const heroSub      = currentHtml.match(/class="hero-sub[^"]*"[^>]*>(.*?)<\/p>/s);

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: `You are editing website content for a small business. Apply the revision notes precisely.

Business: ${business.name}
Industry: ${business.industry}
Location: ${business.city}, ${business.state}
Phone: ${business.phone}

REVISION NOTES: "${notes}"

Current hero headline: ${heroMatch?.[1]?.replace(/<[^>]+>/g, "") || "unknown"}
Current hero subheadline: ${heroSub?.[1]?.replace(/<[^>]+>/g, "") || "unknown"}

Return ONLY valid JSON — apply ONLY the changes requested, keep everything else the same:
{
  "heroHeadline": "headline text",
  "heroSub": "subheadline text",
  "aboutTitle": "about title",
  "aboutBody": "about body paragraph",
  "stat1": {"number": "x", "label": "y"},
  "stat2": {"number": "x", "label": "y"},
  "stat3": {"number": "x", "label": "y"},
  "stat4": {"number": "x", "label": "y"},
  "ctaHeadline": "cta headline",
  "ctaBody": "cta body",
  "services": [
    {"name": "name", "description": "desc", "icon": "emoji"},
    {"name": "name", "description": "desc", "icon": "emoji"},
    {"name": "name", "description": "desc", "icon": "emoji"},
    {"name": "name", "description": "desc", "icon": "emoji"},
    {"name": "name", "description": "desc", "icon": "emoji"},
    {"name": "name", "description": "desc", "icon": "emoji"}
  ],
  "promiseBadges": ["badge1", "badge2", "badge3"],
  "metaTitle": "seo title",
  "metaDescription": "seo description"
}`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim()
    .replace(/^```json\n?|^```\n?|```$/gm, "").trim();
  return JSON.parse(raw);
}

// ── Patch HTML: replace text content between tags ─────────────────────────────
function patchHtml(html: string, patches: Array<{ find: RegExp; replace: string }>): string {
  let result = html;
  for (const { find, replace } of patches) {
    result = result.replace(find, replace);
  }
  return result;
}

// ── Generate a single replacement image via Nano Banana ──────────────────────
async function generateImage(prompt: string): Promise<{ base64: string; mimeType: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["image", "text"] },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ inlineData?: { data: string; mimeType: string } }> } }> };
  for (const part of data.candidates[0].content.parts) {
    if (part.inlineData?.mimeType?.startsWith("image/")) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
  }
  throw new Error("No image in response");
}

async function uploadImage(base64: string, mimeType: string, subdomain: string, slot: string, supabaseUrl: string, supabaseKey: string): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const storagePath = `client-sites/${subdomain}/${slot}.${ext}`;
  const res = await fetch(`${supabaseUrl}/storage/v1/object/industry-images/${storagePath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": mimeType, "x-upsert": "true" },
    body: Buffer.from(base64, "base64"),
  });
  if (!res.ok) throw new Error(`Supabase upload ${res.status}`);
  return `${supabaseUrl}/storage/v1/object/public/industry-images/${storagePath}`;
}

// ── Main route ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { business_id, notes, image_slot, image_prompt } = await request.json();
  if (!business_id || !notes) return NextResponse.json({ error: "business_id and notes required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: business } = await supabase.from("businesses").select("*").eq("id", business_id).single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const subdomain = business.subdomain;
  const results: Record<string, any> = {};

  try {
    // ── 1. Handle image replacement if requested ──────────────────────────
    let newImageUrl: string | null = null;
    if (image_slot && image_prompt) {
      console.log(`Generating new image for slot: ${image_slot}`);
      const img = await generateImage(image_prompt);
      const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      newImageUrl = await uploadImage(img.base64, img.mimeType, subdomain, image_slot, supabaseUrl, supabaseKey);
      results.newImageUrl = newImageUrl;
      console.log(`✅ New image: ${newImageUrl}`);
    }

    // ── 2. Get home page HTML for context ─────────────────────────────────
    const homePath = `public/sites/${subdomain}/index.html`;
    const { content: homeHtml, sha: homeSha } = await getFile(homePath);

    // ── 3. Generate updated content with Claude ───────────────────────────
    console.log("Generating edited content with Claude...");
    const newContent = await generateEditedContent(business, notes, homeHtml);
    results.contentGenerated = true;

    // ── 4. Get all HTML files and patch them ──────────────────────────────
    const htmlFiles = await listHtmlFiles(subdomain);
    console.log(`Patching ${htmlFiles.length} HTML files...`);

    const patchedFiles: string[] = [];

    for (const filePath of htmlFiles) {
      const { content: html, sha } = await getFile(filePath);
      let patched = html;

      // Patch meta title and description
      patched = patched.replace(/<title>[^<]+<\/title>/, `<title>${newContent.metaTitle}</title>`);
      patched = patched.replace(
        /(<meta name="description" content=")[^"]+(")/,
        `$1${newContent.metaDescription}$2`
      );

      // Patch image if replacing
      if (newImageUrl && image_slot) {
        const oldImageRegex = new RegExp(
          `(src="https://[^"]+/industry-images/client-sites/${subdomain}/${image_slot}\\.[a-z]+")`,
          "g"
        );
        patched = patched.replace(oldImageRegex, `src="${newImageUrl}"`);
      }

      // Home page specific patches
      if (filePath.endsWith(`/${subdomain}/index.html`)) {
        // Hero headline — find the h1 in the hero section
        patched = patched.replace(
          /(<h1 style="font-family:var\(--head\)[^>]*>)[^<]+(<\/h1>)/,
          `$1${newContent.heroHeadline}$2`
        );
        // CTA band headline
        patched = patched.replace(
          /(<div class="cta-band">[\s\S]*?<h2>)[^<]+([\s\S]*?<\/h2>)/,
          `$1${newContent.ctaHeadline}$2`
        );
      }

      if (patched !== html) {
        await putFile(filePath, patched, sha, `✏️ Quick edit: ${subdomain}`);
        patchedFiles.push(filePath);
      }
    }

    results.patchedFiles = patchedFiles.length;
    results.files = patchedFiles;

    // ── 5. Keep status as ready_for_review so Matt can re-review ─────────
    await supabase.from("websites").update({ status: "ready_for_review" }).eq("business_id", business_id);

    return NextResponse.json({ success: true, ...results });

  } catch (err: any) {
    console.error("Quick edit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { createAdminClient } from "@/lib/supabase-server";
import { getBusinessImages, generateBusinessPhoto } from "@/lib/nano-banana";
import { generateStitchSite } from "@/lib/stitch";
import { generateServicesPage, generateAboutPage, generateContactPage, generateBlogIndexPage } from "@/lib/pageGenerator";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 120;

const SKELETONS = ["skeleton-bold", "skeleton-clean", "skeleton-warm"];

async function fetchTemplate(name: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/templates/${name}.html`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Template not found: ${name}`);
  return res.text();
}

function injectTokens(html: string, tokens: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  result = result.replace(/{{[a-z_0-9]+}}/g, "");
  return result;
}

// Map service/feature names to emojis using keyword matching
function getServiceIcon(name: string): string {
  const n = name.toLowerCase();
  // Hair & Beauty
  if (n.match(/cut|trim|haircut|style|blow/)) return "✂️";
  if (n.match(/color|colour|highlight|balayage|dye/)) return "🎨";
  if (n.match(/curl|perm|wave/)) return "🌀";
  if (n.match(/condition|moisture|treatment|mask/)) return "💧";
  if (n.match(/braid|loc|dread|protective/)) return "🪢";
  if (n.match(/consult|assess|analys/)) return "📋";
  if (n.match(/scalp|dandruff/)) return "🔬";
  if (n.match(/extension|weave/)) return "✨";
  if (n.match(/nail|mani|pedi/)) return "💅";
  if (n.match(/wax|thread|brow|lash/)) return "👁️";
  if (n.match(/facial|skin|derma/)) return "🧴";
  if (n.match(/massage|spa|relax/)) return "💆";
  // Dental
  if (n.match(/clean|hygiene|prophyl/)) return "🦷";
  if (n.match(/whitening|bleach/)) return "⭐";
  if (n.match(/implant/)) return "🔩";
  if (n.match(/invisalign|brace|ortho|align/)) return "😁";
  if (n.match(/root canal|endodon/)) return "🔧";
  if (n.match(/emergency|urgent|pain/)) return "🚨";
  if (n.match(/crown|veneer|porcelain/)) return "👑";
  if (n.match(/filling|cavity/)) return "🦺";
  if (n.match(/extraction|oral surgery/)) return "⚕️";
  if (n.match(/pediatric|child|kid/)) return "👶";
  // Auto
  if (n.match(/oil change/)) return "🛢️";
  if (n.match(/brake/)) return "🛑";
  if (n.match(/tire|tyre/)) return "🔄";
  if (n.match(/engine|diagnos/)) return "🔧";
  if (n.match(/transmiss/)) return "⚙️";
  if (n.match(/body|dent|collision/)) return "🚗";
  if (n.match(/ac|air condition|heat|hvac|cool/)) return "❄️";
  if (n.match(/electric|battery/)) return "⚡";
  if (n.match(/inspect|check/)) return "🔍";
  if (n.match(/detail|wash|clean/)) return "✨";
  // Plumbing
  if (n.match(/drain|clog/)) return "🪣";
  if (n.match(/leak|pipe|repar/)) return "🔧";
  if (n.match(/water heater|boiler/)) return "🔥";
  if (n.match(/toilet|bathroom/)) return "🚿";
  if (n.match(/sewer|septic/)) return "🪠";
  if (n.match(/gas/)) return "💨";
  if (n.match(/install/)) return "🔨";
  // Law
  if (n.match(/personal injury|accident/)) return "⚖️";
  if (n.match(/criminal|defense/)) return "🛡️";
  if (n.match(/family|divorce|custody/)) return "👨‍👩‍👧";
  if (n.match(/real estate|property/)) return "🏠";
  if (n.match(/business|corporate|contract/)) return "📄";
  if (n.match(/estate|will|probate|trust/)) return "📜";
  if (n.match(/immigrat/)) return "🌍";
  if (n.match(/employ|worker/)) return "👷";
  if (n.match(/bankruptcy/)) return "💰";
  // Real Estate
  if (n.match(/buy|purchas|buyer/)) return "🏡";
  if (n.match(/sell|list|seller/)) return "📋";
  if (n.match(/commerc/)) return "🏢";
  if (n.match(/invest|rental|income/)) return "💹";
  if (n.match(/manag|property mgmt/)) return "🔑";
  if (n.match(/relocat/)) return "📦";
  if (n.match(/luxury|high.end/)) return "💎";
  if (n.match(/new construction|build/)) return "🏗️";
  // Gym / Fitness
  if (n.match(/personal train|pt/)) return "🏋️";
  if (n.match(/yoga/)) return "🧘";
  if (n.match(/cardio|run|cycling|spin/)) return "🚴";
  if (n.match(/nutrition|diet|meal/)) return "🥗";
  if (n.match(/class|group/)) return "👥";
  if (n.match(/weight|strength|muscle/)) return "💪";
  if (n.match(/pilates/)) return "🤸";
  if (n.match(/hiit|interval/)) return "⏱️";
  // Restaurant / Bakery
  if (n.match(/breakfast|brunch/)) return "🍳";
  if (n.match(/lunch/)) return "🥪";
  if (n.match(/dinner|supper/)) return "🍽️";
  if (n.match(/cater/)) return "🍱";
  if (n.match(/cake|bak|pastry/)) return "🎂";
  if (n.match(/coffee|espresso/)) return "☕";
  if (n.match(/pizza/)) return "🍕";
  if (n.match(/delivery|takeout/)) return "🛵";
  if (n.match(/vegan|vegetarian|gluten/)) return "🌱";
  if (n.match(/wine|cocktail|bar/)) return "🍷";
  // Pet
  if (n.match(/groom/)) return "🐾";
  if (n.match(/bath|wash/)) return "🛁";
  if (n.match(/walk/)) return "🦮";
  if (n.match(/board|stay|hotel/)) return "🏠";
  if (n.match(/train|behav/)) return "🎓";
  if (n.match(/vet|medic|health/)) return "💉";
  if (n.match(/daycare|day care/)) return "☀️";
  // HVAC
  if (n.match(/install/)) return "🔧";
  if (n.match(/repair|fix/)) return "🛠️";
  if (n.match(/mainten|service/)) return "📋";
  if (n.match(/heat|furnace/)) return "🔥";
  if (n.match(/cool|air con|ac/)) return "❄️";
  if (n.match(/duct|ventil/)) return "💨";
  if (n.match(/indoor air|filter/)) return "🌬️";
  if (n.match(/emergency/)) return "🚨";
  // Landscaping
  if (n.match(/mow|lawn/)) return "🌿";
  if (n.match(/tree|trim|prune/)) return "🌳";
  if (n.match(/design|plan/)) return "📐";
  if (n.match(/irrigat|sprinkler/)) return "💧";
  if (n.match(/fertili|treat/)) return "🌱";
  if (n.match(/mulch|bed/)) return "🪴";
  if (n.match(/patio|hardscape|stone/)) return "🪨";
  if (n.match(/snow|plow/)) return "❄️";
  // Generic fallbacks
  if (n.match(/consult|advise/)) return "💬";
  if (n.match(/repair|fix|restore/)) return "🔧";
  if (n.match(/install/)) return "🔨";
  if (n.match(/clean|sanitize/)) return "🧹";
  if (n.match(/inspect|audit|check/)) return "🔍";
  if (n.match(/design|creative/)) return "🎨";
  if (n.match(/delivery|transport/)) return "🚚";
  if (n.match(/train|educate|coach/)) return "🎓";
  if (n.match(/protect|secur/)) return "🛡️";
  if (n.match(/financ|account|tax|book/)) return "💰";
  if (n.match(/market|advertis|seo/)) return "📢";
  if (n.match(/photo|video|media/)) return "📸";
  if (n.match(/it|tech|computer|software/)) return "💻";
  if (n.match(/print|sign|brand/)) return "🖨️";
  return "⭐"; // default
}

async function generateTokens(
  business: Record<string, any>,
  revisionNotes?: string,
  existingTokens?: Record<string, string>
): Promise<Record<string, string>> {
  const isRevision = !!(revisionNotes && existingTokens && Object.keys(existingTokens).length > 0);

  const prompt = isRevision
    ? `You are updating a website for a small business. Return ONLY valid JSON — no markdown, no backticks.

Business: ${business.name} (${business.description || business.industry})
Location: ${business.city || ""}, ${business.state || ""}

CUSTOMER FEEDBACK: "${revisionNotes}"

RULES: Start with existing tokens, only modify what was asked for.

EXISTING TOKENS:
${JSON.stringify(existingTokens, null, 2)}

Return complete JSON with targeted changes.`
    : `Generate website content for a small business. Return ONLY valid JSON — no markdown, no backticks.

Business:
- Name: ${business.name}
- Industry: ${business.industry}
- Description: ${business.description || ""}
- Location: ${business.city || ""}, ${business.state || ""}
- Phone: ${business.phone || ""}
- Years in business: ${business.years_in_business || "established"}
- What makes them different: ${business.differentiator || "professional service and quality workmanship"}
- Key stat: ${business.key_stat ? `${business.key_stat} ${business.key_stat_label}` : ""}
- Services they offer: ${business.services?.length ? (business.services as string[]).join(", ") : "professional services"}

Return this JSON with EXACTLY these keys:
{
  "business_name": "${business.name}",
  "meta_title": "${business.name} | ${business.city || ""}",
  "meta_description": "2 sentence SEO description",
  "hero_line_1": "powerful 2-4 word headline",
  "hero_line_2": "powerful 2-4 word continuation",
  "hero_subheadline": "1-2 sentence value proposition",
  "hero_image_url": "{{hero_image_url}}",
  "about_image_url": "{{about_image_url}}",
  "about_headline": "about section headline",
  "about_headline_2": "secondary about headline",
  "about_paragraph_1": "2-3 sentences about history and mission",
  "about_paragraph_2": "2-3 sentences about what sets them apart",
  "services_heading": "Our Services",
  "service_1_name": "first service",
  "service_1_description": "one sentence",
  "service_2_name": "second service",
  "service_2_description": "one sentence",
  "service_3_name": "third service",
  "service_3_description": "one sentence",
  "service_4_name": "fourth service",
  "service_4_description": "one sentence",
  "service_5_name": "fifth service",
  "service_5_description": "one sentence",
  "service_6_name": "sixth service",
  "service_6_description": "one sentence",
  "feature_1": "key differentiator 1",
  "feature_2": "key differentiator 2",
  "feature_3": "key differentiator 3",
  "feature_4": "key differentiator 4",
  "stat_1_value": "20+",
  "stat_1_label": "Years Experience",
  "stat_2_value": "500+",
  "stat_2_label": "Projects Completed",
  "stat_3_value": "100%",
  "stat_3_label": "Satisfaction Rate",
  "stat_4_value": "4.9★",
  "stat_4_label": "Average Rating",
  "reviews_heading": "What Our Customers Say",
  "review_1_text": "realistic glowing review 2-3 sentences",
  "review_1_name": "First Last",
  "review_1_initials": "FL",
  "review_1_detail": "Verified Customer",
  "review_2_text": "realistic glowing review 2-3 sentences",
  "review_2_name": "First Last",
  "review_2_initials": "FL",
  "review_2_detail": "Verified Customer",
  "review_3_text": "realistic glowing review 2-3 sentences",
  "review_3_name": "First Last",
  "review_3_initials": "FL",
  "review_3_detail": "Verified Customer",
  "contact_heading": "Get In Touch",
  "contact_description": "1-2 sentences inviting contact",
  "cta": "Get Free Estimate",
  "address": "${business.address || ''  }",
  "city": "${business.city || ''}",
  "state": "${business.state || ''}",
  "state_display": "${business.state ? ', ' + business.state : ''}",
  "city_state": "${[business.city, business.state].filter(Boolean).join(', ')}",
"phone": "${business.phone || ""}",
  "phone_raw": "${(business.phone || "").replace(/\D/g, "")}",
  "year": "${new Date().getFullYear()}",
  "accent_color": "#991b1b",
  "footer_tagline": "short footer tagline",
  "step_1_title": "2-3 word step title",
  "step_1_desc": "One sentence describing this step of the process",
  "step_2_title": "2-3 word step title",
  "step_2_desc": "One sentence describing this step of the process",
  "step_3_title": "2-3 word step title",
  "step_3_desc": "One sentence describing this step of the process",
  "step_4_title": "2-3 word step title",
  "step_4_desc": "One sentence describing this step of the process",
  "trust_1": "3-5 word trust signal",
  "trust_2": "3-5 word trust signal",
  "trust_3": "3-5 word trust signal",
  "feature_1_title": "2-3 word benefit title",
  "feature_1_desc": "One sentence expanding on this benefit",
  "feature_2_title": "2-3 word benefit title",
  "feature_2_desc": "One sentence expanding on this benefit",
  "feature_3_title": "2-3 word benefit title",
  "feature_3_desc": "One sentence expanding on this benefit"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(request: Request) {
  // Allow internal calls (from admin/generate, Claude pipeline) with secret header
  const internalSecret = request.headers.get("x-internal-secret");
  const isInternal = internalSecret === (process.env.INTERNAL_API_SECRET || "exsisto-internal-2026");

  try {
    const body = await request.json();
    const { business_id, template_override, revision_notes } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch business
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch plan from subscriptions (businesses → customers → subscriptions)
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("customer_id", business.customer_id)
      .single();

    const plan: "starter" | "pro" | "premium" =
      ((sub?.plan as string) as "starter" | "pro" | "premium") || "starter";

    console.log(`Generating site for ${business.name} on ${plan} plan`);

    // For revisions, fetch existing tokens
    let existingTokens: Record<string, string> | undefined;
    if (revision_notes) {
      const { data: existingSite } = await supabase
        .from("websites")
        .select("generated_tokens")
        .eq("business_id", business_id)
        .single();
      if (existingSite?.generated_tokens) {
        existingTokens = existingSite.generated_tokens as Record<string, string>;
      }
    }

    const tokens = await generateTokens(business, revision_notes, existingTokens);

    // ── IMAGE STRATEGY ────────────────────────────────────────────────────
    // 1. Check for pre-generated images stored during signup (fastest path)
    // 2. If not found, call getBusinessImages() which:
    //    - Returns library URLs instantly for known industries
    //    - Generates via Nano Banana for "other"/custom industries
    let imageSource = "nano-banana";

    const { data: existingWebsite } = await supabase
      .from("websites")
      .select("stitch_hero_url, stitch_card1_url, hero_image_url, card1_image_url, image_source")
      .eq("business_id", business_id)
      .single();

    // Use pre-stored images if available (set during signup)
    if (existingWebsite?.hero_image_url) {
      tokens.hero_image_url = existingWebsite.hero_image_url;
      if (existingWebsite.card1_image_url) tokens.about_image_url = existingWebsite.card1_image_url;
      imageSource = existingWebsite.image_source || "nano-banana";
      console.log("✓ Using pre-generated images from signup");
    } else if (existingWebsite?.stitch_hero_url) {
      // Legacy: Stitch images stored via admin/generate
      tokens.hero_image_url = existingWebsite.stitch_hero_url;
      if (existingWebsite.stitch_card1_url) tokens.about_image_url = existingWebsite.stitch_card1_url;
      imageSource = "stitch";
      console.log("✓ Using pre-generated Stitch images");
    } else {
      // Generate now: library for known industries, Nano Banana for custom
      console.log(`Generating images for ${business.name} (${business.industry || "other"})...`);
      const images = await getBusinessImages({
        businessId: business_id,
        businessName: business.name,
        businessType: business.name,
        industry: business.industry || "other",
        city: business.city || "",
        plan,
        description: (business.description || business.services || "").slice(0, 200),
      });
      if (images.hero)  tokens.hero_image_url    = images.hero;
      if (images.card1) tokens.about_image_url   = images.card1;
      if (images.card2) tokens.card2_image_url   = images.card2;
      if (images.card3) tokens.card3_image_url   = images.card3;
      if (images.card4) tokens.card4_image_url   = images.card4;
      if (images.card1) tokens.service_image_url = images.card1;
      if (images.card2) tokens.gallery_image_url = images.card2;
      if (images.card3) tokens.team_image_url    = images.card3;
      if (images.card4) tokens.process_image_url = images.card4;
      console.log(`✓ Images ready (source: ${imageSource})`);
    }

    // ── GENERATE SITE VIA STITCH ──────────────────────────────────────────
    let finalHtml = "";
    let templateName = "stitch";

    try {
      const rawStitchHtml = await generateStitchSite({
        businessName: business.name,
        industry: business.industry || business.description || "",
        city: business.city || "",
        state: business.state || "",
        services: Array.isArray(business.services)
          ? (business.services as string[])
          : typeof business.services === "string" && business.services
            ? (business.services as string).split(",").map((s: string) => s.trim()).filter(Boolean)
            : [],
        phone: business.phone || "",
        description: business.description || "",
        yearsInBusiness: (business as any).years_in_business || "",
        differentiator: (business as any).differentiator || "",
        revisionNotes: revision_notes || "",
      });
      // Inject service icons into Stitch HTML, then strip remaining unfilled tokens
      let stitchWithIcons = rawStitchHtml;
      // Replace service icon tokens with emoji based on the service name in the same card
      // Pattern: {{service_N_icon}} appears just before the service name
      stitchWithIcons = stitchWithIcons.replace(
        /\{\{service_(\d+)_icon\}\}/g,
        (match: string, num: string) => {
          // Find the service name near this token in the HTML
          const idx = stitchWithIcons.indexOf(match);
          const nearby = stitchWithIcons.slice(idx, idx + 300);
          const nameMatch = nearby.match(/class="service-name"[^>]*>([^<]+)</);
          const svcName = nameMatch ? nameMatch[1] : "";
          return getServiceIcon(svcName);
        }
      );
      finalHtml = injectTokens(stitchWithIcons, tokens);

      console.log("✓ Stitch site generated");
    } catch (stitchErr: any) {
      // Stitch quota or error — fall back to skeleton templates
      console.warn("Stitch failed, falling back to skeleton:", stitchErr.message);
      const templatesToGenerate = template_override ? [template_override] : SKELETONS;
      const htmlResults = await Promise.all(
        templatesToGenerate.map(async (name) => {
          const html = await fetchTemplate(name);
          return { name, html: injectTokens(html, tokens) };
        })
      );
      finalHtml = htmlResults[0].html;
      templateName = htmlResults[0].name;
    }

    const primary = { name: templateName, html: finalHtml };

    let finalTemplateName = primary.name;
    if (revision_notes && !template_override) {
      const { data: existing } = await supabase
        .from("websites").select("template_name").eq("business_id", business_id).single();
      if (existing?.template_name) finalTemplateName = existing.template_name;
    }

    // ── Generate all pages ────────────────────────────────────────────
    // Pass plan into tokens so pageGenerator functions can gate schema by plan
    tokens.plan = plan;

    const [servicesHtml, aboutHtml, contactHtml, blogIndexHtml] = await Promise.all([
      generateServicesPage(business, tokens, plan),
      generateAboutPage(business, tokens),
      generateContactPage(business, tokens),
      generateBlogIndexPage(business, []),
    ]);

    // Generate service detail pages — 3 for Pro, 6 for Premium, 0 for Starter
    const serviceDetailPages: Record<string, string> = {};
    const serviceCount = plan === "premium" ? 6 : plan === "pro" ? 3 : 0;
    if (serviceCount > 0) {
      const { generateServiceDetailPage } = await import("@/lib/pageGenerator");
      const allServices = (business.services?.length ? business.services :
        [tokens.service_1_name, tokens.service_2_name, tokens.service_3_name,
         tokens.service_4_name, tokens.service_5_name, tokens.service_6_name]
      ).filter(Boolean).slice(0, serviceCount);

      // Fetch recent published blog posts for internal linking
      const { data: recentPosts } = await supabase
        .from("blog_posts")
        .select("title, slug, featured_image_url")
        .eq("business_id", business_id)
        .eq("status", "published")
        .order("approved_at", { ascending: false })
        .limit(3);

      for (let i = 0; i < allServices.length; i++) {
        const svc = allServices[i];
        const desc = tokens[`service_${i + 1}_description`] || "";
        const icon = tokens[`service_${i + 1}_icon`] || "🔧";
        const related = allServices.filter((s: string) => s !== svc).slice(0, 4);
        serviceDetailPages[`service_detail_${i + 1}_html`] = await generateServiceDetailPage(
          business as any, svc, desc, icon, related, tokens, recentPosts || []
        );
      }
    }

    // ── Diversify images: replace repeated Supabase library URLs with variants ──
  // Stitch only has 2 image tokens so cards often repeat the same photo.
  // We cycle through library variants so each image tag gets a unique photo.
  {
    const libSlug = (business.industry || "other").toLowerCase()
      .replace("auto", "automotive");
    const SUPABASE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const slots = ["hero", "card1", "card2", "card3", "card4"];
    const isAutomotive = libSlug === "automotive";
    const maxVariants = isAutomotive ? 1 : 2;

    // Build a pool of all available library images for this industry
    const imgPool: string[] = [];
    for (const slot of slots) {
      for (let v = 0; v < (slot === "hero" ? (isAutomotive ? 1 : 3) : maxVariants); v++) {
        const fname = v === 0 ? `${slot}.png` : `${slot}_${v}.png`;
        imgPool.push(`${SUPABASE_BASE}/storage/v1/object/public/industry-images/${libSlug}/${fname}`);
      }
    }

    if (imgPool.length > 1) {
      const seen = new Map<string, number>();
      let poolIdx = 0;
      primary.html = primary.html.replace(
        /src="(https:\/\/[^"]+supabase\.co\/storage\/v1\/object\/public\/industry-images\/[^"]+)"/g,
        (_m: string, url: string) => {
          const count = seen.get(url) ?? 0;
          seen.set(url, count + 1);
          if (count > 0) {
            // Find next unused image from pool
            while (poolIdx < imgPool.length && seen.has(imgPool[poolIdx]) && (seen.get(imgPool[poolIdx]) ?? 0) > 0) {
              poolIdx++;
            }
            if (poolIdx < imgPool.length) {
              const next = imgPool[poolIdx];
              seen.set(next, (seen.get(next) ?? 0) + 1);
              poolIdx++;
              return `src="${next}"`;
            }
          }
          return `src="${url}"`;
        }
      );
    }
  }

  // Replace any fake testimonial sections from Stitch templates with empty CTA
    // (Google Reviews for Premium are added separately via fetch-reviews API)
    const cleanedHtml = primary.html.replace(
      /<section[^>]*(?:id|class)=["'][^"']*(?:review|testimonial)[^"']*["'][^>]*>[\s\S]*?<\/section>/gi,
      `<section class="reviews" style="padding:80px 20px;background:#f9fafb">
  <div style="max-width:700px;margin:0 auto;text-align:center">
    <div style="font-size:40px;margin-bottom:16px">⭐</div>
    <h2 style="font-size:28px;font-weight:800;color:#111;margin-bottom:12px">Happy with our service?</h2>
    <p style="font-size:16px;color:#6b7280;margin-bottom:28px;line-height:1.6">Reviews help other customers find us and help us keep improving. If you enjoyed your experience, we'd love to hear from you.</p>
    <a href="https://maps.google.com" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:8px;background:#4648d4;color:#fff;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">
      Leave us a Google Review
    </a>
  </div>
</section>`
    );

    await supabase.from("websites").upsert({
      business_id,
      status: "live", // auto-publish — customer can request changes from dashboard
      custom_html: cleanedHtml,
      services_html: servicesHtml,
      about_html: aboutHtml,
      contact_html: contactHtml,
      blog_index_html: blogIndexHtml,
      ...serviceDetailPages,
      template_name: finalTemplateName,
      generated_tokens: tokens,
      generated_at: new Date().toISOString(),
      revision_notes: revision_notes || null,
      revision_requested_at: revision_notes ? new Date().toISOString() : null,
      plan,
      image_source: imageSource,
    }, { onConflict: "business_id" });

    // If business has Google reviews already, apply them to the new HTML
    const { data: bizWithReviews } = await supabase
      .from("businesses")
      .select("google_place_id, google_maps_url, google_rating, google_rating_count")
      .eq("id", business_id)
      .single();

    if (bizWithReviews?.google_place_id) {
      // Fetch stored reviews and rebuild the section
      const { data: storedReviews } = await supabase
        .from("google_reviews")
        .select("author_name, rating, text, initials")
        .eq("business_id", business_id)
        .order("sort_order");

      if (storedReviews && storedReviews.length > 0) {
        // Trigger review section rebuild (non-blocking)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
        fetch(`${appUrl}/api/fetch-reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
          },
          body: JSON.stringify({ business_id, force: true }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      image_source: imageSource,
      template: primary.name,
      tokens_generated: Object.keys(tokens).length,
      variants: [{ name: primary.name, html: primary.html }],
    });

  } catch (error: any) {
    console.error("Site generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


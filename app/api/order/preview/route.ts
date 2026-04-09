import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const client = new Anthropic();
export const maxDuration = 45;

// Per-template: what hardcoded strings to swap out
// Each entry: [searchString, replacementKey]
// replacementKey maps to the generated content object
const TEMPLATE_SWAPS: Record<string, Array<[string, string]>> = {
  auto: [
    ["MATTY'S AUTOMOTIVE | The Art of Mechanical Resurrection", "meta_title"],
    ["MATTY'S AUTOMOTIVE", "biz_name_upper"],
    ["Est. 2004 | Clark, New Jersey", "est_location"],
    ["The Art of", "hero_line1"],
    ["Mechanical Resurrection.", "hero_line2"],
    ["20+ Years. 500+ Masterpieces.", "hero_stat_line"],
    ["One surgical pursuit of perfection.", "hero_sub"],
    ["Industrial", "services_heading_1"],
    ["Services", "services_heading_2"],
    ["From structural integrity to the final glass-like finish, our atelier handles every facet of restoration.", "services_intro"],
    ["Full Body Restoration", "svc1_name"],
    ["Complete rotisserie restoration focusing on structural perfection and historical accuracy.", "svc1_desc"],
    ["Custom Paint & Body", "svc2_name"],
    ["Show-quality finishes using multiple stages of hand-sanded lacquer and premium coatings.", "svc2_desc"],
    ["Panel Fabrication", "svc3_name"],
    ["English wheel work and bespoke panel creation for rare silhouettes and custom modifications.", "svc3_desc"],
    ["Chrome & Detailing", "svc4_name"],
    ["Triple-plate chroming and surgical engine bay detailing that exceeds factory standards.", "svc4_desc"],
    ["Ready to Restore", "cta_heading1"],
    ["Your Legacy?", "cta_heading2"],
    ["Consultations by appointment only. Clark, New Jersey.", "cta_sub"],
    ["(732) 555-0192", "phone_formatted"],
    ["Initiate Consultation", "cta_btn"],
  ],
  dental: [
    ["Bright Smile Dental | Scotch Plains NJ", "meta_title"],
    ["Bright Smile Dental", "biz_name"],
    ["Excellence in Scotch Plains", "hero_eyebrow"],
    ["Redefining the Modern Dental Experience.", "hero_headline"],
    ["Step into a clinical environment designed for serenity. We combine high-end technology with exceptional care.", "hero_sub"],
    ["General Care", "svc1_name"],
    ["Comprehensive cleanings and preventative diagnostics for lasting oral health.", "svc1_desc"],
    ["Teeth Whitening", "svc2_name"],
    ["Professional-grade whitening treatments for a noticeably brighter smile.", "svc2_desc"],
    ["Invisalign", "svc3_name"],
    ["Modern clear aligners for a straighter smile without metal braces.", "svc3_desc"],
    ["Dental Implants", "svc4_name"],
    ["Permanent, natural-feeling restorations for missing or damaged teeth.", "svc4_desc"],
    ["Ready for a Brighter Smile?", "cta_heading"],
    ["Join our community of healthy smiles today. Our expert team is ready to welcome you.", "cta_sub"],
    ["(908) 555-0156", "phone_formatted"],
    ["(908) 555-0134", "phone_formatted"],
    ["9085550156", "phone_raw"],
    ["9085550134", "phone_raw"],
    ["Scotch Plains, NJ", "city_state"],
    ["Scotch Plains", "city"],
  ],
  gym: [
    ["IRON PEAK", "biz_name_upper"],
    ["Iron Peak Fitness", "biz_name_full"],
    ["Iron Peak", "biz_name"],
    ["SUMMIT, NEW JERSEY", "city_state_upper"],
    ["Summit, NJ", "city_state"],
    ["(908) 555-0178", "phone_formatted"],
    ["9085550178", "phone_raw"],
    ["FORGE", "hero_line1"],
    ["YOUR", "hero_line2"],
    ["PEAK", "hero_line3"],
    ["ELITE", "services_heading_1"],
    ["DISCIPLINES", "services_heading_2"],
    ["We don't do 'workouts'. We execute programmed performance sessions designed to build elite athletes.", "services_intro"],
    ["Personal Training", "svc1_name"],
    ["One-on-One Mastery", "svc1_sub"],
    ["Group Classes", "svc2_name"],
    ["Synchronized aggression. High-intensity metabolic conditioning.", "svc2_desc"],
    ["Nutrition Coaching", "svc3_name"],
    ["Science-backed performance fueling protocols.", "svc3_desc"],
    ["Open Gym", "svc4_name"],
    ["Unlimited Access", "svc4_sub"],
    ["READY TO START?", "cta_heading"],
  ],
  hvac: [
    ["Cool Breeze HVAC", "biz_name"],
    ["Cool Breeze", "biz_name_short"],
    ["(908) 555-0134", "phone_formatted"],
    ["9085550134", "phone_raw"],
    ["Union, NJ Authority", "hero_eyebrow"],
    ["Precision Climate Engineering.", "hero_headline"],
    ["Beyond standard maintenance. We provide clinical-grade HVAC solutions for high-performance homes.", "hero_sub"],
    ["AC Installation", "svc1_name"],
    ["Next-generation cooling systems engineered for silent, high-efficiency performance.", "svc1_desc"],
    ["Heating Repair", "svc2_name"],
    ["Rapid response restoration for furnace and boiler systems during critical NJ winters.", "svc2_desc"],
    ["Duct Cleaning", "svc3_name"],
    ["Clinical particulate extraction for aerospace-grade indoor air quality.", "svc3_desc"],
    ["Maintenance Plans", "svc4_name"],
    ["Predictive system analysis and optimization to prevent critical failures.", "svc4_desc"],
    ["Precision Diagnostic in Progress", "hero_status"],
  ],
  law: [
    ["Morgan & Associates | Newark, NJ Law Firm", "meta_title"],
    ["Morgan &amp; Associates", "biz_name"],
    ["Morgan & Associates", "biz_name"],
    ["(973) 555-0189", "phone_formatted"],
    ["9735550189", "phone_raw"],
    ["Newark, NJ", "city_state"],
    ["Newark", "city"],
    ["Unwavering Defense.", "hero_line1"],
    ["Exceptional Results.", "hero_line2"],
    ["Serving Newark and the surrounding communities with sophisticated legal counsel for over two decades.", "hero_sub"],
    ["Strategic Expertise", "services_heading"],
    ["Personal Injury", "svc1_name"],
    ["Securing maximum compensation for catastrophic accidents and professional negligence.", "svc1_desc"],
    ["Case Evaluation", "svc1_cta"],
    ["Criminal Defense", "svc2_name"],
    ["Sophisticated representation for complex crimes and state offenses across New Jersey.", "svc2_desc"],
    ["Secure Counsel", "svc2_cta"],
    ["Family Law", "svc3_name"],
    ["Navigating high-asset divorces and custody disputes with discretion and authority.", "svc3_desc"],
    ["Private Consult", "svc3_cta"],
    ["Estate Planning", "svc4_name"],
    ["Preserving generational wealth through meticulous legal structures and trust management.", "svc4_desc"],
    ["Plan Legacy", "svc4_cta"],
    ["$500M+", "stat1_value"],
    ["Multi-Million Dollar Recoveries", "stat1_label"],
    ["Our firm has consistently secured landmark settlements and verdicts for our clients.", "stat1_desc"],
  ],
  pet: [
    ["Happy Paws Pet Care | Cranford, NJ", "meta_title"],
    ["Happy Paws Pet Care", "biz_name"],
    ["Happy Paws", "biz_name_short"],
    ["(908) 555-0123", "phone_formatted"],
    ["9085550123", "phone_raw"],
    ["Cranford, NJ", "city_state"],
    ["Cranford", "city"],
    ["Based in Cranford, NJ", "hero_eyebrow"],
    ["Where every tail", "hero_line1"],
    ["tells a story", "hero_line2"],
    ["of joy.", "hero_line3"],
    ["Premium pet care that feels like home. From spa-day grooming to adventurous daycare — your pet deserves the best.", "hero_sub"],
    ["Grooming", "svc1_name"],
    ["Bespoke styling, soothing baths, and meticulous pawdicures for the discerning pet.", "svc1_desc"],
    ["Daycare", "svc2_name"],
    ["Socialization, supervised play, and mental stimulation in our climate-controlled facility.", "svc2_desc"],
    ["Boarding", "svc3_name"],
    ["Luxury suites and overnight care that mimics the comfort of home.", "svc3_desc"],
    ["Expert Training", "svc4_name"],
    ["From puppy basics to advanced behavioral coaching with positive reinforcement.", "svc4_desc"],
    ["Join the Happy Paws family. First-time visitors get 20% off their first grooming session.", "cta_sub"],
  ],
  plumbing: [
    ["FlowRight | Premium Plumbing Services Westfield NJ", "meta_title"],
    ["FlowRight Plumbing", "biz_name_full"],
    ["FlowRight", "biz_name"],
    ["(908) 555-0112", "phone_formatted"],
    ["9085550112", "phone_raw"],
    ["Westfield, NJ", "city_state"],
    ["Westfield", "city"],
    ["Available 24/7 in Westfield", "hero_eyebrow"],
    ["Precision Plumbing", "hero_line1"],
    ["Perfectly", "hero_line2"],
    ["Restored.", "hero_line3"],
    ["Elevating residential mechanical integrity through boutique engineering and archival parts expertise.", "hero_sub"],
    ["Mastered Solutions", "services_heading"],
    ["Emergency Repairs", "svc1_name"],
    ["Immediate response for critical failures. Burst pipes, major floods, and sewer backups resolved fast.", "svc1_desc"],
    ["Leak Detection", "svc2_name"],
    ["Non-invasive ultrasonic technology to pinpoint hidden issues before they cause damage.", "svc2_desc"],
    ["Water Heaters", "svc3_name"],
    ["Installation and maintenance of tankless and traditional systems from premium manufacturers.", "svc3_desc"],
    ["Drain Cleaning", "svc4_name"],
    ["High-pressure hydro-jetting that clears obstructions without damaging aging infrastructure.", "svc4_desc"],
    ["Client Perspectives", "reviews_heading"],
    ["Jonathan A. · Westfield", "review1_author"],
  ],
  realestate: [
    ["Summit Realty Group | Premier Luxury Real Estate", "meta_title"],
    ["Summit Realty Group", "biz_name"],
    ["Summit Realty", "biz_name_short"],
    ["(908) 555-0145", "phone_formatted"],
    ["9085550145", "phone_raw"],
    ["Exclusively New Jersey", "hero_eyebrow"],
    ["Your Legacy,", "hero_line1"],
    ["Found.", "hero_line2"],
    ["Premier Real Estate for the Discerning Collector. Discover a portfolio of architecturally significant properties.", "hero_sub"],
    ["The Summit Standard", "services_heading"],
    ["Beyond transactions, we curate experiences. Our bespoke approach ensures your real estate journey is extraordinary.", "services_intro"],
    ["Buyer Representation", "svc1_name"],
    ["Exclusive access to off-market inventory and surgical negotiation strategies.", "svc1_desc"],
    ["Seller Services", "svc2_name"],
    ["High-production cinematic marketing and global placement in luxury publications.", "svc2_desc"],
    ["Luxury Homes", "svc3_name"],
    ["Specializing in architectural significance across Summit and Short Hills.", "svc3_desc"],
    ["Investment Properties", "svc4_name"],
    ["Data-driven analysis and portfolio optimization for high-net-worth collectors.", "svc4_desc"],
  ],
  restaurant: [
    ["La Bella Cucina | Authentic Italian Excellence in Hoboken", "meta_title"],
    ["LA BELLA CUCINA", "biz_name_upper"],
    ["La Bella Cucina", "biz_name"],
    ["Hoboken, NJ", "city_state"],
    ["Hoboken", "city"],
    ["(201) 555-0134", "phone_formatted"],
    ["2015550134", "phone_raw"],
    ["Established 1987 — Hoboken, NJ", "est_location"],
    ["The Art of Italian", "hero_line1"],
    ["Ritual", "hero_line2"],
    ["A Symphony of", "about_heading1"],
    ["Italian Heritage", "about_heading2"],
    ["For over three decades, La Bella Cucina has stood as a beacon of culinary tradition.", "about_desc"],
    ["The Seasonal Collection", "menu_eyebrow"],
    ["Signature Offerings", "menu_heading"],
    ["Polpo Croccante", "dish1_name"],
    ["Wild-caught Mediterranean octopus, charred over cherry wood, served with Nduja-infused polenta.", "dish1_desc"],
    ["Agnello in Crosta", "dish2_name"],
    ["Herb-crusted rack of lamb, pistachio brittle, mint reduction, roasted root vegetables.", "dish2_desc"],
    ["Bistecca Fiorentina", "dish3_name"],
    ["Prime 32oz dry-aged porterhouse, seasoned with sea salt and rosemary, finished with truffle jus.", "dish3_desc"],
    ["Limited seating available nightly. We recommend booking two weeks in advance for the best experience.", "cta_sub"],
  ],
  salon: [
    ["Velvet Studio | Westfield NJ Hair Salon", "meta_title"],
    ["Velvet Studio", "biz_name"],
    ["(908) 555-0167", "phone_formatted"],
    ["9085550167", "phone_raw"],
    ["Westfield, New Jersey", "city_state"],
    ["Westfield, NJ", "city_state"],
    ["Westfield", "city"],
    ["Artistry", "hero_line1"],
    ["In Motion", "hero_line2"],
    ["A boutique collective dedicated to editorial excellence and the craft of modern hair artistry.", "hero_sub"],
    ["The Service Menu", "services_heading"],
    ["Balayage & Color", "svc1_name"],
    ["Bespoke hand-painted highlights that mimic the sun's natural touch.", "svc1_desc"],
    ["Bridal & Editorial", "svc2_name"],
    ["Exclusive styling for your most significant moments.", "svc2_desc"],
    ["Precision Cuts", "svc3_name"],
    ["Architectural shaping designed to enhance your facial structure and movement.", "svc3_desc"],
    ["Keratin & Therapy", "svc4_name"],
    ["Advanced smoothing treatments and restorative rituals for hair health and shine.", "svc4_desc"],
    ["128 East Broad Street, Westfield, NJ 07090", "address"],
  ],
};

function buildContent(
  businessName: string,
  city: string,
  state: string,
  phone: string,
  description: string,
  services: string,
  generated: Record<string, string>
): Record<string, string> {
  const cityState = [city, state].filter(Boolean).join(", ");
  const phoneRaw = phone.replace(/\D/g, "");
  const year = new Date().getFullYear();

  // Parse services into array
  const svcList = services
    ? services.split(/[,;|\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return {
    // Identity
    biz_name: businessName,
    biz_name_upper: businessName.toUpperCase(),
    biz_name_short: businessName.split(" ").slice(0, 2).join(" "),
    biz_name_full: businessName,

    // Location
    city: city || "Your City",
    state: state || "",
    city_state: cityState || "Your City",
    city_state_upper: cityState.toUpperCase() || "YOUR CITY",

    // Contact
    phone_formatted: phone || "(555) 555-5555",
    phone_raw: phoneRaw || "5555555555",

    // Meta
    meta_title: `${businessName} | ${cityState}`,
    est_location: `${cityState}`,
    address: `${city}, ${state}`,

    // Hero
    hero_eyebrow: `Serving ${cityState}`,
    hero_line1: generated.hero_line1 || businessName,
    hero_line2: generated.hero_line2 || "Expert Service",
    hero_line3: generated.hero_line3 || "Done Right.",
    hero_headline: generated.hero_headline || `Expert ${description || "Services"} in ${city}`,
    hero_stat_line: generated.hero_stat_line || `Trusted by ${city} since ${year - 10}`,
    hero_sub: generated.hero_sub || `Professional service in ${cityState}. Contact us today.`,
    hero_status: generated.hero_status || "Active Service",

    // Services headings
    services_heading: generated.services_heading || "Our Services",
    services_heading_1: generated.services_heading_1 || "Our",
    services_heading_2: generated.services_heading_2 || "Services",
    services_intro: generated.services_intro || `Professional ${description || "services"} delivered with expertise and care.`,

    // Services
    svc1_name: svcList[0] || generated.svc1_name || "Service One",
    svc1_sub: svcList[0] || generated.svc1_sub || "Expert Level",
    svc1_desc: generated.svc1_desc || `Professional ${svcList[0] || "service"} delivered with care.`,
    svc1_cta: "Learn More",
    svc2_name: svcList[1] || generated.svc2_name || "Service Two",
    svc2_sub: svcList[1] || generated.svc2_sub || "Premium Quality",
    svc2_desc: generated.svc2_desc || `Expert ${svcList[1] || "service"} for every need.`,
    svc2_cta: "Learn More",
    svc3_name: svcList[2] || generated.svc3_name || "Service Three",
    svc3_sub: svcList[2] || generated.svc3_sub || "Reliable Results",
    svc3_desc: generated.svc3_desc || `Trusted ${svcList[2] || "service"} you can count on.`,
    svc3_cta: "Learn More",
    svc4_name: svcList[3] || generated.svc4_name || "Service Four",
    svc4_sub: svcList[3] || generated.svc4_sub || "Fast & Efficient",
    svc4_desc: generated.svc4_desc || `Quality ${svcList[3] || "service"} at competitive prices.`,
    svc4_cta: "Learn More",

    // Menu items (restaurant)
    dish1_name: svcList[0] || generated.dish1_name || "Signature Dish",
    dish1_desc: generated.dish1_desc || "Our signature offering, prepared with the finest ingredients.",
    dish2_name: svcList[1] || generated.dish2_name || "House Specialty",
    dish2_desc: generated.dish2_desc || "A beloved classic crafted with care.",
    dish3_name: svcList[2] || generated.dish3_name || "Chef's Choice",
    dish3_desc: generated.dish3_desc || "The chef's personal recommendation.",

    // Stats
    stat1_value: generated.stat1_value || "500+",
    stat1_label: generated.stat1_label || "Happy Customers",
    stat1_desc: generated.stat1_desc || `${businessName} has served hundreds of satisfied customers in ${cityState}.`,

    // CTA
    cta_heading: generated.cta_heading || `Ready to Get Started?`,
    cta_heading1: generated.cta_heading1 || "Ready to Get",
    cta_heading2: generated.cta_heading2 || "Started?",
    cta_sub: generated.cta_sub || `Contact ${businessName} today. Serving ${cityState}.`,
    cta_btn: "Contact Us",

    // About
    about_heading1: generated.about_heading1 || "About",
    about_heading2: generated.about_heading2 || businessName,
    about_desc: generated.about_desc || `${businessName} has been proudly serving ${cityState} with professional, reliable service.`,

    // Reviews
    reviews_heading: "What Our Customers Say",
    review1_author: `Happy Customer · ${city}`,

    // Footer / copyright
    year: String(year),
  };
}

export async function POST(request: Request) {
  const { businessName, industry, city, state, phone, description, services, template } = await request.json();

  if (!businessName) return NextResponse.json({ error: "businessName required" }, { status: 400 });

  const templateKey = template || "plumbing";

  // Load the Stitch template HTML
  let html: string;
  try {
    html = readFileSync(join(process.cwd(), "public", "stitch-templates", `${templateKey}.html`), "utf-8");
  } catch {
    return NextResponse.json({ error: `Template ${templateKey} not found` }, { status: 404 });
  }

  // Step 1: Generate content with Claude Haiku
  let generated: Record<string, string> = {};
  try {
    const svcList = services ? services.split(/[,;|\n]/).map((s: string) => s.trim()).filter(Boolean) : [];
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `You are a professional copywriter. First, silently fix any spelling errors and apply proper capitalization to the business name, services, description, and location provided. Then generate polished website copy. Return ONLY valid JSON, no markdown.

Business: ${businessName}
What they do: ${description || services || industry || "professional services"}
Services: ${svcList.join(", ") || ""}
Location: ${[city, state].filter(Boolean).join(", ")}

IMPORTANT: Apply these rules to ALL output:
- Proper title case for business names, service names, and headings
- Fix any obvious spelling mistakes from the input
- Professional, polished language throughout
- Never use all-caps except where the template style demands it

Return JSON with these keys (all strings, keep them SHORT — 2-6 words for names, 1 sentence for descriptions):
{
  "hero_line1": "First line of big hero headline",
  "hero_line2": "Second line of hero headline",
  "hero_line3": "Third line (1-2 words, punchy)",
  "hero_headline": "Full single hero headline",
  "hero_sub": "One compelling sentence about the business",
  "hero_stat_line": "Short credibility line e.g. '15+ Years Serving ${city || "Your City"}'",
  "hero_status": "2-4 word active status e.g. 'Serving ${city || "Your City"} Now'",
  "hero_eyebrow": "Short location/authority line",
  "services_heading": "2-3 word services section heading",
  "services_heading_1": "First word of services heading",
  "services_heading_2": "Second word of services heading",
  "services_intro": "One sentence about their range of services",
  "svc1_name": "${svcList[0] || "Primary service name"}",
  "svc1_sub": "2-3 word subtitle",
  "svc1_desc": "One sentence description",
  "svc2_name": "${svcList[1] || "Second service name"}",
  "svc2_sub": "2-3 word subtitle",
  "svc2_desc": "One sentence description",
  "svc3_name": "${svcList[2] || "Third service name"}",
  "svc3_sub": "2-3 word subtitle",
  "svc3_desc": "One sentence description",
  "svc4_name": "${svcList[3] || "Fourth service name"}",
  "svc4_sub": "2-3 word subtitle",
  "svc4_desc": "One sentence description",
  "dish1_name": "If restaurant: first item name, else first service",
  "dish1_desc": "If restaurant: menu description, else service description",
  "dish2_name": "Second item/service",
  "dish2_desc": "Description",
  "dish3_name": "Third item/service",
  "dish3_desc": "Description",
  "cta_heading": "Short CTA heading question",
  "cta_heading1": "First half of CTA heading",
  "cta_heading2": "Second half of CTA heading",
  "cta_sub": "One sentence CTA supporting text mentioning ${city || "the area"}",
  "about_heading1": "First part of about heading",
  "about_heading2": "Second part (often business name or focus)",
  "about_desc": "One sentence about the business history/mission",
  "stat1_value": "Impressive stat like '500+' or '$2M+'",
  "stat1_label": "What the stat represents",
  "stat1_desc": "One sentence about this achievement"
}`,
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    generated = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("Content generation failed:", e);
  }

  // Step 2: Clean inputs — fix capitalization and basic formatting
  function toTitleCase(str: string): string {
    if (!str) return str;
    // Don't title-case if already has mixed case (user intentional)
    const lower = str.toLowerCase();
    return lower.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Apply title case to business name if it's all lower or all upper
  const cleanBizName = businessName.trim() === businessName.trim().toLowerCase() ||
                       businessName.trim() === businessName.trim().toUpperCase()
    ? toTitleCase(businessName.trim())
    : businessName.trim();

  const cleanCity = toTitleCase((city || "").trim());
  const cleanState = (state || "").trim().toUpperCase().slice(0, 2);

  // Clean services list — title case each one
  const cleanServices = (services || "")
    .split(/[,;|\n]/)
    .map((s: string) => toTitleCase(s.trim()))
    .filter(Boolean)
    .join(", ");

  // Build full content map
  const content = buildContent(
    cleanBizName, cleanCity, cleanState, phone || "",
    description || "", cleanServices, generated
  );

  // Step 3: Apply all swaps for this template (using cleaned inputs)
  const swaps = TEMPLATE_SWAPS[templateKey] || [];
  for (const [search, key] of swaps) {
    const replacement = content[key] || search;
    html = html.replaceAll(search, replacement);
  }

  // Step 4: Fix phone href attributes
  const phoneRaw = (phone || "").replace(/\D/g, "");
  if (phoneRaw) {
    html = html.replace(/href="tel:\d+"/g, `href="tel:${phoneRaw}"`);
  }

  // Step 5: Update page title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${businessName} | ${content.city_state}</title>`);

  // Step 6: Add disclaimer bar
  const disclaimer = `<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#1b1b25;display:flex;align-items:center;justify-content:space-between;padding:8px 16px;font-family:-apple-system,sans-serif;font-size:12px;gap:12px;flex-wrap:wrap;pointer-events:none;"><div style="display:flex;align-items:center;gap:10px;"><span style="color:#6366f1;font-weight:700;letter-spacing:0.5px;font-size:11px;">PREVIEW</span><span style="color:#fff;font-weight:600;">${businessName}</span><span style="background:#2d2d3d;color:#9090a8;font-size:11px;padding:3px 10px;border-radius:100px;">Images are samples · Copy customized for your business</span></div></div><div style="height:42px;"></div>`;

  html = html.replace(/(<body[^>]*>)/, `$1${disclaimer}`);

  return NextResponse.json({ html, templateKey });
}

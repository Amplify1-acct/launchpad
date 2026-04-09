import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const client = new Anthropic();
export const maxDuration = 45;

const TEMPLATE_SWAPS: Record<string, Array<[string, string]>> = {
  auto: [
    ["MATTY'S AUTOMOTIVE | The Art of Mechanical Resurrection", "meta_title"],
    ["MATTY'S AUTOMOTIVE", "biz_name_upper"],
    ["Matty's Automotive", "biz_name"],
    ["Est. 2004 | Clark, New Jersey", "est_location"],
    ["Clark, New Jersey", "city_state"],
    ["(732) 555-0192", "phone_formatted"],
    ["7325550192", "phone_raw"],
    ["The Art of", "hero_line1"],
    ["Mechanical Resurrection.", "hero_line2"],
    ["20+ Years. 500+ Masterpieces.", "hero_stat_line"],
    ["One surgical pursuit of perfection.", "hero_sub"],
    ["Industrial", "services_heading_1"],
    ["Services", "services_heading_2"],
    ["From structural integrity to the final glass-like finish, our atelier handles every millimeter in-house.", "services_intro"],
    ["Full Body Restoration", "svc1_name"],
    ["Complete rotisserie restoration focusing on structural perfection and historical accuracy.", "svc1_desc"],
    ["Custom Paint & Body", "svc2_name"],
    ["Show-quality finishes using multiple stages of hand-sanded lacquer and premium clear coats.", "svc2_desc"],
    ["Panel Fabrication", "svc3_name"],
    ["English wheel work and bespoke panel creation for rare silhouettes and custom modifications.", "svc3_desc"],
    ["Chrome & Detailing", "svc4_name"],
    ["Triple-plate chroming and surgical engine bay detailing that exceeds factory standards.", "svc4_desc"],
    ["Ready to Restore", "cta_heading1"],
    ["Your Legacy?", "cta_heading2"],
    ["Consultations by appointment only. Clark, New Jersey.", "cta_sub"],
    ["Initiate Consultation", "cta_btn"],
    ["© 2024 Matty's Automotive · Clark, NJ · (732) 555-0192 · Powered by Exsisto Premium", "footer_copy"],
  ],
  dental: [
    ["Bright Smile Dental | Scotch Plains NJ", "meta_title"],
    ["Bright Smile Dental", "biz_name"],
    ["Excellence in Scotch Plains", "hero_eyebrow"],
    ["Redefining the Modern Dental Experience.", "hero_headline"],
    ["Step into a clinical environment designed for serenity. We combine high-end technology with a warm, personalized approach to care.", "hero_sub"],
    ["Our Expertise", "services_eyebrow"],
    ["Curated Clinical Solutions", "services_heading"],
    ["Precision-led treatments tailored to your unique anatomy and lifestyle goals.", "services_intro"],
    ["General Care", "svc1_name"],
    ["Comprehensive cleanings and preventative diagnostics for lasting oral health.", "svc1_desc"],
    ["Preventative", "svc1_tag"],
    ["Teeth Whitening", "svc2_name"],
    ["Professional-grade whitening treatments for a noticeably brighter smile.", "svc2_desc"],
    ["Cosmetic", "svc2_tag"],
    ["Invisalign", "svc3_name"],
    ["Modern clear aligners for a straighter smile without metal braces.", "svc3_desc"],
    ["Orthodontics", "svc3_tag"],
    ["Dental Implants", "svc4_name"],
    ["Permanent, natural-feeling restorations for missing or damaged teeth.", "svc4_desc"],
    ["Restoration", "svc4_tag"],
    ["Ready for a Brighter Smile?", "cta_heading"],
    ["Join our community of healthy smiles today. Our expert team is ready to welcome you.", "cta_sub"],
    ["Schedule Your Appointment", "cta_btn"],
    ["(908) 555-0156", "phone_formatted"],
    ["(908) 555-0134", "phone_formatted"],
    ["9085550156", "phone_raw"],
    ["9085550134", "phone_raw"],
    ["Scotch Plains, NJ · (908) 555-0156 · Mon-Fri 8AM-6PM · Powered by Exsisto Premium", "footer_copy"],
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
    ["START YOUR EVOLUTION", "hero_cta"],
    ["ELITE", "services_heading_1"],
    ["DISCIPLINES", "services_heading_2"],
    ["We don't do 'workouts'. We execute programmed performance sessions designed to break through human potential.", "services_intro"],
    ["Personal Training", "svc1_name"],
    ["One-on-One Mastery", "svc1_detail"],
    ["groups", "svc2_icon"],
    ["Group Classes", "svc2_name"],
    ["Synchronized aggression. High-intensity metabolic conditioning.", "svc2_desc"],
    ["View Schedule", "svc2_cta"],
    ["restaurant", "svc3_icon"],
    ["Nutrition Coaching", "svc3_name"],
    ["Science-backed performance fueling protocols.", "svc3_desc"],
    ["Get the Blueprint", "svc3_cta"],
    ["Open Gym", "svc4_name"],
    ["Unlimited Access", "svc4_detail"],
    ["READY TO START?", "cta_heading"],
    ["JOIN IRON PEAK TODAY", "cta_btn_upper"],
    ["SUMMIT, NEW JERSEY · (908) 555-0178", "city_phone_upper"],
    ["IRON PEAK FITNESS", "biz_name_upper_full"],
    ["© 2024 Iron Peak Fitness · Summit, NJ · (908) 555-0178 · Powered by Exsisto Premium", "footer_copy"],
  ],
  hvac: [
    ["Cool Breeze HVAC", "biz_name"],
    ["Cool Breeze", "biz_name_short"],
    ["(908) 555-0134", "phone_formatted"],
    ["9085550134", "phone_raw"],
    ["Union, NJ Authority", "hero_eyebrow"],
    ["Union, NJ", "city_state"],
    ["Union", "city"],
    ["Precision Climate Engineering.", "hero_headline"],
    ["Beyond standard maintenance. We provide clinical-grade HVAC solutions for high-performance residential and commercial spaces.", "hero_sub"],
    ["Status: Active Service", "hero_status_label"],
    ["Precision Diagnostic in Progress", "hero_status"],
    ["Mastered Environments", "services_heading"],
    ["Our service spectrum is designed for total environmental control.", "services_intro"],
    ["AC Installation", "svc1_name"],
    ["Next-generation cooling systems engineered for silent, high-efficiency performance.", "svc1_desc"],
    ["Heating Repair", "svc2_name"],
    ["Rapid response restoration for furnace and boiler systems during critical NJ winters.", "svc2_desc"],
    ["Duct Cleaning", "svc3_name"],
    ["Clinical particulate extraction for aerospace-grade indoor air quality.", "svc3_desc"],
    ["Maintenance Plans", "svc4_name"],
    ["Predictive system analysis and optimization to prevent critical failures.", "svc4_desc"],
    ["Visible Precision. Measurable Results.", "results_heading"],
    ["System neglect reduces efficiency by up to 40% while compromising air quality and system lifespan.", "results_sub"],
    ["Aerodynamic Flow Restoration", "feature1_name"],
    ["Removing years of obstruction for optimal static pressure.", "feature1_desc"],
    ["Energy Consumption Mitigation", "feature2_name"],
    ["Precision tuning to minimize draw and maximize output.", "feature2_desc"],
    ["Secure Your Environmental Comfort", "cta_heading"],
    ["Available 24/7 for critical system restoration in Union, NJ and surrounding areas.", "cta_sub"],
    ["Direct Priority Line", "cta_phone_label"],
    ["Schedule Your Service", "cta_btn"],
    ["Union, NJ · (908) 555-0134 · Licensed & Bonded · 24/7 Emergency · Powered by Exsisto Premium", "footer_copy"],
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
    ["Serving Newark and the surrounding communities with sophisticated legal counsel since 2004. We protect what matters most.", "hero_sub"],
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
    ["Proven Outcomes", "stat_eyebrow"],
    ["Multi-Million Dollar Recoveries", "stat1_label"],
    ["Our firm has consistently secured landmark settlements and verdicts for our clients across New Jersey.", "stat1_desc"],
    ["\"Morgan & Associates provided a level of strategic precision I didn't think was possible. Their presence in the courtroom is commanding.\"", "review1_text"],
    ["Alexander V. Sterling", "review1_name"],
    ["Chief Executive Officer", "review1_title"],
    ["Secure Your Future Today", "cta_heading"],
    ["Consultations are strictly confidential and provided at no initial cost.", "cta_sub"],
    ["Request Free Evaluation", "cta_btn"],
    ["© 2024 Morgan & Associates · Newark, NJ · Powered by Exsisto Premium", "footer_copy"],
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
    ["Premium pet care that feels like home. From spa-day grooming to adventurous daycare, we treat your pets like family.", "hero_sub"],
    ["Our Services", "services_eyebrow"],
    ["Unmatched Care", "services_heading"],
    ["Four specialized ways we make your pet's life extraordinary.", "services_intro"],
    ["Grooming", "svc1_name"],
    ["Bespoke styling, soothing baths, and meticulous pawdicures for the discerning pet.", "svc1_desc"],
    ["Daycare", "svc2_name"],
    ["Socialization, supervised play, and mental stimulation in our climate-controlled parks.", "svc2_desc"],
    ["Boarding", "svc3_name"],
    ["Luxury suites and overnight care that mimics the comfort of home.", "svc3_desc"],
    ["Expert Training", "svc4_name"],
    ["From puppy basics to advanced behavioral coaching with positive reinforcement.", "svc4_desc"],
    ["Positive Only", "svc4_tag1"],
    ["All Breeds", "svc4_tag2"],
    ["Begin Your Journey", "cta_heading"],
    ["Join the Happy Paws family. First-time visitors get 20% off their first grooming session.", "cta_sub"],
    ["Book Your First Visit", "cta_btn"],
    ["Cranford, NJ · (908) 555-0123 · Grooming · Boarding · Daycare · Training · Powered by Exsisto Premium", "footer_copy"],
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
    ["Elevating residential mechanical integrity through boutique engineering and architectural precision.", "hero_sub"],
    ["Mastered Solutions", "services_heading"],
    ["Emergency Repairs", "svc1_name"],
    ["Immediate response for critical failures. Burst pipes, major floods, and sewer backups handled around the clock.", "svc1_desc"],
    ["Immediate Response", "svc1_tag"],
    ["Leak Detection", "svc2_name"],
    ["Non-invasive ultrasonic technology to pinpoint hidden issues before they cause damage.", "svc2_desc"],
    ["Request Scan", "svc2_cta"],
    ["Water Heaters", "svc3_name"],
    ["Installation and maintenance of tankless and traditional systems from premium manufacturers.", "svc3_desc"],
    ["Drain Cleaning", "svc4_name"],
    ["High-pressure hydro-jetting that clears obstructions without damaging aging infrastructure.", "svc4_desc"],
    ["Client Perspectives", "reviews_heading"],
    ["\"Professionalism that matches the standard of our home. They diagnosed a leak that three others missed.\"", "review1_text"],
    ["Jonathan A. · Westfield", "review1_author"],
    ["\"The tankless heater installation was incredibly clean. Their technicians treated our home like their own.\"", "review2_text"],
    ["Sarah L. · Property Manager", "review2_author"],
    ["\"Emergency response on a Sunday was exceptional. They arrived in 45 minutes and solved it quickly.\"", "review3_text"],
    ["Michael P. · Homeowner", "review3_author"],
    ["Ready to Get Started?", "cta_heading"],
    ["Westfield, NJ · Licensed & Insured · 24/7 Emergency Service", "cta_sub"],
    ["© 2024 FlowRight Plumbing · Westfield, NJ · (908) 555-0112 · Powered by Exsisto Premium", "footer_copy"],
  ],
  realestate: [
    ["Summit Realty Group | Premier Luxury Real Estate", "meta_title"],
    ["Summit Realty Group", "biz_name"],
    ["Summit Realty", "biz_name_short"],
    ["SUMMIT REALTY GROUP", "biz_name_upper"],
    ["(908) 555-0145", "phone_formatted"],
    ["9085550145", "phone_raw"],
    ["Summit, NJ", "city_state"],
    ["Short Hills, NJ", "city_state_alt"],
    ["Summit", "city"],
    ["Exclusively New Jersey", "hero_eyebrow"],
    ["Your Legacy,", "hero_line1"],
    ["Found.", "hero_line2"],
    ["Premier Real Estate for the Discerning Collector. Discover a portfolio of architectural masterpieces.", "hero_sub"],
    ["Our Methodology", "services_eyebrow"],
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
    ["Current Portfolio", "portfolio_eyebrow"],
    ["Featured Estates", "portfolio_heading"],
    ["The Glass Pavilion", "listing1_name"],
    ["Summit, NJ · $12,500,000", "listing1_location"],
    ["6 Beds · 8 Baths · 9,400 SQ FT", "listing1_details"],
    ["Willow Glen Manor", "listing2_name"],
    ["Short Hills, NJ · $8,950,000", "listing2_location"],
    ["7 Beds · 9 Baths · 11,200 SQ FT", "listing2_details"],
    ["Echo Ridge Sanctuary", "listing3_name"],
    ["Summit, NJ · $15,200,000", "listing3_location"],
    ["5 Beds · 7 Baths · 8,100 SQ FT", "listing3_details"],
    ["\"Summit Realty Group doesn't just sell homes; they manage legacies. Their attention to detail and absolute discretion set a new standard.\"", "review1_text"],
    ["The Sterling Family", "review1_name"],
    ["Former Owners of The Eastgate Estate", "review1_title"],
    ["Summit, NJ · (908) 555-0145 · Powered by Exsisto Premium", "footer_copy"],
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
    ["Our Heritage", "about_eyebrow"],
    ["A Symphony of", "about_heading1"],
    ["Italian Heritage", "about_heading2"],
    ["For over three decades, La Bella Cucina has stood as a beacon of culinary tradition in the heart of Hoboken.", "about_desc"],
    ["The Seasonal Collection", "menu_eyebrow"],
    ["Signature Offerings", "menu_heading"],
    ["Polpo Croccante", "dish1_name"],
    ["Wild-caught Mediterranean octopus, charred over cherry wood, served with Nduja-infused potato crema.", "dish1_desc"],
    ["Agnello in Crosta", "dish2_name"],
    ["Herb-crusted rack of lamb, pistachio brittle, mint reduction, roasted root vegetables and truffle jus.", "dish2_desc"],
    ["Bistecca Fiorentina", "dish3_name"],
    ["Prime 32oz dry-aged porterhouse, seasoned with sea salt and rosemary, finished with first-press olive oil.", "dish3_desc"],
    ["Begin Your Experience", "cta_heading"],
    ["Limited seating available nightly. We recommend booking two weeks in advance for weekend service.", "cta_sub"],
    ["Direct Line", "cta_phone_label"],
    ["Book a Table", "cta_btn"],
    ["© 2024 La Bella Cucina · Est. 1987, Hoboken NJ · (201) 555-0134 · Powered by Exsisto Premium", "footer_copy"],
  ],
  salon: [
    ["Velvet Studio | Westfield NJ Hair Salon", "meta_title"],
    ["Velvet Studio", "biz_name"],
    ["(908) 555-0167", "phone_formatted"],
    ["9085550167", "phone_raw"],
    ["Westfield, New Jersey", "city_state_long"],
    ["Westfield, NJ", "city_state"],
    ["128 East Broad Street, Westfield, NJ 07090", "address"],
    ["Westfield", "city"],
    ["Artistry", "hero_line1"],
    ["In Motion", "hero_line2"],
    ["A boutique collective dedicated to editorial excellence and the craft of modern hair. We don't just style — we transform.", "hero_sub"],
    ["Curated Services", "services_eyebrow"],
    ["The Service Menu", "services_heading"],
    ["Balayage & Color", "svc1_name"],
    ["Bespoke hand-painted highlights that mimic the sun's natural touch.", "svc1_desc"],
    ["Starting at $245", "svc1_price"],
    ["Bridal & Editorial", "svc2_name"],
    ["Exclusive styling for your most significant moments.", "svc2_desc"],
    ["By Consultation", "svc2_price"],
    ["Precision Cuts", "svc3_name"],
    ["Architectural shaping designed to enhance your facial structure and movement.", "svc3_desc"],
    ["Starting at $110", "svc3_price"],
    ["Keratin & Therapy", "svc4_name"],
    ["Advanced smoothing treatments and restorative rituals for hair health and shine.", "svc4_desc"],
    ["Starting at $350", "svc4_price"],
    ["\"Beauty is the illumination of your soul. We simply provide the frame.\"", "quote_text"],
    ["Velvet Studio Philosophy", "quote_attr"],
    ["Visit the Atelier", "cta_heading"],
    ["Book a Consultation", "cta_btn"],
    ["© 2024 Velvet Studio · Westfield, NJ · (908) 555-0167 · Powered by Exsisto Premium", "footer_copy"],
  ],
};

function toTitleCase(str: string): string {
  if (!str) return str;
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  const cityStateLong = city && state ? `${city}, ${state === "NJ" ? "New Jersey" : state === "NY" ? "New York" : state === "CA" ? "California" : state === "TX" ? "Texas" : state === "FL" ? "Florida" : state}` : cityState;
  const cityStateUpper = cityState.toUpperCase();
  const phoneRaw = phone.replace(/\D/g, "");
  const year = new Date().getFullYear();
  const svcList = services ? services.split(/[,;|\n]/).map(s => s.trim()).filter(Boolean) : [];

  return {
    // Identity
    biz_name:           businessName,
    biz_name_upper:     businessName.toUpperCase(),
    biz_name_short:     businessName.split(" ").slice(0, 2).join(" "),
    biz_name_full:      businessName,
    biz_name_upper_full:businessName.toUpperCase(),

    // Location
    city:               city || "Your City",
    state:              state || "",
    city_state:         cityState || "Your City",
    city_state_long:    cityStateLong,
    city_state_upper:   cityStateUpper,
    city_state_alt:     cityState,
    address:            city ? `${city}, ${state}` : "Your City",
    est_location:       cityState,

    // Contact
    phone_formatted:    phone || "(555) 555-5555",
    phone_raw:          phoneRaw || "5555555555",
    city_phone_upper:   `${cityStateUpper} · ${phone || "(555) 555-5555"}`,

    // Meta
    meta_title:         `${businessName} | ${cityState}`,

    // Footer
    footer_copy:        `© ${year} ${businessName} · ${cityState} · ${phone || "(555) 555-5555"} · Powered by Exsisto`,

    // Hero
    hero_eyebrow:       generated.hero_eyebrow   || `Serving ${cityState}`,
    hero_line1:         generated.hero_line1      || businessName,
    hero_line2:         generated.hero_line2      || "Expert Service",
    hero_line3:         generated.hero_line3      || "Done Right.",
    hero_headline:      generated.hero_headline   || `Expert ${description || "Services"} in ${city}`,
    hero_stat_line:     generated.hero_stat_line  || `Trusted in ${city}`,
    hero_sub:           generated.hero_sub        || `Professional service in ${cityState}.`,
    hero_status:        generated.hero_status     || `Serving ${city} Now`,
    hero_status_label:  "Status: Active",
    hero_cta:           generated.hero_cta        || "GET STARTED TODAY",

    // Services section
    services_eyebrow:   generated.services_eyebrow   || "Our Services",
    services_heading:   generated.services_heading    || "What We Do",
    services_heading_1: generated.services_heading_1  || "Our",
    services_heading_2: generated.services_heading_2  || "Services",
    services_intro:     generated.services_intro      || `Professional ${description || "services"} delivered with expertise and care.`,

    // Services
    svc1_name:  svcList[0] || generated.svc1_name || "Our Primary Service",
    svc1_sub:   generated.svc1_sub    || "Expert Level",
    svc1_detail:generated.svc1_detail || "Available Now",
    svc1_desc:  generated.svc1_desc   || `Professional ${svcList[0] || "service"} delivered with care.`,
    svc1_tag:   generated.svc1_tag    || "Professional",
    svc1_cta:   "Learn More",
    svc1_price: generated.svc1_price  || "Call for Pricing",

    svc2_name:  svcList[1] || generated.svc2_name || "Second Service",
    svc2_sub:   generated.svc2_sub    || "Premium Quality",
    svc2_detail:generated.svc2_detail || "Premium Quality",
    svc2_desc:  generated.svc2_desc   || `Expert ${svcList[1] || "service"} for every need.`,
    svc2_tag:   generated.svc2_tag    || "Trusted",
    svc2_icon:  "build",
    svc2_cta:   "Learn More",
    svc2_price: generated.svc2_price  || "Call for Pricing",

    svc3_name:  svcList[2] || generated.svc3_name || "Third Service",
    svc3_sub:   generated.svc3_sub    || "Reliable Results",
    svc3_detail:generated.svc3_detail || "Reliable Results",
    svc3_desc:  generated.svc3_desc   || `Trusted ${svcList[2] || "service"} you can count on.`,
    svc3_tag:   generated.svc3_tag    || "Reliable",
    svc3_icon:  "handyman",
    svc3_cta:   "Learn More",
    svc3_price: generated.svc3_price  || "Call for Pricing",

    svc4_name:  svcList[3] || generated.svc4_name || "Fourth Service",
    svc4_sub:   generated.svc4_sub    || "Fast & Efficient",
    svc4_detail:generated.svc4_detail || "Fast & Efficient",
    svc4_desc:  generated.svc4_desc   || `Quality ${svcList[3] || "service"} at fair prices.`,
    svc4_tag:   generated.svc4_tag    || "Efficient",
    svc4_tag1:  generated.svc4_tag1   || "Professional",
    svc4_tag2:  generated.svc4_tag2   || "Reliable",
    svc4_cta:   "Learn More",
    svc4_price: generated.svc4_price  || "Call for Pricing",

    // Menu / dishes (restaurant template)
    dish1_name: svcList[0] || generated.dish1_name || "Signature Item",
    dish1_desc: generated.dish1_desc || "Our signature offering, crafted with care.",
    dish2_name: svcList[1] || generated.dish2_name || "House Specialty",
    dish2_desc: generated.dish2_desc || "A beloved classic prepared to perfection.",
    dish3_name: svcList[2] || generated.dish3_name || "Chef's Selection",
    dish3_desc: generated.dish3_desc || "The chef's personal recommendation.",

    // Stats
    stat_eyebrow:  "Proven Results",
    stat1_value:   generated.stat1_value || "500+",
    stat1_label:   generated.stat1_label || "Happy Customers",
    stat1_desc:    generated.stat1_desc  || `${businessName} has served hundreds of satisfied customers in ${cityState}.`,

    // Real estate listings (swapped to services for non-RE businesses)
    portfolio_eyebrow:  "Our Work",
    portfolio_heading:  "Featured Projects",
    listing1_name:      svcList[0] || generated.svc1_name || "Our Services",
    listing1_location:  `${cityState}`,
    listing1_details:   "Contact us for details",
    listing2_name:      svcList[1] || generated.svc2_name || "Our Expertise",
    listing2_location:  `${cityState}`,
    listing2_details:   "Contact us for details",
    listing3_name:      svcList[2] || generated.svc3_name || "Our Work",
    listing3_location:  `${cityState}`,
    listing3_details:   "Contact us for details",

    // Reviews
    reviews_heading: "What Our Customers Say",
    review1_text:    generated.review1_text   || `"${businessName} provided outstanding service. Highly recommended to anyone in ${city}."`,
    review1_author:  `Happy Customer · ${city}`,
    review1_name:    "A. Johnson",
    review1_title:   `Customer in ${city}`,
    review2_text:    generated.review2_text   || `"Professional, punctual, and worth every penny. ${businessName} is the best in ${city}."`,
    review2_author:  `Satisfied Client · ${city}`,
    review3_text:    generated.review3_text   || `"I've used many providers but ${businessName} stands above them all. Five stars."`,
    review3_author:  `Local Resident · ${city}`,

    // About
    about_eyebrow:    "Our Story",
    about_heading1:   generated.about_heading1 || "About",
    about_heading2:   generated.about_heading2 || businessName,
    about_desc:       generated.about_desc     || `${businessName} has proudly served ${cityState} with professional, reliable service.`,

    // Features / results
    results_heading:  generated.results_heading  || "Proven Results",
    results_sub:      generated.results_sub      || `${businessName} delivers measurable results for every customer.`,
    feature1_name:    generated.feature1_name    || (svcList[0] || "Quality Work"),
    feature1_desc:    generated.feature1_desc    || "Professional service delivered to the highest standard.",
    feature2_name:    generated.feature2_name    || (svcList[1] || "Fast Response"),
    feature2_desc:    generated.feature2_desc    || "We show up on time and get the job done right.",

    // CTA
    cta_heading:      generated.cta_heading      || `Ready to Get Started?`,
    cta_heading1:     generated.cta_heading1     || "Ready to Get",
    cta_heading2:     generated.cta_heading2     || "Started?",
    cta_sub:          generated.cta_sub          || `Contact ${businessName} today. Serving ${cityState}.`,
    cta_btn:          "Contact Us",
    cta_btn_upper:    "CONTACT US TODAY",
    cta_phone_label:  "Call Us Directly",
    cta_phone_label2: "Call Now",

    // Misc
    quote_text:       generated.quote_text  || `"Dedicated to excellence in ${city} and beyond."`,
    quote_attr:       `${businessName}`,
    year:             String(year),
    services_eyebrow2: "Why Choose Us",
  };
}

export async function POST(request: Request) {
  const { businessName, industry, city, state, phone, description, services, template } = await request.json();
  if (!businessName) return NextResponse.json({ error: "businessName required" }, { status: 400 });

  const templateKey = template || "plumbing";
  let html: string;
  try {
    html = readFileSync(join(process.cwd(), "public", "stitch-templates", `${templateKey}.html`), "utf-8");
  } catch {
    return NextResponse.json({ error: `Template ${templateKey} not found` }, { status: 404 });
  }

  // Clean inputs
  const cleanBizName = businessName.trim() === businessName.trim().toLowerCase() ||
                       businessName.trim() === businessName.trim().toUpperCase()
    ? toTitleCase(businessName.trim()) : businessName.trim();
  const cleanCity  = toTitleCase((city  || "").trim());
  const cleanState = (state || "").trim().toUpperCase().slice(0, 2);
  const svcList    = (services || "")
    .split(/[,;|\n]/).map((s: string) => toTitleCase(s.trim())).filter(Boolean);
  const cleanServices = svcList.join(", ");

  // Generate with Claude Haiku
  let generated: Record<string, string> = {};
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are a professional copywriter. Fix any spelling errors and apply proper capitalization. Generate polished website copy for this business. Return ONLY valid JSON, no markdown.

Business: ${cleanBizName}
What they do: ${description || cleanServices || industry || "professional services"}
Services: ${cleanServices}
Location: ${[cleanCity, cleanState].filter(Boolean).join(", ")}

Return JSON with these exact keys:
{
  "hero_eyebrow": "Short authority line e.g. 'Serving ${cleanCity || "Your City"} Since 2005'",
  "hero_line1": "First line of bold hero headline (2-4 words)",
  "hero_line2": "Second line of hero headline (2-4 words)",
  "hero_line3": "Final punchy 1-2 word line",
  "hero_headline": "Single complete hero headline",
  "hero_stat_line": "Credibility line e.g. '20+ Years Serving ${cleanCity || "Your City"}'",
  "hero_sub": "One compelling sentence about the business",
  "hero_status": "2-4 word active status",
  "hero_cta": "SHORT ALL-CAPS CTA e.g. 'GET STARTED TODAY'",
  "services_eyebrow": "2-3 word section intro",
  "services_heading": "2-4 word section heading",
  "services_heading_1": "First 1-2 words of heading",
  "services_heading_2": "Second 1-2 words of heading",
  "services_intro": "One sentence about their services range",
  "svc1_name": "${svcList[0] || "Primary Service"}",
  "svc1_sub": "2-3 word subtitle",
  "svc1_detail": "2-3 word status e.g. 'Available Now'",
  "svc1_desc": "One sentence",
  "svc1_tag": "One word tag",
  "svc1_price": "Price or 'Call for Quote'",
  "svc2_name": "${svcList[1] || "Second Service"}",
  "svc2_sub": "2-3 word subtitle",
  "svc2_detail": "2-3 word status",
  "svc2_desc": "One sentence",
  "svc2_tag": "One word tag",
  "svc2_price": "Price or 'Call for Quote'",
  "svc3_name": "${svcList[2] || "Third Service"}",
  "svc3_sub": "2-3 word subtitle",
  "svc3_detail": "2-3 word status",
  "svc3_desc": "One sentence",
  "svc3_tag": "One word tag",
  "svc3_price": "Price or 'Call for Quote'",
  "svc4_name": "${svcList[3] || "Fourth Service"}",
  "svc4_sub": "2-3 word subtitle",
  "svc4_detail": "2-3 word status",
  "svc4_desc": "One sentence",
  "svc4_tag": "One word tag",
  "svc4_tag1": "Tag word 1",
  "svc4_tag2": "Tag word 2",
  "svc4_price": "Price or 'Call for Quote'",
  "dish1_name": "First item/service name",
  "dish1_desc": "One sentence description",
  "dish2_name": "Second item/service name",
  "dish2_desc": "One sentence description",
  "dish3_name": "Third item/service name",
  "dish3_desc": "One sentence description",
  "results_heading": "2-4 word results heading",
  "results_sub": "One sentence about their results",
  "feature1_name": "First feature/benefit name",
  "feature1_desc": "One sentence",
  "feature2_name": "Second feature/benefit name",
  "feature2_desc": "One sentence",
  "stat1_value": "Impressive number e.g. '500+'",
  "stat1_label": "What it represents",
  "stat1_desc": "One sentence about this achievement",
  "about_heading1": "First part of about heading",
  "about_heading2": "Second part",
  "about_desc": "One sentence about the business",
  "cta_heading": "Short question CTA heading",
  "cta_heading1": "First half of CTA",
  "cta_heading2": "Second half of CTA",
  "cta_sub": "One sentence with location mention",
  "review1_text": "Realistic 1-2 sentence review in quotes",
  "review2_text": "Different realistic review in quotes",
  "review3_text": "Third realistic review in quotes",
  "quote_text": "Short inspirational quote in quotes"
}`,
      }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    generated = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("Content generation failed:", e);
  }

  // Build content map
  const content = buildContent(cleanBizName, cleanCity, cleanState, phone || "", description || "", cleanServices, generated);

  // Add nav-specific content to content map
  const navContent: Record<string, string> = {
    nav_home:     "Home",
    nav_services: "Services",
    nav_about:    "About",
    nav_reviews:  "Reviews",
    nav_contact:  "Contact",
    nav1: svcList[0] || "Services",
    nav2: svcList[1] || "About",
    nav3: svcList[2] || "Contact",
    nav4: svcList[3] || "More",
  };
  const fullContent = { ...content, ...navContent };

  // Apply all swaps
  const swaps = TEMPLATE_SWAPS[templateKey] || [];
  for (const [search, key] of swaps) {
    const replacement = fullContent[key] !== undefined ? fullContent[key] : search;
    html = html.replaceAll(search, replacement);
  }

  // Fix phone href attributes
  const phoneRaw = (phone || "").replace(/\D/g, "");
  if (phoneRaw) html = html.replace(/href="tel:\d+"/g, `href="tel:${phoneRaw}"`);

  // Replace expired Google CDN images with industry images from manifest
  // Map customer industry to manifest key
  const INDUSTRY_MAP: Record<string, string> = {
    auto: "auto", automotive: "auto",
    bakery: "bakery",
    dental: "dental",
    gym: "gym", fitness: "gym",
    hvac: "hvac",
    landscaping: "landscaping", landscape: "landscaping",
    law: "law", legal: "law",
    pet: "pet",
    plumbing: "plumbing",
    realestate: "realestate", "real estate": "realestate",
    restaurant: "restaurant", food: "restaurant",
    salon: "salon", hair: "salon",
  };

  const industryKey = INDUSTRY_MAP[(industry || "").toLowerCase()] || "other";

  // Image manifest — permanent GitHub raw URLs per industry
  const IMAGE_MANIFEST: Record<string, string[]> = {
    auto:        ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/auto/auto_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/auto/auto_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/auto/auto_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/auto/auto_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/auto/auto_05.jpg"],
    bakery:      ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/bakery/bakery_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/bakery/bakery_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/bakery/bakery_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/bakery/bakery_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/bakery/bakery_05.jpg"],
    dental:      ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/dental/dental_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/dental/dental_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/dental/dental_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/dental/dental_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/dental/dental_05.jpg"],
    gym:         ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/gym/gym_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/gym/gym_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/gym/gym_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/gym/gym_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/gym/gym_05.jpg"],
    hvac:        ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/hvac/hvac_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/hvac/hvac_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/hvac/hvac_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/hvac/hvac_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/hvac/hvac_05.jpg"],
    landscaping: ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/landscaping/landscaping_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/landscaping/landscaping_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/landscaping/landscaping_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/landscaping/landscaping_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/landscaping/landscaping_05.jpg"],
    law:         ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/law/law_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/law/law_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/law/law_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/law/law_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/law/law_05.jpg"],
    pet:         ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/pet/pet_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/pet/pet_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/pet/pet_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/pet/pet_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/pet/pet_05.jpg"],
    plumbing:    ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/plumbing/plumbing_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/plumbing/plumbing_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/plumbing/plumbing_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/plumbing/plumbing_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/plumbing/plumbing_05.jpg"],
    realestate:  ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/realestate/realestate_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/realestate/realestate_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/realestate/realestate_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/realestate/realestate_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/realestate/realestate_05.jpg"],
    restaurant:  ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/restaurant/restaurant_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/restaurant/restaurant_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/restaurant/restaurant_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/restaurant/restaurant_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/restaurant/restaurant_05.jpg"],
    salon:       ["https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/salon/salon_01.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/salon/salon_02.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/salon/salon_03.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/salon/salon_04.jpg","https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/salon/salon_05.jpg"],
  };

  const industryImages = IMAGE_MANIFEST[industryKey];

  if (industryImages) {
    // Replace all expired Google CDN images with industry images in order
    let imgIndex = 0;
    html = html.replace(/https:\/\/lh3\.googleusercontent\.com[^\s"']+/g, () => {
      const img = industryImages[imgIndex % industryImages.length];
      imgIndex++;
      return img;
    });
  } else {
    // "other" industry — trigger Nano Banana async (non-blocking) and use placeholder for now
    // The real site will have custom Nano Banana images when Matt builds it in admin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
    fetch(`${appUrl}/api/generate-images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
      },
      body: JSON.stringify({
        businessName: cleanBizName,
        industry: industry || "other",
        city: cleanCity,
        services: svcList,
        tier: "pro",
        preview: true,
      }),
    }).catch(() => {});

    // Use a neutral placeholder for now
    html = html.replace(/https:\/\/lh3\.googleusercontent\.com[^\s"']+/g,
      "https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/public/images/auto/auto_01.jpg"
    );
  }

  // Fix copyright year
  html = html.replace(/© 20\d\d /g, `© ${new Date().getFullYear()} `);

  // Update page title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${cleanBizName} | ${content.city_state}</title>`);

  // ── POST-PROCESS: Replace nav link text with customer services ──────────────
  // Each template nav has <a class="...">ServiceName</a>
  // We replace the text content of nav links with customer's service names
  // keeping all CSS classes intact
  const navServices = [
    svcList[0] || "Services",
    svcList[1] || "About",
    svcList[2] || "Contact",
    svcList[3] || "More",
  ];

  // Per-template: the exact nav text strings to replace
  const NAV_TEXTS: Record<string, string[]> = {
    auto:       ["Restorations", "Services", "Process", "Inquire"],
    dental:     ["Home", "Treatments", "Our Team", "Contact"],
    gym:        ["Services", "Schedule", "Location", "Join"],
    hvac:       ["AC Installation", "Heating Repair", "Duct Cleaning", "Maintenance"],
    law:        ["Personal Injury", "Criminal Defense", "Family Law", "Estate Planning"],
    pet:        ["Grooming", "Boarding", "Daycare", "Training"],
    plumbing:   ["Services", "About", "Reviews", "Contact"],
    realestate: ["Buy", "Sell", "Luxury", "About"],
    restaurant: ["Dine In", "Private Events", "Catering", "Wine Cellar"],
    salon:      ["Services", "Stylists", "Gallery", "Contact"],
  };

  const navTexts = NAV_TEXTS[templateKey] || [];
  navTexts.forEach((oldText, i) => {
    const newText = navServices[i] || oldText;
    // Replace text between >OLDTEXT< in anchor tags
    html = html.replace(
      new RegExp(`(href="#[^"]*">)${oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(<\/a>)`, "g"),
      `$1${newText}$2`
    );
    // Also handle href="#services", "#about" etc
    html = html.replace(
      new RegExp(`(href="#\w+">)${oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(<\/a>)`, "g"),
      `$1${newText}$2`
    );
  });

  // ── POST-PROCESS: Replace any remaining hardcoded about/hero text ─────────
  // Some templates have deeply nested text that didn't match swap table
  // Do a final targeted pass for the most common offenders

  // Restaurant about section hardcoded text
  html = html.replace(
    /For over three decades, [^<]+has stood as a beacon of culinary tradition[^<]+\./g,
    content.about_desc
  );
  html = html.replace(/Italian Heritage/g, content.about_heading2);
  html = html.replace(/A Symphony of/g, content.about_heading1);

  // "Reservations" button in restaurant
  html = html.replace(/>Reservations</g, ">Book Now<");

  // Any remaining "Est. 1987" references
  html = html.replace(/Est\. 1987[^<]*/g, content.est_location || cityState);

  // Remaining old business name fragments that might have slipped through
  const oldNames = ["La Bella Cucina", "FlowRight", "Cool Breeze", "Morgan & Associates",
                    "Summit Realty", "Happy Paws", "Velvet Studio", "Iron Peak",
                    "IRON PEAK", "Bright Smile Dental", "Matty's Automotive", "MATTY'S AUTOMOTIVE"];
  for (const oldName of oldNames) {
    if (html.includes(oldName)) {
      html = html.replaceAll(oldName, cleanBizName);
    }
  }

  // Add disclaimer bar
  const disclaimer = `<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#1b1b25;display:flex;align-items:center;padding:8px 16px;font-family:-apple-system,sans-serif;font-size:12px;gap:10px;pointer-events:none;"><span style="color:#6366f1;font-weight:700;letter-spacing:0.5px;font-size:11px;">PREVIEW</span><span style="color:#fff;font-weight:600;">${cleanBizName}</span><span style="background:#2d2d3d;color:#9090a8;font-size:11px;padding:3px 10px;border-radius:100px;">Images are samples · Copy customized for your business</span></div><div style="height:42px;"></div>`;
  html = html.replace(/(<body[^>]*>)/, `$1${disclaimer}`);

  return NextResponse.json({ html, templateKey });
}

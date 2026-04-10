#!/usr/bin/env node
/**
 * generate-site.js — Exsisto.ai
 *
 * Generates a full static site with real URLs (no SPA), sitemap.xml,
 * robots.txt, and schema markup for SEO.
 *
 * Output structure:
 *   public/sites/{subdomain}/
 *     index.html
 *     about/index.html
 *     services/index.html
 *     services/{slug}/index.html   (one per service)
 *     blog/index.html
 *     blog/{slug}/index.html       (one per post)
 *     contact/index.html
 *     sitemap.xml
 *     robots.txt
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const config = {
  businessId:   process.env.BUSINESS_ID,
  businessName: process.env.BUSINESS_NAME,
  industry:     process.env.INDUSTRY?.toLowerCase(),
  tagline:      process.env.TAGLINE || '',
  city:         process.env.CITY,
  state:        process.env.STATE,
  phone:        process.env.PHONE,
  email:        process.env.EMAIL || '',
  subdomain:    process.env.SUBDOMAIN,
  plan:         (process.env.PLAN || 'starter').toLowerCase(),
  template:     process.env.TEMPLATE || 'skeleton-clean',
  primaryColor: process.env.PRIMARY_COLOR || '#4648d4',
  accentColor:  process.env.ACCENT_COLOR  || '#6366f1',
  services:     process.env.SERVICES ? process.env.SERVICES.split(',').map(s => s.trim()) : [],
  isDemo:       process.env.IS_DEMO === 'true',
  geminiKey:    process.env.GEMINI_API_KEY,
  supabaseUrl:  process.env.SUPABASE_URL,
  supabaseKey:  process.env.SUPABASE_SERVICE_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
};

const IMAGE_COUNTS = { starter: 5, pro: 8, premium: 12 };
const BLOG_COUNTS  = { starter: 1, pro: 2, premium: 4 };
const imageCount   = IMAGE_COUNTS[config.plan] || 5;
const blogCount    = BLOG_COUNTS[config.plan]  || 1;

const STORAGE_BUCKET = 'industry-images';
const MODEL_IMAGE    = 'gemini-3.1-flash-image-preview';

const slug  = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Base site URL
const siteBaseUrl = () => `https://${config.subdomain}.exsisto.ai`;

// ── Nano Banana image generation ──────────────────────────────────────────────
function buildImagePrompts() {
  const { industry, city, state } = config;
  const loc = `${city}, ${state}`;
  const q   = `photorealistic photograph, no text, no signs, no UI, no watermark, professional photography`;

  const prompts = {
    auto: [
      `Exterior of a clean modern auto repair shop at golden hour, cars parked outside, dramatic sky, ${loc} — ${q}`,
      `Organized service bay interior with vehicle on a lift, epoxy floors, bright overhead lighting — ${q}`,
      `Close-up of mechanic's hands using professional tools on a car engine, clean uniform — ${q}`,
      `Wide shot of modern automotive service center exterior, multiple bays, daytime — ${q}`,
      `Gleaming customer car freshly repaired, parked outside a professional shop — ${q}`,
      `Mechanic in uniform smiling next to a repaired vehicle, natural light — ${q}`,
      `Tire rotation and wheel alignment equipment in a clean professional shop — ${q}`,
      `Front desk service advisor reviewing work order with customer — ${q}`,
      `Close-up of brake caliper and rotor being inspected by technician — ${q}`,
      `Auto shop waiting area with comfortable seating, clean modern interior — ${q}`,
      `Engine diagnostic equipment connected to a car computer — ${q}`,
      `Night shot of auto repair shop exterior, lit signage, professional — ${q}`,
    ],
    dental: [
      `Modern dental office reception area, clean white walls, bright natural light — ${q}`,
      `Smiling female dentist in white coat, warm natural light, professional portrait — ${q}`,
      `Close-up of a patient with a perfect bright white smile, shallow depth of field — ${q}`,
      `Dental treatment room with modern chair and equipment, spotless, no people — ${q}`,
      `Dental team of three in scrubs smiling together in a bright office hallway — ${q}`,
      `State-of-the-art 3D dental imaging equipment in a clean clinical room — ${q}`,
      `Modern dental office exterior, welcoming entrance, blue sky — ${q}`,
      `Dentist reviewing digital X-rays on a large monitor, clinical setting — ${q}`,
      `Dental hygienist preparing instruments in a clean operatory — ${q}`,
      `Happy patient leaving dental office with a big smile — ${q}`,
      `Children's corner in a bright dental office, colorful and welcoming — ${q}`,
      `Close-up of dental tools laid out on a sterile tray, professional — ${q}`,
    ],
    law: [
      `Elegant law office interior, dark wood bookshelves, mahogany desk, dramatic window light — ${q}`,
      `Confident attorney in tailored dark suit at polished desk, professional bookshelves — ${q}`,
      `Courthouse exterior with steps and columns, golden hour light — ${q}`,
      `Attorney and client in consultation across a desk, professional office — ${q}`,
      `Close-up of gavel on a polished desk with law books — ${q}`,
      `Law firm conference room with large table, modern and professional — ${q}`,
      `Attorney reviewing legal documents, focused, natural window light — ${q}`,
      `Legal library with floor-to-ceiling law books, prestigious atmosphere — ${q}`,
      `Two attorneys collaborating over documents in a bright office — ${q}`,
      `Law firm building exterior, professional and established — ${q}`,
      `Close-up of scales of justice on a desk, symbolic — ${q}`,
      `Lawyer shaking hands with client, professional resolution — ${q}`,
    ],
    restaurant: [
      `Inviting restaurant interior, warm lighting, beautifully set tables, ${loc} — ${q}`,
      `Beautiful plated signature dish on rustic wood table, food photography — ${q}`,
      `Chef in whites plating a dish in a professional kitchen, action shot — ${q}`,
      `Happy couple dining at a candlelit restaurant table, warm atmosphere — ${q}`,
      `Restaurant bar area with craft cocktails and ambient lighting — ${q}`,
      `Exterior of restaurant at night, warm glow from windows, inviting — ${q}`,
      `Fresh ingredients laid out on a kitchen counter, farm-to-table feel — ${q}`,
      `Dessert presentation on an elegant plate, food photography — ${q}`,
      `Full dining room with happy guests, busy but comfortable atmosphere — ${q}`,
      `Server presenting a dish to guests at a table — ${q}`,
      `Wine cellar or wine wall in a restaurant, sophisticated — ${q}`,
      `Brunch spread on a beautifully laid table, natural daylight — ${q}`,
    ],
    salon: [
      `Modern hair salon interior, stylish chairs and mirrors, ${loc} — ${q}`,
      `Stylist cutting hair with precision, professional setting, natural light — ${q}`,
      `Close-up of beautiful fresh hair color and highlights, bokeh background — ${q}`,
      `Happy client looking in mirror after hair transformation — ${q}`,
      `Shampoo bowl area with ambient lighting, spa-like feel — ${q}`,
      `Salon front desk with flowers and clean modern aesthetic — ${q}`,
      `Colorist applying balayage technique, detailed close-up — ${q}`,
      `Blow-dry styling in progress, professional tools in use — ${q}`,
      `Nail technician doing a manicure, clean close-up — ${q}`,
      `Salon waiting area with plush seating and tasteful decor — ${q}`,
      `Rows of professional hair products on salon shelves — ${q}`,
      `Before and after: client's hair transformation, split composition — ${q}`,
    ],
    gym: [
      `Spacious modern gym interior, weight area, dramatic lighting — ${q}`,
      `Person lifting weights with determination, cinematic motion blur — ${q}`,
      `Clean yoga stretching area with wood floors and natural light — ${q}`,
      `Group fitness class in action, high energy, diverse group — ${q}`,
      `Modern cardio equipment row, treadmills and bikes, gym atmosphere — ${q}`,
      `Personal trainer working one-on-one with client — ${q}`,
      `Gym exterior with large windows showing equipment inside — ${q}`,
      `Close-up of hands gripping a barbell, chalk and determination — ${q}`,
      `Spin class in action, low lighting, energetic atmosphere — ${q}`,
      `Recovery area with foam rollers and stretching mats — ${q}`,
      `Protein shake bar and nutrition station in a gym — ${q}`,
      `Locker room interior, clean and modern — ${q}`,
    ],
    hvac: [
      `HVAC technician on rooftop servicing AC unit, blue sky, ${loc} — ${q}`,
      `Clean modern home with new HVAC unit outside, suburban setting — ${q}`,
      `Technician in uniform checking thermostat inside a home — ${q}`,
      `Hands working on HVAC equipment with professional tools — ${q}`,
      `Happy homeowner shaking hands with HVAC technician at door — ${q}`,
      `HVAC service van parked in front of a residential home — ${q}`,
      `Ductwork installation in a home, clean professional work — ${q}`,
      `Air filter replacement, close-up, clean and clear — ${q}`,
      `Modern smart thermostat on a clean wall — ${q}`,
      `Technician writing on a clipboard after completing a job — ${q}`,
      `Basement utility room with new HVAC system installed — ${q}`,
      `Split AC unit installation on exterior wall, professional — ${q}`,
    ],
    plumbing: [
      `Professional plumber at work under sink, clean uniform, ${loc} — ${q}`,
      `New bathroom installation with gleaming modern fixtures — ${q}`,
      `Plumber fixing pipe joint with professional tools, focused — ${q}`,
      `Modern kitchen with new plumbing fixtures, clean and bright — ${q}`,
      `Plumbing service truck in front of residential home — ${q}`,
      `Close-up of pipe fitting work, professional quality — ${q}`,
      `Newly installed water heater in clean utility space — ${q}`,
      `Plumber and homeowner reviewing completed work — ${q}`,
      `Bathroom remodel with new tile and fixtures, complete — ${q}`,
      `Drain clearing equipment, professional grade — ${q}`,
      `Outdoor irrigation system installation — ${q}`,
      `Modern bathroom showing quality plumbing work — ${q}`,
    ],
    realestate: [
      `Beautiful luxury home exterior, manicured lawn, golden hour, ${loc} — ${q}`,
      `Bright modern kitchen in staged home, real estate photography — ${q}`,
      `Spacious living room with large windows and natural light — ${q}`,
      `Real estate agent showing home to couple, professional — ${q}`,
      `Aerial view of neighborhood, homes and tree-lined streets — ${q}`,
      `Master bedroom staged beautifully, natural light — ${q}`,
      `Backyard with pool and landscaping, luxury property — ${q}`,
      `Real estate agent at desk reviewing documents with clients — ${q}`,
      `Commercial property exterior, professional and established — ${q}`,
      `Home office setup in a beautiful home — ${q}`,
      `Real estate agent handshake with clients at closing — ${q}`,
      `Luxury condo interior with city views — ${q}`,
    ],
    pet: [
      `Bright modern pet grooming salon interior, playful, ${loc} — ${q}`,
      `Happy golden retriever being groomed, professional setting — ${q}`,
      `Groomer carefully trimming a poodle, focused close-up — ${q}`,
      `Clean kennel area with happy dogs, professional — ${q}`,
      `Pet owner greeting groomer at counter with excited dog — ${q}`,
      `Close-up of dog after grooming, fluffy and clean — ${q}`,
      `Cat being groomed gently, professional and calm — ${q}`,
      `Pet grooming tools laid out professionally — ${q}`,
      `Dog daycare play area, happy dogs playing — ${q}`,
      `Veterinary checkup, gentle and professional — ${q}`,
      `Happy dog running in a clean outdoor area — ${q}`,
      `Groomer bathing a dog in a professional tub — ${q}`,
    ],
    landscaping: [
      `Beautifully landscaped front yard, lush plants, curb appeal, ${loc} — ${q}`,
      `Landscaper operating professional lawn equipment — ${q}`,
      `Stunning backyard patio with garden design and plantings — ${q}`,
      `Close-up of planted flowers and fresh mulched garden beds — ${q}`,
      `Landscape crew working on a residential property, professional — ${q}`,
      `Finished hardscape patio with stone work, evening light — ${q}`,
      `Irrigation system being installed in a lawn — ${q}`,
      `Before-after: overgrown yard to pristine landscaping — ${q}`,
      `Tree trimming with professional equipment and crew — ${q}`,
      `Winter snow removal from a commercial property — ${q}`,
      `Native plant garden design, sustainable and beautiful — ${q}`,
      `Landscape design plan being reviewed with homeowner — ${q}`,
    ],
    bakery: [
      `Warm artisan bakery interior, fresh loaves on display, ${loc} — ${q}`,
      `Baker pulling fresh bread from brick oven, dramatic steam — ${q}`,
      `Close-up of perfectly decorated custom cake, food photography — ${q}`,
      `Glass display case with pastries and breads, beautiful arrangement — ${q}`,
      `Happy customer at bakery counter receiving their order — ${q}`,
      `Artisan sourdough loaves cooling on a rack — ${q}`,
      `Baker decorating a wedding cake, precise detail work — ${q}`,
      `Fresh croissants on a baking sheet, golden and flaky — ${q}`,
      `Bakery café seating area, cozy and inviting — ${q}`,
      `Macaron tower display, colorful and elegant — ${q}`,
      `Baker kneading dough, flour dusted, artisan process — ${q}`,
      `Morning bakery production, team working in kitchen — ${q}`,
    ],
  };

  const industryPrompts = prompts[config.industry] || prompts['auto'];
  return industryPrompts.slice(0, imageCount).map((prompt, i) => ({
    slot: i === 0 ? 'hero' : i === 1 ? 'about' : 'img' + (i + 1),
    prompt,
  }));
}

async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_IMAGE}:generateContent?key=${config.geminiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['image', 'text'] },
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Gemini ' + res.status);
      const data = await res.json();
      for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
        }
      }
      throw new Error('No image in response');
    } catch (e) {
      if (attempt < 2) { await sleep(10000); continue; }
      throw e;
    }
  }
}

async function uploadImage(base64, mimeType, slot) {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const storagePath = 'client-sites/' + config.subdomain + '/' + slot + '.' + ext;
  const res = await fetch(config.supabaseUrl + '/storage/v1/object/' + STORAGE_BUCKET + '/' + storagePath, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + config.supabaseKey, 'Content-Type': mimeType, 'x-upsert': 'true' },
    body: Buffer.from(base64, 'base64'),
  });
  if (!res.ok) throw new Error('Supabase upload ' + res.status + ': ' + await res.text());
  return config.supabaseUrl + '/storage/v1/object/public/' + STORAGE_BUCKET + '/' + storagePath;
}

// ── Claude: site copy ─────────────────────────────────────────────────────────
async function generateContent() {
  const anthropic = new Anthropic({ apiKey: config.anthropicKey });
  const servicesList = config.services.length > 0 ? config.services.join(', ') : 'professional ' + config.industry + ' services';

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are a professional copywriter creating website content for a local small business. Return ONLY valid JSON, no markdown.

Business: ${config.businessName}
Industry: ${config.industry}
Location: ${config.city}, ${config.state}
Phone: ${config.phone}
Tagline: ${config.tagline || 'Professional service you can trust'}
Services: ${servicesList}

{
  "heroHeadline": "Bold 4-7 word headline",
  "heroSub": "2-3 sentence value proposition with local feel",
  "aboutTitle": "3-5 word about section title",
  "aboutBody": "3-4 sentences: history, mission, what makes them different. Local and authentic.",
  "services": [
    {"name": "service name", "description": "2 sentence description", "icon": "single emoji"},
    {"name": "service name", "description": "2 sentence description", "icon": "single emoji"},
    {"name": "service name", "description": "2 sentence description", "icon": "single emoji"},
    {"name": "service name", "description": "2 sentence description", "icon": "single emoji"},
    {"name": "service name", "description": "2 sentence description", "icon": "single emoji"},
    {"name": "service name", "description": "2 sentence description", "icon": "single emoji"}
  ],
  "stat1": {"number": "500+", "label": "Happy Customers"},
  "stat2": {"number": "18+", "label": "Years Experience"},
  "stat3": {"number": "98%", "label": "Satisfaction Rate"},
  "stat4": {"number": "4.9★", "label": "Google Rating"},
  "ctaHeadline": "5-7 word call to action",
  "ctaBody": "One urgent value-driven sentence",
  "processSteps": [
    {"title": "2-3 word step", "desc": "2 sentence description"},
    {"title": "2-3 word step", "desc": "2 sentence description"},
    {"title": "2-3 word step", "desc": "2 sentence description"}
  ],
  "promiseBadges": ["3-5 word trust signal", "3-5 word trust signal", "3-5 word trust signal"],
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 155 chars"
}

Use actual services if provided. Make content feel local to ${config.city}, ${config.state}.`,
    }],
  });

  const raw = msg.content[0].text.trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim();
  return JSON.parse(raw);
}

// ── Claude: service page copy ─────────────────────────────────────────────────
async function generateServicePage(svc) {
  const anthropic = new Anthropic({ apiKey: config.anthropicKey });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Write detailed website copy for a single service page. Return ONLY valid JSON, no markdown.

Business: ${config.businessName}
Industry: ${config.industry}
Location: ${config.city}, ${config.state}
Phone: ${config.phone}
Service: ${svc.name}

{
  "headline": "6-9 word headline featuring the service and ${config.city}, ${config.state}",
  "intro": "3-4 sentences introducing this service, local feel, trust-building, why it matters",
  "body1Title": "3-4 word subheading about the service process",
  "body1": "4-5 sentences about what this service involves, the step-by-step process, and why it matters. Minimum 100 words.",
  "body2Title": "3-4 word subheading about what's included",
  "body2": "4-5 sentences covering what's included, what the customer should expect, common signs they need this service, and what happens if ignored. Minimum 100 words.",
  "body3Title": "3-4 word subheading about why choose us",
  "body3": "4-5 sentences on why ${config.businessName} is the best choice for this service in ${config.city}, ${config.state}. Mention experience, quality, and local reputation. Minimum 100 words.",
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {"q": "relevant question about this service", "a": "detailed 2-3 sentence answer"},
    {"q": "relevant question about pricing or timing", "a": "detailed 2-3 sentence answer"},
    {"q": "relevant question about what to expect", "a": "detailed 2-3 sentence answer"}
  ],
  "cta": "5-7 word call to action specific to this service",
  "metaTitle": "SEO title under 60 chars with service + city",
  "metaDescription": "SEO description under 155 chars with service + city + business name"
}`,
    }],
  });

  const raw = msg.content[0].text.trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim();
  const parsed = JSON.parse(raw);
  return { ...parsed, name: svc.name, icon: svc.icon, slug: slug(svc.name) };
}

// ── Claude: blog post ─────────────────────────────────────────────────────────
const BLOG_TOPICS = {
  auto:        ['5 warning signs your car needs immediate attention', 'how to choose a trustworthy auto shop in your area', 'seasonal car care guide for your vehicle', 'the real cost of skipping oil changes'],
  dental:      ['how often should you really visit the dentist', 'cosmetic dentistry options explained for new patients', 'tips for whiter teeth at home between appointments', 'what to expect at your first dental visit'],
  law:         ['what to do immediately after a car accident', 'how to find the right attorney for your case', 'understanding personal injury compensation in your state', 'common legal mistakes that hurt your case'],
  restaurant:  ['the story behind our farm-to-table sourcing', 'the story behind our signature dish', 'a wine pairing guide for beginners', 'behind the scenes in our kitchen'],
  salon:       ['how to maintain your hair color between appointments', 'the best haircuts for your face shape', 'professional vs drugstore hair products compared', 'seasonal hair trends and how to wear them'],
  gym:         ['a beginner guide to starting your workout routine', 'nutrition tips to maximize your training results', 'how to stay motivated and consistent at the gym', 'the real benefits of working with a personal trainer'],
  hvac:        ['how to lower your energy bill this summer', 'warning signs your AC needs immediate servicing', 'how often should you replace your air filters', 'preparing your HVAC system for winter'],
  plumbing:    ['signs you have a hidden water leak in your home', 'how to prevent frozen pipes this winter', 'when to call a plumber vs attempting a DIY fix', 'how to maintain your water heater for longevity'],
  realestate:  ['essential tips for first-time homebuyers in your market', 'how to price your home to sell fast in any market', 'home improvements that add the most value before selling', 'understanding the closing process from offer to keys'],
  pet:         ['how often should you professionally groom your dog', 'grooming tips to keep your pet looking great between visits', 'signs your pet needs a professional groomer', 'choosing the right groomer for your pet breed'],
  landscaping: ['spring lawn care checklist for a healthy yard', 'how to choose the right plants for your climate and yard', 'low maintenance landscaping ideas that save time and money', 'the benefits of hiring a professional landscaping company'],
  bakery:      ['the story behind our sourdough recipe and process', 'how to properly store artisan bread at home', 'your complete guide to ordering a custom cake', 'seasonal flavors and the inspiration behind them'],
};

async function generateBlogPost(topic) {
  const anthropic = new Anthropic({ apiKey: config.anthropicKey });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Write a detailed blog post for a local small business. Return ONLY valid JSON, no markdown.

Business: ${config.businessName}
Industry: ${config.industry}
Location: ${config.city}, ${config.state}
Phone: ${config.phone}
Topic: ${topic}

{
  "title": "SEO-optimized blog title specific to this business and location",
  "slug": "url-friendly-slug-from-title",
  "excerpt": "2-3 sentence summary for previews and meta description",
  "body": "Full blog post, 750-900 words. Write in a helpful professional tone with clear paragraphs separated by blank lines. Include an introduction, 3-4 main sections each with a subheading in markdown ## format, and a conclusion with a call to action mentioning ${config.businessName} and phone number ${config.phone}. Include the business name and ${config.city}, ${config.state} naturally throughout.",
  "metaTitle": "SEO meta title under 60 chars",
  "metaDescription": "SEO meta description under 155 chars"
}`,
    }],
  });

  const raw = msg.content[0].text.trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim();
  const parsed = JSON.parse(raw);
  return { ...parsed, slug: parsed.slug || slug(parsed.title) };
}

// ── Shared HTML components ────────────────────────────────────────────────────
function getTheme() {
  const themes = {
    'skeleton-clean': { primary: '#1352cc', accent: '#00c4b4', bg: '#f7f9ff', dark: '#0d1b3e', headFont: 'Playfair Display', bodyFont: 'DM Sans', fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap' },
    'skeleton-bold':  { primary: '#1a1a1a', accent: '#e85d26', bg: '#f5f5f5', dark: '#111', headFont: 'Bebas Neue', bodyFont: 'Barlow', fontUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap' },
    'skeleton-warm':  { primary: '#0d1f3c', accent: '#b8973a', bg: '#fdfbf7', dark: '#070f1e', headFont: 'Cormorant Garamond', bodyFont: 'Inter', fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap' },
  };
  const t = themes[config.template] || themes['skeleton-clean'];
  if (config.primaryColor !== '#4648d4') t.primary = config.primaryColor;
  if (config.accentColor  !== '#6366f1') t.accent  = config.accentColor;
  return t;
}

function sharedCSS(theme) {
  return `
    :root {
      --primary: ${theme.primary}; --accent: ${theme.accent}; --bg: ${theme.bg};
      --dark: ${theme.dark}; --mid: #555; --light: #888; --border: #e5e5e5;
      --white: #fff; --r: 8px; --r-lg: 16px; --shadow: 0 4px 24px rgba(0,0,0,0.09);
      --nav-h: 68px; --head: '${theme.headFont}', Georgia, serif; --body: '${theme.bodyFont}', sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--body); color: var(--dark); background: #fff; overflow-x: hidden; line-height: 1.6; }
    img { display: block; width: 100%; object-fit: cover; }
    a { color: inherit; text-decoration: none; }

    nav { position: sticky; top: 0; z-index: 200; height: var(--nav-h); background: var(--primary); display: flex; align-items: center; justify-content: space-between; padding: 0 48px; box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
    .nav-logo { font-family: var(--head); font-size: 22px; color: #fff; letter-spacing: 0.03em; }
    .nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
    .nav-links > li > a { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.06em; transition: color 0.2s; }
    .nav-links > li > a:hover { color: #fff; }
    .nav-cta { background: var(--accent) !important; color: #fff !important; padding: 10px 20px; border-radius: var(--r); font-weight: 700 !important; }
    .nav-dropdown { position: relative; }
    .nav-dropdown-menu { display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); background: var(--white); border-radius: var(--r); box-shadow: 0 8px 32px rgba(0,0,0,0.18); min-width: 220px; z-index: 300; padding: 16px 0 8px; margin-top: -8px; }
    .nav-dropdown:hover .nav-dropdown-menu { display: block; }
    .nav-dropdown-menu a { display: block; padding: 10px 18px; font-size: 14px; font-weight: 500; color: var(--dark) !important; text-transform: none !important; letter-spacing: 0 !important; transition: background 0.15s; }
    .nav-dropdown-menu a:hover { background: var(--bg); color: var(--primary) !important; }
    .nav-dropdown > a::after { content: ' ▾'; font-size: 10px; opacity: 0.7; }
    #hamburger { display: none; background: none; border: none; cursor: pointer; flex-direction: column; gap: 5px; }
    #hamburger span { display: block; width: 22px; height: 2px; background: #fff; }

    .sec { padding: 88px 64px; }
    .sec-off { background: var(--bg); }
    .sec-dark { background: var(--dark); }
    .sec-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
    .sec-title { font-family: var(--head); font-size: clamp(28px, 4.5vw, 54px); line-height: 1.08; letter-spacing: 0.01em; margin-bottom: 14px; }
    .sec-title-light { color: #fff; }
    .sec-title-dark { color: var(--dark); }
    .sec-body { font-size: 17px; color: var(--mid); max-width: 600px; line-height: 1.75; font-weight: 300; }
    .sec-body-light { color: rgba(255,255,255,0.65); }
    .sec-hdr { margin-bottom: 52px; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: var(--r); font-family: var(--body); font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: transform 0.18s, background 0.18s; text-decoration: none; }
    .btn:hover { transform: translateY(-2px); }
    .btn-accent { background: var(--accent); color: #fff; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-ghost { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.45); }
    .btn-white { background: #fff; color: var(--accent); }
    .btn-wghost { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.5); }
    .btn-outline { background: transparent; color: var(--primary); border: 2px solid var(--primary); }

    .svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .svc-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 32px 28px; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; position: relative; overflow: hidden; display: block; color: inherit; }
    .svc-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform 0.3s; }
    .svc-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: var(--accent); }
    .svc-card:hover::after { transform: scaleX(1); }
    .svc-icon { font-size: 30px; margin-bottom: 16px; }
    .svc-card h3 { font-family: var(--head); font-size: 20px; color: var(--dark); margin-bottom: 10px; letter-spacing: 0.02em; }
    .svc-card p { font-size: 14px; color: var(--mid); line-height: 1.65; font-weight: 300; }
    .svc-card .svc-link { display: inline-flex; align-items: center; gap: 4px; margin-top: 12px; font-size: 13px; font-weight: 700; color: var(--accent); }

    .cta-band { background: var(--accent); padding: 80px 64px; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 48px; }
    .cta-band h2 { font-family: var(--head); font-size: clamp(28px, 4vw, 52px); color: #fff; line-height: 1.05; }
    .cta-band p { font-size: 17px; color: rgba(255,255,255,0.8); margin-top: 8px; font-weight: 300; }
    .cta-btns { display: flex; gap: 14px; flex-shrink: 0; flex-wrap: wrap; }

    footer { background: #111; padding: 36px 64px; }
    .foot-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .foot-logo { font-family: var(--head); font-size: 20px; color: #fff; letter-spacing: 0.03em; }
    .foot-copy { font-size: 13px; color: rgba(255,255,255,0.35); }
    .foot-links { display: flex; gap: 20px; flex-wrap: wrap; }
    .foot-links a { font-size: 13px; color: rgba(255,255,255,0.45); transition: color 0.2s; }
    .foot-links a:hover { color: #fff; }

    @media (max-width: 900px) {
      nav { padding: 0 20px; }
      .nav-links { display: none; position: fixed; top: var(--nav-h); left: 0; right: 0; background: var(--primary); flex-direction: column; padding: 24px 20px; gap: 20px; z-index: 199; }
      .nav-links.open { display: flex; }
      #hamburger { display: flex; }
      .nav-dropdown-menu { position: static; transform: none; box-shadow: none; padding: 0 0 0 16px; margin-top: 8px; background: transparent; }
      .nav-dropdown-menu a { color: rgba(255,255,255,0.75) !important; padding: 6px 0; }
      .sec { padding: 60px 24px; }
      .svc-grid { grid-template-columns: 1fr; }
      .cta-band { grid-template-columns: 1fr; padding: 56px 24px; gap: 24px; }
      footer { padding: 28px 24px; }
      .foot-inner { flex-direction: column; text-align: center; }
      .foot-links { justify-content: center; }
    }
  `;
}

function nav(servicePages, currentPath) {
  const { businessName, phone, city, state, subdomain } = config;
  const phoneRaw = phone.replace(/\D/g, '');
  const base = '/' + subdomain;

  return `
<nav>
  <a href="${base}/" class="nav-logo">${businessName}</a>
  <ul class="nav-links" id="nav-links">
    <li><a href="${base}/" ${currentPath === '/' ? 'style="color:#fff;"' : ''}>Home</a></li>
    <li class="nav-dropdown">
      <a href="${base}/services/" ${currentPath.startsWith('/services') ? 'style="color:#fff;"' : ''}>Services</a>
      <div class="nav-dropdown-menu">
        ${servicePages.map(sp => `<a href="${base}/services/${sp.slug}/">${sp.icon} ${sp.name}</a>`).join('')}
      </div>
    </li>
    <li><a href="${base}/about/" ${currentPath === '/about/' ? 'style="color:#fff;"' : ''}>About</a></li>
    <li><a href="${base}/blog/" ${currentPath === '/blog/' ? 'style="color:#fff;"' : ''}>Blog</a></li>
    <li><a href="${base}/contact/" ${currentPath === '/contact/' ? 'style="color:#fff;"' : ''}>Contact</a></li>
    <li><a href="tel:${phoneRaw}" class="nav-cta">Call Now</a></li>
  </ul>
  <button id="hamburger" onclick="document.getElementById('nav-links').classList.toggle('open')" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>`;
}

function footer(servicePages) {
  const { businessName, city, state, subdomain } = config;
  const base = '/' + subdomain;
  const year = new Date().getFullYear();

  return `
<footer>
  <div class="foot-inner">
    <div class="foot-logo">${businessName}</div>
    <span class="foot-copy">© ${year} ${businessName} · ${city}, ${state}</span>
    <div class="foot-links">
      <a href="${base}/">Home</a>
      <a href="${base}/services/">Services</a>
      ${servicePages.map(sp => `<a href="${base}/services/${sp.slug}/">${sp.name}</a>`).join('')}
      <a href="${base}/about/">About</a>
      <a href="${base}/blog/">Blog</a>
      <a href="${base}/contact/">Contact</a>
    </div>
  </div>
</footer>`;
}

function localBusinessSchema() {
  const { businessName, phone, city, state, industry, subdomain } = config;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessName,
    "telephone": phone,
    "address": { "@type": "PostalAddress", "addressLocality": city, "addressRegion": state, "addressCountry": "US" },
    "url": 'https://' + subdomain + '.exsisto.ai',
    "priceRange": "$$",
  });
}

function wrap(title, metaDesc, canonicalPath, bodyContent, theme, servicePages, extraSchema = '') {
  const { subdomain } = config;
  const canonical = 'https://' + subdomain + '.exsisto.ai' + canonicalPath;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:url" content="${canonical}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="${theme.primary}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${theme.fontUrl}" rel="stylesheet">
  <script type="application/ld+json">${localBusinessSchema()}</script>
  ${extraSchema ? '<script type="application/ld+json">' + extraSchema + '</script>' : ''}
  <style>${sharedCSS(theme)}</style>
</head>
<body>
${nav(servicePages, canonicalPath)}
${bodyContent}
${footer(servicePages)}
</body>
</html>`;
}

// ── Page builders ─────────────────────────────────────────────────────────────

function buildHomePage(content, imageUrls, blogPosts, servicePages, theme) {
  const { businessName, phone, city, state, subdomain } = config;
  const phoneRaw = phone.replace(/\D/g, '');
  const base = '/' + subdomain;

  const svcHTML = content.services.map(s => {
    const sl = slug(s.name);
    return `
    <a href="${base}/services/${sl}/" class="svc-card">
      <div class="svc-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.description}</p>
      <span class="svc-link">Learn more →</span>
    </a>`;
  }).join('');

  const blogPreviewHTML = blogPosts.slice(0, 3).map(p => `
    <a href="${base}/blog/${p.slug}/" style="background:#fff;border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;display:block;transition:transform 0.25s,box-shadow 0.25s;color:inherit;">
      <div style="padding:24px;">
        <div style="font-size:11px;color:var(--light);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
        <h3 style="font-family:var(--head);font-size:20px;color:var(--dark);margin-bottom:10px;line-height:1.25;">${p.title}</h3>
        <p style="font-size:14px;color:var(--mid);line-height:1.65;font-weight:300;">${p.excerpt}</p>
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-top:14px;">Read More →</div>
      </div>
    </a>`).join('');

  const body = `
  <!-- Hero -->
  <section style="position:relative;min-height:calc(100vh - var(--nav-h));display:flex;align-items:center;overflow:hidden;">
    <div style="position:absolute;inset:0;"><img src="${imageUrls['hero'] || ''}" alt="${businessName}" style="height:100%;filter:brightness(0.42);"></div>
    <div style="position:relative;z-index:2;padding:80px 64px;max-width:760px;">
      <div style="display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;">
        <span style="display:block;width:28px;height:2px;background:var(--accent);"></span>${city}, ${state}
      </div>
      <h1 style="font-family:var(--head);font-size:clamp(44px,7vw,88px);color:#fff;line-height:1.05;letter-spacing:0.01em;margin-bottom:20px;">${content.heroHeadline}</h1>
      <p style="font-size:18px;color:rgba(255,255,255,0.78);font-weight:300;max-width:520px;margin-bottom:36px;line-height:1.7;">${content.heroSub}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <a href="tel:${phoneRaw}" class="btn btn-accent">📞 ${phone}</a>
        <a href="${base}/services/" class="btn btn-ghost">Our Services</a>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;z-index:3;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);display:grid;grid-template-columns:repeat(3,1fr);">
      ${content.promiseBadges.map(b => `<div style="padding:18px 24px;border-right:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:12px;"><span style="font-size:14px;font-weight:600;color:#fff;">✓ ${b}</span></div>`).join('')}
    </div>
  </section>

  <!-- Stats -->
  <div style="background:var(--primary);display:grid;grid-template-columns:repeat(4,1fr);">
    ${[content.stat1,content.stat2,content.stat3,content.stat4].map(s => `<div style="padding:32px 20px;text-align:center;border-right:1px solid rgba(255,255,255,0.12);"><div style="font-family:var(--head);font-size:clamp(32px,4vw,50px);color:var(--accent);letter-spacing:0.03em;">${s.number}</div><div style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">${s.label}</div></div>`).join('')}
  </div>

  <!-- Services -->
  <section class="sec sec-off">
    <div class="sec-hdr"><p class="sec-tag">What We Do</p><h2 class="sec-title sec-title-dark">Our Services</h2><p class="sec-body">Everything you need, done right.</p></div>
    <div class="svc-grid">${svcHTML}</div>
  </section>

  <!-- About split -->
  <div style="display:grid;grid-template-columns:1fr 1fr;min-height:520px;">
    <div style="overflow:hidden;"><img src="${imageUrls['about'] || ''}" alt="About ${businessName}" style="height:100%;min-height:520px;"></div>
    <div style="background:var(--dark);padding:80px 60px;display:flex;flex-direction:column;justify-content:center;">
      <p class="sec-tag">Who We Are</p>
      <h2 class="sec-title sec-title-light">${content.aboutTitle}</h2>
      <p class="sec-body sec-body-light">${content.aboutBody}</p>
      <div style="margin:24px 0;display:flex;flex-direction:column;gap:12px;">
        ${content.promiseBadges.map(b => `<div style="display:flex;align-items:center;gap:10px;font-size:15px;color:rgba(255,255,255,0.65);"><span style="width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;"></span>${b}</div>`).join('')}
      </div>
      <a href="${base}/about/" class="btn btn-accent" style="width:fit-content;margin-top:8px;">Learn More</a>
    </div>
  </div>

  <!-- Gallery -->
  ${imageUrls['img3'] ? `
  <div style="display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:260px 220px;gap:10px;">
    <div style="grid-row:span 2;overflow:hidden;"><img src="${imageUrls['img3']}" alt="Gallery 1" style="height:100%;"></div>
    <div style="overflow:hidden;"><img src="${imageUrls['img4'] || imageUrls['img3']}" alt="Gallery 2" style="height:100%;"></div>
    <div style="overflow:hidden;"><img src="${imageUrls['img5'] || imageUrls['img3']}" alt="Gallery 3" style="height:100%;"></div>
    ${imageUrls['img6'] ? `<div style="overflow:hidden;"><img src="${imageUrls['img6']}" alt="Gallery 4" style="height:100%;"></div>` : ''}
    ${imageUrls['img7'] ? `<div style="overflow:hidden;"><img src="${imageUrls['img7']}" alt="Gallery 5" style="height:100%;"></div>` : ''}
  </div>` : ''}

  <!-- Process -->
  <section class="sec sec-dark">
    <div class="sec-hdr"><p class="sec-tag">How It Works</p><h2 class="sec-title sec-title-light">Simple Process</h2></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
      ${content.processSteps.map((s,i) => `
      <div style="text-align:center;padding:24px;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--accent);color:#fff;font-family:var(--head);font-size:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">${i+1}</div>
        <h3 style="font-family:var(--head);font-size:22px;color:#fff;letter-spacing:0.02em;margin-bottom:8px;">${s.title}</h3>
        <p style="font-size:14px;color:rgba(255,255,255,0.6);font-weight:300;line-height:1.65;">${s.desc}</p>
      </div>`).join('')}
    </div>
  </section>

  <!-- Google Reviews -->
  <section class="sec sec-off" style="text-align:center;">
    <div class="sec-hdr"><p class="sec-tag">Reviews</p><h2 class="sec-title sec-title-dark">What Customers Say</h2><p class="sec-body" style="margin:0 auto 40px;">We let our Google reviews speak for us.</p></div>
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid var(--border);border-radius:var(--r-lg);padding:40px 48px;box-shadow:var(--shadow);">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;font-size:26px;font-weight:700;">
        <span style="color:#4285F4;">G</span><span style="color:#EA4335;">o</span><span style="color:#FBBC05;">o</span><span style="color:#4285F4;">g</span><span style="color:#34A853;">l</span><span style="color:#EA4335;">e</span>
        <span style="font-size:16px;color:#555;font-weight:500;">Reviews</span>
      </div>
      <div style="font-family:var(--head);font-size:72px;color:var(--dark);line-height:1;">${content.stat4.number.replace('★','')}</div>
      <div style="color:#FBBC05;font-size:26px;letter-spacing:3px;margin:8px 0;">★★★★★</div>
      <div style="font-size:14px;color:var(--light);margin-bottom:24px;">Verified Google reviews</div>
      <a href="https://www.google.com/maps/search/${encodeURIComponent(businessName + ' ' + city + ' ' + state)}" target="_blank" class="btn btn-primary" style="width:100%;justify-content:center;">Read Our Google Reviews →</a>
      <p style="font-size:12px;color:var(--light);margin-top:14px;font-style:italic;">We never post or solicit fake reviews.</p>
    </div>
  </section>

  ${blogPosts.length > 0 ? `
  <section class="sec">
    <div class="sec-hdr"><p class="sec-tag">Our Blog</p><h2 class="sec-title sec-title-dark">Latest Articles</h2></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">${blogPreviewHTML}</div>
    <div style="text-align:center;margin-top:32px;"><a href="${base}/blog/" class="btn btn-outline">View All Posts →</a></div>
  </section>` : ''}

  <div class="cta-band">
    <div><h2>${content.ctaHeadline}</h2><p>${content.ctaBody}</p></div>
    <div class="cta-btns">
      <a href="tel:${phoneRaw}" class="btn btn-white">📞 ${phone}</a>
      <a href="${base}/contact/" class="btn btn-wghost">Get a Quote</a>
    </div>
  </div>`;

  return wrap(content.metaTitle, content.metaDescription, '/' + subdomain + '/', body, theme, servicePages);
}

function buildServiceOverviewPage(content, servicePages, theme) {
  const { businessName, phone, city, state, subdomain } = config;
  const phoneRaw = phone.replace(/\D/g, '');
  const base = '/' + subdomain;

  const svcHTML = content.services.map(s => {
    const sl = slug(s.name);
    return `
    <a href="${base}/services/${sl}/" class="svc-card">
      <div class="svc-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.description}</p>
      <span class="svc-link">Learn more →</span>
    </a>`;
  }).join('');

  const body = `
  <section class="sec sec-off" style="padding-top:80px;">
    <div class="sec-hdr">
      <p class="sec-tag">What We Offer</p>
      <h2 class="sec-title sec-title-dark">Our Services in ${city}, ${state}</h2>
      <p class="sec-body">Professional service for every need. Click any service to learn more.</p>
    </div>
    <div class="svc-grid">${svcHTML}</div>
  </section>
  <div class="cta-band">
    <div><h2>Ready to Get Started?</h2><p>Call us today for a free estimate in ${city}, ${state}.</p></div>
    <div class="cta-btns">
      <a href="tel:${phoneRaw}" class="btn btn-white">📞 ${phone}</a>
      <a href="${base}/contact/" class="btn btn-wghost">Get a Quote</a>
    </div>
  </div>`;

  const metaTitle = businessName + ' Services | ' + city + ', ' + state;
  const metaDesc  = businessName + ' offers professional services in ' + city + ', ' + state + '. Call ' + phone + ' for a free estimate.';
  return wrap(metaTitle, metaDesc, '/' + subdomain + '/services/', body, theme, servicePages);
}

function buildServicePage(sp, allServicePages, content, theme) {
  const { businessName, phone, city, state, subdomain } = config;
  const phoneRaw = phone.replace(/\D/g, '');
  const base = '/' + subdomain;

  const otherServices = allServicePages.filter(s => s.slug !== sp.slug).slice(0, 4);

  // Parse FAQ
  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (sp.faq || []).map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  });

  const serviceSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": sp.name,
    "provider": { "@type": "LocalBusiness", "name": businessName },
    "areaServed": city + ', ' + state,
    "description": sp.intro,
  });

  const body = `
  <section class="sec sec-off" style="padding-top:80px;">
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:56px;align-items:start;">
      <div>
        <p class="sec-tag">${sp.icon} ${sp.name}</p>
        <h1 class="sec-title sec-title-dark">${sp.headline}</h1>
        <p style="font-size:18px;color:var(--mid);line-height:1.75;font-weight:300;margin-bottom:36px;">${sp.intro}</p>

        <h2 style="font-family:var(--head);font-size:28px;color:var(--dark);margin-bottom:14px;letter-spacing:0.02em;">${sp.body1Title}</h2>
        <p style="font-size:16px;color:var(--mid);line-height:1.8;font-weight:300;margin-bottom:32px;">${sp.body1}</p>

        <h2 style="font-family:var(--head);font-size:28px;color:var(--dark);margin-bottom:14px;letter-spacing:0.02em;">${sp.body2Title}</h2>
        <p style="font-size:16px;color:var(--mid);line-height:1.8;font-weight:300;margin-bottom:32px;">${sp.body2}</p>

        <h2 style="font-family:var(--head);font-size:28px;color:var(--dark);margin-bottom:14px;letter-spacing:0.02em;">${sp.body3Title}</h2>
        <p style="font-size:16px;color:var(--mid);line-height:1.8;font-weight:300;margin-bottom:40px;">${sp.body3}</p>

        ${sp.faq && sp.faq.length > 0 ? `
        <h2 style="font-family:var(--head);font-size:32px;color:var(--dark);margin-bottom:24px;letter-spacing:0.02em;">${sp.faqTitle || 'Frequently Asked Questions'}</h2>
        ${sp.faq.map(f => `
        <div style="border:1px solid var(--border);border-radius:var(--r);margin-bottom:16px;overflow:hidden;">
          <div style="padding:18px 20px;font-weight:600;font-size:16px;color:var(--dark);background:var(--bg);">${f.q}</div>
          <div style="padding:16px 20px;font-size:15px;color:var(--mid);line-height:1.7;font-weight:300;">${f.a}</div>
        </div>`).join('')}` : ''}
      </div>

      <div style="position:sticky;top:88px;display:flex;flex-direction:column;gap:20px;">
        <div style="background:var(--dark);border-radius:var(--r-lg);padding:32px 28px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">Get Started Today</p>
          <h3 style="font-family:var(--head);font-size:26px;color:#fff;margin-bottom:14px;line-height:1.1;">${sp.cta}</h3>
          <a href="tel:${phoneRaw}" class="btn btn-accent" style="width:100%;justify-content:center;margin-bottom:12px;">📞 ${phone}</a>
          <a href="${base}/contact/" class="btn" style="width:100%;justify-content:center;background:transparent;border:1.5px solid rgba(255,255,255,0.25);color:#fff;font-weight:600;">Get a Free Quote</a>
        </div>

        ${otherServices.length > 0 ? `
        <div style="background:var(--bg);border-radius:var(--r-lg);padding:24px;">
          <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mid);margin-bottom:14px;">Other Services</p>
          ${otherServices.map(os => `
          <a href="${base}/services/${os.slug}/" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;color:var(--dark);font-weight:500;text-decoration:none;">
            <span>${os.icon}</span><span>${os.name}</span><span style="margin-left:auto;color:var(--light);">→</span>
          </a>`).join('')}
        </div>` : ''}
      </div>
    </div>
  </section>

  <div class="cta-band">
    <div><h2>${sp.cta}</h2><p>Same-day service available. Serving ${city}, ${state} and surrounding areas.</p></div>
    <div class="cta-btns">
      <a href="tel:${phoneRaw}" class="btn btn-white">📞 ${phone}</a>
      <a href="${base}/contact/" class="btn btn-wghost">Get a Quote</a>
    </div>
  </div>`;

  return wrap(sp.metaTitle, sp.metaDescription, '/' + subdomain + '/services/' + sp.slug + '/', body, theme, allServicePages, faqSchema + '\n' + serviceSchema);
}

function buildAboutPage(content, imageUrls, servicePages, theme) {
  const { businessName, phone, city, state, subdomain } = config;
  const phoneRaw = phone.replace(/\D/g, '');
  const base = '/' + subdomain;

  const body = `
  <div style="display:grid;grid-template-columns:1fr 1fr;min-height:560px;">
    <div style="overflow:hidden;"><img src="${imageUrls['about'] || ''}" alt="About ${businessName}" style="height:100%;min-height:560px;"></div>
    <div style="background:var(--dark);padding:88px 64px;display:flex;flex-direction:column;justify-content:center;">
      <p class="sec-tag">Our Story</p>
      <h1 class="sec-title sec-title-light">${content.aboutTitle}</h1>
      <p class="sec-body sec-body-light">${content.aboutBody}</p>
      <div style="margin:28px 0;display:flex;flex-direction:column;gap:14px;">
        ${content.promiseBadges.map(b => `<div style="display:flex;align-items:center;gap:12px;font-size:15px;color:rgba(255,255,255,0.65);"><span style="width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;"></span>${b}</div>`).join('')}
      </div>
    </div>
  </div>
  <section class="sec sec-dark">
    <div class="sec-hdr"><p class="sec-tag">How It Works</p><h2 class="sec-title sec-title-light">Our Process</h2></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
      ${content.processSteps.map((s,i) => `
      <div style="text-align:center;padding:24px;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--accent);color:#fff;font-family:var(--head);font-size:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">${i+1}</div>
        <h3 style="font-family:var(--head);font-size:22px;color:#fff;margin-bottom:8px;">${s.title}</h3>
        <p style="font-size:14px;color:rgba(255,255,255,0.6);font-weight:300;line-height:1.65;">${s.desc}</p>
      </div>`).join('')}
    </div>
  </section>
  <div class="cta-band">
    <div><h2>Get In Touch Today</h2><p>We'd love to learn more about what you need.</p></div>
    <div class="cta-btns">
      <a href="tel:${phoneRaw}" class="btn btn-white">📞 ${phone}</a>
      <a href="${base}/contact/" class="btn btn-wghost">Contact Us</a>
    </div>
  </div>`;

  const metaTitle = 'About ' + businessName + ' | ' + city + ', ' + state;
  const metaDesc  = 'Learn about ' + businessName + ', serving ' + city + ', ' + state + '. ' + content.aboutBody.slice(0, 100) + '...';
  return wrap(metaTitle, metaDesc, '/' + subdomain + '/about/', body, theme, servicePages);
}

function buildBlogIndex(blogPosts, servicePages, theme) {
  const { businessName, city, state, subdomain } = config;
  const base = '/' + subdomain;

  const postsHTML = blogPosts.map(p => `
    <a href="${base}/blog/${p.slug}/" style="background:#fff;border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;display:block;transition:transform 0.25s,box-shadow 0.25s;color:inherit;">
      <div style="padding:28px;">
        <div style="font-size:11px;color:var(--light);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
        <h2 style="font-family:var(--head);font-size:24px;color:var(--dark);margin-bottom:12px;line-height:1.2;">${p.title}</h2>
        <p style="font-size:15px;color:var(--mid);line-height:1.7;font-weight:300;margin-bottom:16px;">${p.excerpt}</p>
        <div style="font-size:13px;font-weight:700;color:var(--accent);">Read Article →</div>
      </div>
    </a>`).join('');

  const body = `
  <section class="sec sec-off" style="padding-top:80px;">
    <div class="sec-hdr">
      <p class="sec-tag">Our Blog</p>
      <h1 class="sec-title sec-title-dark">Articles &amp; Tips from ${businessName}</h1>
      <p class="sec-body">Helpful advice and insights from the team in ${city}, ${state}.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;">${postsHTML}</div>
  </section>`;

  const metaTitle = businessName + ' Blog | ' + city + ', ' + state;
  const metaDesc  = 'Tips, advice, and insights from ' + businessName + ' in ' + city + ', ' + state + '.';
  return wrap(metaTitle, metaDesc, '/' + subdomain + '/blog/', body, theme, servicePages);
}

function buildBlogPost(post, allPosts, servicePages, theme) {
  const { businessName, city, state, subdomain } = config;
  const base = '/' + subdomain;

  // Convert markdown ## headings to styled h2s
  const bodyHTML = post.body
    .split('\n\n')
    .map(para => {
      if (para.startsWith('## ')) return '<h2 style="font-family:var(--head);font-size:28px;color:var(--dark);margin:32px 0 14px;letter-spacing:0.02em;">' + para.slice(3) + '</h2>';
      if (para.startsWith('# '))  return '<h1 style="font-family:var(--head);font-size:36px;color:var(--dark);margin-bottom:14px;">' + para.slice(2) + '</h1>';
      return '<p style="font-size:17px;color:var(--mid);line-height:1.85;font-weight:300;margin-bottom:20px;">' + para + '</p>';
    }).join('');

  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": { "@type": "Organization", "name": businessName },
    "publisher": { "@type": "Organization", "name": businessName },
    "datePublished": new Date().toISOString().split('T')[0],
    "mainEntityOfPage": { "@type": "WebPage", "@id": 'https://' + subdomain + '.exsisto.ai/blog/' + post.slug + '/' },
  });

  const relatedPosts = allPosts.filter(p => p.slug !== post.slug).slice(0, 2);

  const body = `
  <section class="sec sec-off" style="padding-top:80px;">
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:56px;align-items:start;max-width:1100px;margin:0 auto;">
      <article>
        <div style="font-size:12px;color:var(--light);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})} · ${businessName}</div>
        <h1 style="font-family:var(--head);font-size:clamp(28px,4vw,48px);color:var(--dark);line-height:1.1;margin-bottom:24px;letter-spacing:0.01em;">${post.title}</h1>
        <p style="font-size:18px;color:var(--mid);line-height:1.7;font-weight:300;margin-bottom:36px;border-left:3px solid var(--accent);padding-left:20px;">${post.excerpt}</p>
        <div>${bodyHTML}</div>
      </article>

      <div style="position:sticky;top:88px;display:flex;flex-direction:column;gap:20px;">
        <div style="background:var(--dark);border-radius:var(--r-lg);padding:28px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">Need Help?</p>
          <p style="font-size:15px;color:rgba(255,255,255,0.75);font-weight:300;line-height:1.6;margin-bottom:16px;">${businessName} is here to help in ${city}, ${state}.</p>
          <a href="${base}/contact/" class="btn btn-accent" style="width:100%;justify-content:center;">Get a Free Quote</a>
        </div>
        ${relatedPosts.length > 0 ? `
        <div style="background:var(--bg);border-radius:var(--r-lg);padding:24px;">
          <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mid);margin-bottom:14px;">More Articles</p>
          ${relatedPosts.map(rp => `<a href="${base}/blog/${rp.slug}/" style="display:block;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;color:var(--dark);font-weight:500;line-height:1.4;">${rp.title}</a>`).join('')}
        </div>` : ''}
      </div>
    </div>
  </section>`;

  return wrap(post.metaTitle || post.title, post.metaDescription || post.excerpt, '/' + subdomain + '/blog/' + post.slug + '/', body, theme, servicePages, articleSchema);
}

function buildContactPage(content, servicePages, theme) {
  const { businessName, phone, email, city, state, subdomain } = config;
  const phoneRaw = phone.replace(/\D/g, '');
  const base = '/' + subdomain;

  const body = `
  <div style="display:grid;grid-template-columns:1fr 1fr;min-height:560px;">
    <div style="background:var(--dark);padding:88px 56px;display:flex;flex-direction:column;justify-content:center;">
      <p class="sec-tag">Reach Us</p>
      <h1 class="sec-title sec-title-light">${content.ctaHeadline}</h1>
      <div style="margin-top:40px;display:flex;flex-direction:column;gap:26px;">
        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:var(--r);background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px;">📞</div>
          <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.4);margin-bottom:3px;">Phone</div><div style="font-size:16px;color:#fff;">${phone}</div></div>
        </div>
        ${email ? `<div style="display:flex;gap:16px;align-items:flex-start;"><div style="width:44px;height:44px;border-radius:var(--r);background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px;">✉️</div><div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.4);margin-bottom:3px;">Email</div><div style="font-size:16px;color:#fff;">${email}</div></div></div>` : ''}
        <div style="display:flex;gap:16px;align-items:flex-start;"><div style="width:44px;height:44px;border-radius:var(--r);background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px;">📍</div><div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.4);margin-bottom:3px;">Location</div><div style="font-size:16px;color:#fff;">${city}, ${state}</div></div></div>
        <div style="display:flex;gap:16px;align-items:flex-start;"><div style="width:44px;height:44px;border-radius:var(--r);background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px;">🕐</div><div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.4);margin-bottom:3px;">Hours</div><div style="font-size:16px;color:#fff;">Mon–Fri: 8am–6pm<br>Sat: 9am–3pm</div></div></div>
      </div>
    </div>
    <div style="padding:88px 56px;background:var(--bg);">
      <p class="sec-tag">Send a Message</p>
      <h2 class="sec-title sec-title-dark" style="margin-bottom:28px;">Get In Touch</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div style="margin-bottom:18px;"><label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mid);margin-bottom:5px;">First Name</label><input type="text" placeholder="John" style="width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:var(--r);font-size:15px;"></div>
        <div style="margin-bottom:18px;"><label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mid);margin-bottom:5px;">Last Name</label><input type="text" placeholder="Smith" style="width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:var(--r);font-size:15px;"></div>
      </div>
      <div style="margin-bottom:18px;"><label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mid);margin-bottom:5px;">Email</label><input type="email" placeholder="john@email.com" style="width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:var(--r);font-size:15px;"></div>
      <div style="margin-bottom:18px;"><label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mid);margin-bottom:5px;">Phone</label><input type="tel" placeholder="${phone}" style="width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:var(--r);font-size:15px;"></div>
      <div style="margin-bottom:18px;"><label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mid);margin-bottom:5px;">How Can We Help?</label><textarea placeholder="Tell us about your project..." style="width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:var(--r);font-size:15px;min-height:110px;resize:vertical;font-family:inherit;"></textarea></div>
      <button onclick="this.textContent='✅ Sent!';this.style.background='#16a34a';this.disabled=true;" style="width:100%;padding:14px;background:var(--primary);color:#fff;border:none;border-radius:var(--r);font-size:15px;font-weight:700;cursor:pointer;">Send Message</button>
    </div>
  </div>`;

  const metaTitle = 'Contact ' + businessName + ' | ' + city + ', ' + state;
  const metaDesc  = 'Contact ' + businessName + ' in ' + city + ', ' + state + '. Call ' + phone + ' or send us a message for a free estimate.';
  return wrap(metaTitle, metaDesc, '/' + subdomain + '/contact/', body, theme, servicePages);
}

// ── Sitemap + robots ──────────────────────────────────────────────────────────
function buildSitemap(servicePages, blogPosts) {
  const { subdomain } = config;
  const base = 'https://' + subdomain + '.exsisto.ai';
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: base + '/',           priority: '1.0', freq: 'weekly' },
    { loc: base + '/about/',     priority: '0.7', freq: 'monthly' },
    { loc: base + '/services/',  priority: '0.9', freq: 'weekly' },
    { loc: base + '/blog/',      priority: '0.8', freq: 'weekly' },
    { loc: base + '/contact/',   priority: '0.7', freq: 'monthly' },
    ...servicePages.map(sp => ({ loc: base + '/services/' + sp.slug + '/', priority: '0.9', freq: 'monthly' })),
    ...blogPosts.map(p  => ({ loc: base + '/blog/' + p.slug + '/',         priority: '0.8', freq: 'monthly' })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

function buildRobots() {
  const { subdomain } = config;
  return `User-agent: *
Allow: /
Sitemap: https://${subdomain}.exsisto.ai/sitemap.xml`;
}

// ── Write files ───────────────────────────────────────────────────────────────
async function writeFile(dir, filename, content) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), content, 'utf8');
}

// ── Git push ──────────────────────────────────────────────────────────────────
function gitPush(subdomain) {
  const root = path.join(__dirname, '..');
  const opts = { cwd: root };
  execSync('git config user.name "Exsisto Bot"', opts);
  execSync('git config user.email "bot@exsisto.ai"', opts);
  execSync('git add public/sites/' + subdomain + '/', opts);
  try {
    execSync('git commit -m "Build site: ' + subdomain + '"', opts);
    execSync('git pull --rebase && git push', opts);
    console.log('✅ Pushed to GitHub');
  } catch (e) {
    if (e.message.includes('nothing to commit')) {
      console.log('Nothing new to commit');
    } else throw e;
  }
}

// ── Supabase notifications ────────────────────────────────────────────────────
async function notifySupabase() {
  if (!config.businessId || !config.supabaseUrl) return;
  const res = await fetch(config.supabaseUrl + '/rest/v1/websites?business_id=eq.' + config.businessId, {
    method: 'PATCH',
    headers: { 'apikey': config.supabaseKey, 'Authorization': 'Bearer ' + config.supabaseKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ status: 'admin_review', site_url: 'https://' + config.subdomain + '.exsisto.ai', built_at: new Date().toISOString() }),
  });
  if (res.ok) console.log('✅ Supabase: status → admin_review');
}

async function saveBlogPosts(posts) {
  if (!config.businessId || !config.supabaseUrl) return;
  for (const p of posts) {
    await fetch(config.supabaseUrl + '/rest/v1/blog_posts', {
      method: 'POST',
      headers: { 'apikey': config.supabaseKey, 'Authorization': 'Bearer ' + config.supabaseKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ business_id: config.businessId, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.body, meta_description: p.metaDescription, post_status: 'draft', created_at: new Date().toISOString() }),
    });
  }
  console.log('✅ ' + posts.length + ' blog posts saved to Supabase');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Exsisto Site Generator');
  console.log('   Business : ' + config.businessName);
  console.log('   Plan     : ' + config.plan + ' (' + imageCount + ' images, ' + blogCount + ' blog posts)');
  console.log('   Template : ' + config.template);
  console.log('   Subdomain: ' + config.subdomain + '\n');

  const outBase = path.join(__dirname, '..', 'public', 'sites', config.subdomain);
  const theme   = getTheme();

  // 1. Generate images
  const imagePrompts = buildImagePrompts();
  console.log('📸 Generating ' + imagePrompts.length + ' images via Nano Banana...\n');
  const imageUrls = {};
  for (const { slot, prompt } of imagePrompts) {
    try {
      console.log('  [' + slot + '] Generating...');
      const img = await generateImage(prompt);
      imageUrls[slot] = await uploadImage(img.base64, img.mimeType, slot);
      console.log('  ✅ ' + slot + ' → Supabase');
      await sleep(1500);
    } catch (e) {
      console.warn('  ⚠️  ' + slot + ' failed: ' + e.message);
      imageUrls[slot] = '';
    }
  }

  // 2. Generate site copy
  console.log('\n✍️  Generating site copy...');
  const content = await generateContent();
  console.log('  ✅ Copy generated');

  // 3. Generate individual service pages
  console.log('\n📄 Generating ' + content.services.length + ' service pages...');
  const servicePages = [];
  for (const svc of content.services) {
    try {
      const sp = await generateServicePage(svc);
      servicePages.push(sp);
      console.log('  ✅ ' + svc.name);
      await sleep(800);
    } catch (e) {
      console.warn('  ⚠️  ' + svc.name + ' failed: ' + e.message);
    }
  }

  // 4. Generate blog posts
  console.log('\n📝 Generating ' + blogCount + ' blog posts...');
  const topics = BLOG_TOPICS[config.industry] || BLOG_TOPICS['auto'];
  const blogPosts = [];
  for (let i = 0; i < blogCount; i++) {
    try {
      const post = await generateBlogPost(topics[i % topics.length]);
      blogPosts.push(post);
      console.log('  ✅ "' + post.title + '"');
      await sleep(1000);
    } catch (e) {
      console.warn('  ⚠️  Blog post ' + (i+1) + ' failed: ' + e.message);
    }
  }

  // 5. Write all pages
  console.log('\n🔧 Writing static pages...');

  await writeFile(outBase,                                       'index.html',   buildHomePage(content, imageUrls, blogPosts, servicePages, theme));
  await writeFile(path.join(outBase, 'about'),                   'index.html',   buildAboutPage(content, imageUrls, servicePages, theme));
  await writeFile(path.join(outBase, 'services'),                'index.html',   buildServiceOverviewPage(content, servicePages, theme));
  await writeFile(path.join(outBase, 'contact'),                 'index.html',   buildContactPage(content, servicePages, theme));
  await writeFile(path.join(outBase, 'blog'),                    'index.html',   buildBlogIndex(blogPosts, servicePages, theme));
  for (const sp of servicePages) {
    await writeFile(path.join(outBase, 'services', sp.slug),     'index.html',   buildServicePage(sp, servicePages, content, theme));
  }
  for (const p of blogPosts) {
    await writeFile(path.join(outBase, 'blog', p.slug),          'index.html',   buildBlogPost(p, blogPosts, servicePages, theme));
  }
  await writeFile(outBase, 'sitemap.xml', buildSitemap(servicePages, blogPosts));
  await writeFile(outBase, 'robots.txt',  buildRobots());

  const pageCount = 5 + servicePages.length + blogPosts.length;
  console.log('  ✅ ' + pageCount + ' pages written');
  console.log('  ✅ sitemap.xml');
  console.log('  ✅ robots.txt');

  // 6. Save blog posts to Supabase
  await saveBlogPosts(blogPosts);

  // 7. Git push
  console.log('\n📤 Pushing to GitHub...');
  gitPush(config.subdomain);

  // 8. Notify Supabase
  await notifySupabase();

  console.log('\n🎉 Done!');
  console.log('   Pages: ' + pageCount);
  console.log('   Sitemap: https://' + config.subdomain + '.exsisto.ai/sitemap.xml\n');
}

main().catch(err => { console.error('\n❌ Build failed:', err); process.exit(1); });

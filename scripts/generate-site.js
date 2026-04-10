#!/usr/bin/env node
/**
 * generate-site.js
 * Exsisto.ai — Full client site generator
 *
 * Pipeline:
 *  1. Generate N images via Nano Banana (5/8/12 by plan)
 *  2. Upload each to Supabase Storage
 *  3. Generate all copy via Claude
 *  4. Generate N blog posts via Claude
 *  5. Assemble single HTML file from chosen template
 *  6. Write to public/sites/{subdomain}/index.html
 *  7. Push to GitHub → Vercel auto-deploys
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
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

// ── Image counts by plan ─────────────────────────────────────────────────────
const IMAGE_COUNTS = { starter: 5, pro: 8, premium: 12 };
const imageCount = IMAGE_COUNTS[config.plan] || 5;

// ── Blog post counts by plan ─────────────────────────────────────────────────
const BLOG_COUNTS = { starter: 1, pro: 2, premium: 4 };
const blogCount = BLOG_COUNTS[config.plan] || 1;

const STORAGE_BUCKET = 'industry-images';
const MODEL_IMAGE = 'gemini-3.1-flash-image-preview';

// ── Image prompts per industry (12 slots) ───────────────────────────────────
function buildImagePrompts() {
  const { businessName, industry, city, state } = config;
  const loc = `${city}, ${state}`;
  const q = `photorealistic photograph, no text, no signs, no UI, no watermark, professional photography`;

  const prompts = {
    auto: [
      `Exterior of a clean modern auto repair shop at golden hour, cars parked outside, dramatic sky, ${loc} — ${q}`,
      `Organized service bay interior with a vehicle on a lift, epoxy floors, bright overhead lighting, no people — ${q}`,
      `Close-up of a mechanic's hands using professional tools on a car engine, clean uniform — ${q}`,
      `Wide shot of modern automotive service center exterior, multiple bays visible, daytime — ${q}`,
      `Gleaming customer car freshly repaired, parked outside a professional shop — ${q}`,
      `Mechanic in uniform smiling next to a repaired vehicle, natural light — ${q}`,
      `Tire rotation and wheel alignment equipment in a clean shop — ${q}`,
      `Front desk service advisor reviewing work order with customer, professional setting — ${q}`,
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
      `Master bedroom, staged beautifully, natural light — ${q}`,
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

  const industryPrompts = prompts[industry] || prompts['auto'];
  return industryPrompts.slice(0, imageCount).map((prompt, i) => ({
    slot: i === 0 ? 'hero' : i === 1 ? 'about' : `img${i + 1}`,
    index: i,
    prompt,
  }));
}

// ── Nano Banana image generation ─────────────────────────────────────────────
async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_IMAGE}:generateContent?key=${config.geminiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['image', 'text'] },
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
      }
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
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

// ── Supabase upload ───────────────────────────────────────────────────────────
async function uploadImage(base64, mimeType, slot) {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const storagePath = `client-sites/${config.subdomain}/${slot}.${ext}`;
  const buffer = Buffer.from(base64, 'base64');
  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.supabaseKey}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload ${res.status}: ${err}`);
  }

  return `${config.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}

// ── Claude copy generation ────────────────────────────────────────────────────
async function generateContent(imageUrls) {
  const anthropic = new Anthropic({ apiKey: config.anthropicKey });
  const servicesList = config.services.length > 0
    ? config.services.join(', ')
    : `professional ${config.industry} services`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are a professional copywriter creating a complete website for a small business.
Business:
- Name: ${config.businessName}
- Industry: ${config.industry}
- Location: ${config.city}, ${config.state}
- Phone: ${config.phone}
- Tagline: ${config.tagline || 'Professional service you can trust'}
- Services: ${servicesList}

Return ONLY valid JSON, no markdown, no backticks:
{
  "heroHeadline": "Bold 4-7 word headline",
  "heroSub": "1-2 sentence value proposition, local feel",
  "aboutTitle": "3-5 word about section title",
  "aboutBody": "3 sentences: history, mission, what makes them different. Local and authentic.",
  "services": [
    {"name": "service name", "description": "one sentence", "icon": "single emoji"},
    {"name": "service name", "description": "one sentence", "icon": "single emoji"},
    {"name": "service name", "description": "one sentence", "icon": "single emoji"},
    {"name": "service name", "description": "one sentence", "icon": "single emoji"},
    {"name": "service name", "description": "one sentence", "icon": "single emoji"},
    {"name": "service name", "description": "one sentence", "icon": "single emoji"}
  ],
  "stat1": {"number": "e.g. 500+", "label": "e.g. Happy Customers"},
  "stat2": {"number": "e.g. 18+", "label": "e.g. Years Experience"},
  "stat3": {"number": "e.g. 98%", "label": "e.g. Satisfaction Rate"},
  "stat4": {"number": "e.g. 4.9★", "label": "e.g. Google Rating"},
  "ctaHeadline": "5-7 word call to action",
  "ctaBody": "One urgent, value-driven sentence",
  "processSteps": [
    {"title": "2-3 word step", "desc": "one sentence"},
    {"title": "2-3 word step", "desc": "one sentence"},
    {"title": "2-3 word step", "desc": "one sentence"}
  ],
  "promiseBadges": ["3-5 word trust signal", "3-5 word trust signal", "3-5 word trust signal"],
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 155 chars"
}
Use actual services provided. Make it feel local to ${config.city}, ${config.state}.`,
    }],
  });

  const raw = msg.content[0].text.trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim();
  return JSON.parse(raw);
}

// ── Blog post generation ──────────────────────────────────────────────────────
const BLOG_TOPICS = {
  auto:        ['5 signs your car needs immediate attention', 'how to choose a trustworthy auto shop', 'seasonal car care guide', 'the real cost of skipping oil changes'],
  dental:      ['how often should you really visit the dentist', 'cosmetic dentistry options explained', 'tips for whiter teeth at home', 'what to expect at your first dental visit'],
  law:         ['what to do after a car accident', 'how to find the right attorney for your case', 'understanding personal injury compensation', 'common legal mistakes to avoid'],
  restaurant:  ['our farm-to-table sourcing story', 'the story behind our signature dish', 'wine pairing guide for beginners', 'behind the scenes in our kitchen'],
  salon:       ['how to maintain your hair color between appointments', 'the best haircuts for your face shape', 'professional vs drugstore hair products', 'seasonal hair trends this year'],
  gym:         ['beginner guide to starting a workout routine', 'nutrition tips to complement your training', 'how to stay motivated at the gym', 'the benefits of personal training'],
  hvac:        ['how to lower your energy bill this summer', 'signs your AC needs servicing', 'how often to replace air filters', 'preparing your HVAC for winter'],
  plumbing:    ['signs you have a hidden water leak', 'how to prevent frozen pipes', 'when to call a plumber vs DIY', 'how to maintain your water heater'],
  realestate:  ['tips for first-time homebuyers in your market', 'how to price your home to sell fast', 'what home improvements add the most value', 'understanding the closing process'],
  pet:         ['how often should you groom your dog', 'grooming tips between professional visits', 'signs your pet needs a professional groomer', 'choosing the right groomer for your pet'],
  landscaping: ['spring lawn care checklist', 'how to choose the right plants for your yard', 'low maintenance landscaping ideas', 'the benefits of professional lawn care'],
  bakery:      ['the story behind our sourdough recipe', 'how to store artisan bread', 'custom cake ordering guide', 'seasonal flavors and what inspires them'],
};

async function generateBlogPost(topic, index) {
  const anthropic = new Anthropic({ apiKey: config.anthropicKey });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Write a blog post for a local small business. Return ONLY valid JSON, no markdown.

Business: ${config.businessName}
Industry: ${config.industry}
Location: ${config.city}, ${config.state}
Topic: ${topic}

Return:
{
  "title": "SEO blog title specific to this business and location",
  "slug": "url-friendly-slug",
  "excerpt": "2-3 sentence summary for previews",
  "body": "Full blog post 500-700 words. Professional, helpful tone. Use paragraph breaks. Include business name and location naturally. End with a call to action mentioning ${config.phone}.",
  "metaDescription": "SEO meta description under 155 chars"
}`,
    }],
  });

  const raw = msg.content[0].text.trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim();
  return JSON.parse(raw);
}

// ── HTML assembly ─────────────────────────────────────────────────────────────
function buildHTML(content, imageUrls, blogPosts) {
  const { businessName, phone, email, city, state, primaryColor, accentColor, template, isDemo, subdomain } = config;
  const phoneRaw = phone.replace(/\D/g, '');
  const year = new Date().getFullYear();

  // Pick template colors/fonts
  const themes = {
    'skeleton-clean': {
      primary: '#1352cc', accent: '#00c4b4', bg: '#f7f9ff', dark: '#0d1b3e',
      headFont: 'Playfair Display', bodyFont: 'DM Sans',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap',
    },
    'skeleton-bold': {
      primary: '#1a1a1a', accent: '#e85d26', bg: '#f5f5f5', dark: '#111',
      headFont: 'Bebas Neue', bodyFont: 'Barlow',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap',
    },
    'skeleton-warm': {
      primary: '#0d1f3c', accent: '#b8973a', bg: '#fdfbf7', dark: '#070f1e',
      headFont: 'Cormorant Garamond', bodyFont: 'Inter',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap',
    },
  };

  const theme = themes[template] || themes['skeleton-clean'];

  // Use customer colors if provided, otherwise use template defaults
  const finalPrimary = config.primaryColor !== '#4648d4' ? config.primaryColor : theme.primary;
  const finalAccent  = config.accentColor  !== '#6366f1' ? config.accentColor  : theme.accent;

  const img = (slot) => imageUrls[slot] || '';

  const servicesHTML = content.services.map(s => `
    <div class="svc-card">
      <div class="svc-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.description}</p>
    </div>`).join('');

  const stepsHTML = content.processSteps.map((s, i) => `
    <div class="step">
      <div class="step-num">${i + 1}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>`).join('');

  const badgesHTML = content.promiseBadges.map(b => `<div class="badge">✓ ${b}</div>`).join('');

  const blogPreviewHTML = blogPosts.slice(0, 3).map(p => `
    <div class="blog-card" onclick="showPage('blog')">
      <div class="blog-card-body">
        <div class="blog-date">${new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}</div>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <div class="blog-read">Read More →</div>
      </div>
    </div>`).join('');

  const blogFullHTML = blogPosts.map(p => `
    <article class="blog-article" id="post-${p.slug}">
      <h2>${p.title}</h2>
      <div class="blog-meta">${new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})} · ${config.businessName}</div>
      <div class="blog-body">${p.body.split('\n\n').map(para => `<p>${para}</p>`).join('')}</div>
    </article>`).join('<hr class="blog-divider">');

  const demoBar = isDemo ? `
  <div id="demo-bar">
    ✦ Demo site — images generated by Nano Banana AI ·
    <a href="https://exsisto.ai" target="_blank">Get your real site at Exsisto.ai →</a>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.metaTitle}</title>
  <meta name="description" content="${content.metaDescription}">
  <meta property="og:title" content="${content.metaTitle}">
  <meta property="og:description" content="${content.metaDescription}">
  <meta name="theme-color" content="${finalPrimary}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${theme.fontUrl}" rel="stylesheet">
  <style>
    :root {
      --primary: ${finalPrimary};
      --accent:  ${finalAccent};
      --bg:      ${theme.bg};
      --dark:    ${theme.dark};
      --mid:     #555;
      --light:   #888;
      --border:  #e5e5e5;
      --white:   #fff;
      --r:       8px;
      --r-lg:    16px;
      --shadow:  0 4px 24px rgba(0,0,0,0.09);
      --nav-h:   68px;
      --head:    '${theme.headFont}', Georgia, serif;
      --body:    '${theme.bodyFont}', sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--body); color: var(--dark); background: #fff; overflow-x: hidden; line-height: 1.6; }
    img { display: block; width: 100%; object-fit: cover; }
    a { color: inherit; text-decoration: none; }
    #demo-bar { background: var(--accent); color: #fff; text-align: center; padding: 9px 16px; font-size: 13px; font-weight: 600; }
    #demo-bar a { color: #fff; text-decoration: underline; opacity: 0.85; }

    /* Nav */
    nav { position: sticky; top: 0; z-index: 200; height: var(--nav-h); background: var(--primary); display: flex; align-items: center; justify-content: space-between; padding: 0 48px; box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
    .nav-logo { font-family: var(--head); font-size: 22px; color: #fff; letter-spacing: 0.03em; }
    .nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
    .nav-links a { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.06em; transition: color 0.2s; }
    .nav-links a:hover { color: #fff; }
    .nav-cta { background: var(--accent) !important; color: #fff !important; padding: 10px 20px; border-radius: var(--r); font-weight: 700 !important; }
    #hamburger { display: none; background: none; border: none; cursor: pointer; flex-direction: column; gap: 5px; }
    #hamburger span { display: block; width: 22px; height: 2px; background: #fff; }

    /* Pages */
    .page { display: none; }
    .page.active { display: block; }

    /* Hero */
    #hero { position: relative; min-height: calc(100vh - var(--nav-h)); display: flex; align-items: center; overflow: hidden; }
    .hero-bg { position: absolute; inset: 0; }
    .hero-bg img { height: 100%; filter: brightness(0.42); animation: hzoom 16s ease-in-out infinite alternate; }
    @keyframes hzoom { from { transform: scale(1); } to { transform: scale(1.06); } }
    .hero-content { position: relative; z-index: 2; padding: 80px 64px; max-width: 760px; animation: fadeUp 0.8s ease both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
    .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 20px; }
    .hero-eyebrow::before { content: ''; display: block; width: 28px; height: 2px; background: var(--accent); }
    .hero-content h1 { font-family: var(--head); font-size: clamp(44px, 7vw, 88px); color: #fff; line-height: 1.05; letter-spacing: 0.01em; margin-bottom: 20px; }
    .hero-sub { font-size: 18px; color: rgba(255,255,255,0.78); font-weight: 300; max-width: 520px; margin-bottom: 36px; line-height: 1.7; }
    .hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: var(--r); font-family: var(--body); font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: transform 0.18s, background 0.18s; }
    .btn:hover { transform: translateY(-2px); }
    .btn-accent { background: var(--accent); color: #fff; }
    .btn-ghost { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.45); }
    .btn-ghost:hover { border-color: #fff; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-white { background: #fff; color: var(--accent); }
    .btn-wghost { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.5); }

    /* Trust bar */
    .trust-bar { background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); position: absolute; bottom: 0; left: 0; right: 0; z-index: 3; display: grid; grid-template-columns: repeat(3, 1fr); }
    .trust-item { padding: 18px 24px; display: flex; align-items: center; gap: 12px; border-right: 1px solid rgba(255,255,255,0.1); }
    .trust-item:last-child { border-right: none; }
    .trust-icon { font-size: 20px; }
    .trust-label { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; }
    .trust-val { font-family: var(--head); font-size: 17px; color: #fff; }

    /* Stats */
    .stats-bar { background: var(--primary); display: grid; grid-template-columns: repeat(4, 1fr); }
    .stat-cell { padding: 32px 20px; text-align: center; border-right: 1px solid rgba(255,255,255,0.12); }
    .stat-cell:last-child { border-right: none; }
    .stat-num { font-family: var(--head); font-size: clamp(32px, 4vw, 50px); color: var(--accent); letter-spacing: 0.03em; }
    .stat-lbl { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }

    /* Section base */
    .sec { padding: 88px 64px; }
    .sec-off { background: var(--bg); }
    .sec-dark { background: var(--dark); }
    .sec-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
    .sec-title { font-family: var(--head); font-size: clamp(28px, 4.5vw, 54px); line-height: 1.08; letter-spacing: 0.01em; margin-bottom: 14px; }
    .sec-title-light { color: #fff; }
    .sec-title-dark { color: var(--dark); }
    .sec-body { font-size: 17px; color: var(--mid); max-width: 560px; line-height: 1.75; font-weight: 300; }
    .sec-body-light { color: rgba(255,255,255,0.65); }
    .sec-hdr { margin-bottom: 52px; }

    /* Services */
    .svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .svc-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 32px 28px; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; position: relative; overflow: hidden; }
    .svc-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform 0.3s; }
    .svc-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: var(--accent); }
    .svc-card:hover::after { transform: scaleX(1); }
    .svc-icon { font-size: 30px; margin-bottom: 16px; }
    .svc-card h3 { font-family: var(--head); font-size: 20px; color: var(--dark); margin-bottom: 10px; letter-spacing: 0.02em; }
    .svc-card p { font-size: 14px; color: var(--mid); line-height: 1.65; font-weight: 300; }

    /* About split */
    .about-split { display: grid; grid-template-columns: 1fr 1fr; padding: 0; min-height: 520px; }
    .about-img { overflow: hidden; }
    .about-img img { height: 100%; }
    .about-text { background: var(--dark); padding: 80px 60px; display: flex; flex-direction: column; justify-content: center; }
    .about-list { margin: 24px 0; display: flex; flex-direction: column; gap: 14px; }
    .about-item { display: flex; align-items: flex-start; gap: 12px; font-size: 15px; color: rgba(255,255,255,0.65); font-weight: 300; }
    .about-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 8px; }
    .about-item strong { color: #fff; font-weight: 600; }

    /* Gallery */
    .gallery-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 260px 220px; gap: 10px; }
    .gal-item { overflow: hidden; border-radius: var(--r); position: relative; }
    .gal-item.tall { grid-row: span 2; }
    .gal-item img { height: 100%; transition: transform 0.45s; }
    .gal-item:hover img { transform: scale(1.05); }

    /* Process */
    .process-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .step { text-align: center; padding: 32px 24px; }
    .step-num { width: 52px; height: 52px; border-radius: 50%; background: var(--accent); color: #fff; font-family: var(--head); font-size: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
    .step h3 { font-family: var(--head); font-size: 22px; color: var(--dark); letter-spacing: 0.02em; margin-bottom: 8px; }
    .step p { font-size: 14px; color: var(--mid); font-weight: 300; line-height: 1.65; }

    /* Badges */
    .badges { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
    .badge { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 100px; }

    /* Reviews */
    .reviews-card { max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid var(--border); border-radius: var(--r-lg); padding: 40px 48px; box-shadow: var(--shadow); text-align: center; }
    .g-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; font-size: 26px; font-weight: 700; }
    .g-b { color: #4285F4; } .g-r { color: #EA4335; } .g-y { color: #FBBC05; } .g-g { color: #34A853; }
    .reviews-num { font-family: var(--head); font-size: 72px; color: var(--dark); line-height: 1; }
    .reviews-stars { color: #FBBC05; font-size: 26px; letter-spacing: 3px; margin: 8px 0; }
    .reviews-count { font-size: 14px; color: var(--light); margin-bottom: 24px; }
    .reviews-note { font-size: 12px; color: var(--light); margin-top: 14px; font-style: italic; }

    /* Blog */
    .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .blog-card { background: #fff; border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; cursor: pointer; transition: transform 0.25s, box-shadow 0.25s; }
    .blog-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
    .blog-card-body { padding: 24px; }
    .blog-date { font-size: 11px; color: var(--light); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .blog-card h3 { font-family: var(--head); font-size: 20px; color: var(--dark); margin-bottom: 10px; line-height: 1.25; }
    .blog-card p { font-size: 14px; color: var(--mid); line-height: 1.65; font-weight: 300; }
    .blog-read { font-size: 13px; font-weight: 700; color: var(--accent); margin-top: 14px; }
    .blog-article { margin-bottom: 48px; }
    .blog-article h2 { font-family: var(--head); font-size: 36px; color: var(--dark); margin-bottom: 8px; }
    .blog-meta { font-size: 12px; color: var(--light); margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.08em; }
    .blog-body p { font-size: 16px; color: var(--mid); line-height: 1.8; margin-bottom: 18px; font-weight: 300; }
    .blog-divider { border: none; border-top: 1px solid var(--border); margin: 48px 0; }

    /* CTA band */
    .cta-band { background: var(--accent); padding: 80px 64px; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 48px; }
    .cta-band h2 { font-family: var(--head); font-size: clamp(28px, 4vw, 52px); color: #fff; line-height: 1.05; }
    .cta-band p { font-size: 17px; color: rgba(255,255,255,0.8); margin-top: 8px; font-weight: 300; }
    .cta-btns { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; min-width: 220px; }

    /* Contact */
    .contact-split { display: grid; grid-template-columns: 1fr 1fr; padding: 0; }
    .con-info { background: var(--dark); padding: 80px 56px; display: flex; flex-direction: column; justify-content: center; }
    .con-rows { margin-top: 36px; display: flex; flex-direction: column; gap: 24px; }
    .con-row { display: flex; gap: 16px; align-items: flex-start; }
    .con-icon { width: 42px; height: 42px; border-radius: var(--r); background: rgba(255,255,255,0.1); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; }
    .con-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
    .con-val { font-size: 16px; color: #fff; }
    .con-form { padding: 80px 56px; background: var(--bg); }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-grp { margin-bottom: 16px; }
    .form-grp label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mid); margin-bottom: 5px; }
    .form-grp input, .form-grp textarea, .form-grp select { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--r); font-family: var(--body); font-size: 15px; color: var(--dark); background: #fff; transition: border-color 0.2s; }
    .form-grp input:focus, .form-grp textarea:focus { outline: none; border-color: var(--primary); }
    .form-grp textarea { min-height: 110px; resize: vertical; }

    /* Footer */
    footer { background: #111; padding: 36px 64px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .foot-logo { font-family: var(--head); font-size: 20px; color: #fff; letter-spacing: 0.03em; }
    .foot-copy { font-size: 13px; color: rgba(255,255,255,0.35); }
    .foot-links { display: flex; gap: 20px; }
    .foot-links a { font-size: 13px; color: rgba(255,255,255,0.45); transition: color 0.2s; }
    .foot-links a:hover { color: #fff; }

    /* Mobile */
    @media (max-width: 900px) {
      nav { padding: 0 20px; }
      .nav-links { display: none; position: fixed; top: var(--nav-h); left: 0; right: 0; background: var(--primary); flex-direction: column; padding: 24px 20px; gap: 20px; z-index: 199; }
      .nav-links.open { display: flex; }
      #hamburger { display: flex; }
      .hero-content { padding: 56px 24px 240px; }
      .trust-bar { grid-template-columns: 1fr; }
      .trust-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .stats-bar { grid-template-columns: repeat(2, 1fr); }
      .stat-cell:nth-child(2) { border-right: none; }
      .svc-grid { grid-template-columns: 1fr; }
      .sec { padding: 60px 24px; }
      .about-split, .contact-split { grid-template-columns: 1fr; }
      .about-img { min-height: 300px; }
      .about-text, .con-info, .con-form { padding: 56px 24px; }
      .gallery-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
      .gal-item.tall { grid-row: auto; min-height: 220px; }
      .gal-item { min-height: 180px; }
      .process-grid { grid-template-columns: 1fr; }
      .blog-grid { grid-template-columns: 1fr; }
      .cta-band { grid-template-columns: 1fr; padding: 56px 24px; gap: 24px; }
      .cta-btns { min-width: unset; flex-direction: row; flex-wrap: wrap; }
      footer { padding: 28px 24px; flex-direction: column; text-align: center; }
      .foot-links { justify-content: center; }
    }
  </style>
</head>
<body>

${demoBar}

<nav>
  <div class="nav-logo">${businessName}</div>
  <ul class="nav-links" id="nav-links">
    <li><a href="#" onclick="showPage('home')">Home</a></li>
    <li><a href="#" onclick="showPage('services')">Services</a></li>
    <li><a href="#" onclick="showPage('about')">About</a></li>
    <li><a href="#" onclick="showPage('blog')">Blog</a></li>
    <li><a href="#" onclick="showPage('contact')">Contact</a></li>
    <li><a href="tel:${phoneRaw}" class="nav-cta">Call Now</a></li>
  </ul>
  <button id="hamburger" onclick="toggleMenu()"><span></span><span></span><span></span></button>
</nav>


<!-- ══ HOME ══════════════════════════════════════════════════════════════ -->
<div id="page-home" class="page active">

  <section id="hero">
    <div class="hero-bg"><img src="${img('hero')}" alt="${businessName}"></div>
    <div class="hero-content">
      <div class="hero-eyebrow">${city}, ${state}</div>
      <h1>${content.heroHeadline}</h1>
      <p class="hero-sub">${content.heroSub}</p>
      <div class="hero-btns">
        <a href="tel:${phoneRaw}" class="btn btn-accent">📞 ${phone}</a>
        <button class="btn btn-ghost" onclick="showPage('services')">Our Services</button>
      </div>
    </div>
    <div class="trust-bar">
      <div class="trust-item"><div class="trust-icon">⭐</div><div><div class="trust-label">Google Rating</div><div class="trust-val">${content.stat4.number}</div></div></div>
      <div class="trust-item"><div class="trust-icon">🏆</div><div><div class="trust-label">${content.stat2.label}</div><div class="trust-val">${content.stat2.number}</div></div></div>
      <div class="trust-item"><div class="trust-icon">✅</div><div><div class="trust-label">${content.promiseBadges[0]}</div><div class="trust-val">${content.stat3.number}</div></div></div>
    </div>
  </section>

  <div class="stats-bar">
    <div class="stat-cell"><div class="stat-num">${content.stat1.number}</div><div class="stat-lbl">${content.stat1.label}</div></div>
    <div class="stat-cell"><div class="stat-num">${content.stat2.number}</div><div class="stat-lbl">${content.stat2.label}</div></div>
    <div class="stat-cell"><div class="stat-num">${content.stat3.number}</div><div class="stat-lbl">${content.stat3.label}</div></div>
    <div class="stat-cell"><div class="stat-num">${content.stat4.number}</div><div class="stat-lbl">${content.stat4.label}</div></div>
  </div>

  <section class="sec sec-off">
    <div class="sec-hdr"><p class="sec-tag">What We Do</p><h2 class="sec-title sec-title-dark">Our Services</h2><p class="sec-body">Everything you need, done right.</p></div>
    <div class="svc-grid">${servicesHTML}</div>
  </section>

  <div class="about-split">
    <div class="about-img"><img src="${img('about')}" alt="About ${businessName}" style="height:100%;min-height:520px;"></div>
    <div class="about-text">
      <p class="sec-tag">Who We Are</p>
      <h2 class="sec-title sec-title-light">${content.aboutTitle}</h2>
      <p class="sec-body sec-body-light">${content.aboutBody}</p>
      <div class="about-list">
        ${content.promiseBadges.map(b => `<div class="about-item"><div class="about-dot"></div><span>${b}</span></div>`).join('')}
      </div>
      <button class="btn btn-accent" onclick="showPage('about')" style="margin-top:24px;width:fit-content;">Learn More</button>
    </div>
  </div>

  ${imageCount >= 5 ? `
  <section class="sec" style="padding-top:0;padding-bottom:0;">
    <div class="gallery-grid">
      <div class="gal-item tall"><img src="${img('img3')}" alt="Gallery 1" style="height:100%;min-height:480px;"></div>
      <div class="gal-item"><img src="${img('img4')}" alt="Gallery 2" style="height:100%;min-height:260px;"></div>
      <div class="gal-item"><img src="${img('img5')}" alt="Gallery 3" style="height:100%;min-height:260px;"></div>
      ${imageCount >= 8 ? `
      <div class="gal-item"><img src="${img('img6')}" alt="Gallery 4" style="height:100%;min-height:220px;"></div>
      <div class="gal-item"><img src="${img('img7')}" alt="Gallery 5" style="height:100%;min-height:220px;"></div>` : ''}
    </div>
  </section>` : ''}

  <section class="sec sec-dark">
    <div class="sec-hdr"><p class="sec-tag">How It Works</p><h2 class="sec-title sec-title-light">Simple Process</h2></div>
    <div class="process-grid">${stepsHTML}</div>
    <div class="badges">${badgesHTML}</div>
  </section>

  <section class="sec sec-off" style="text-align:center;">
    <div class="sec-hdr">
      <p class="sec-tag">Reviews</p>
      <h2 class="sec-title sec-title-dark">What Customers Say</h2>
      <p class="sec-body" style="margin:0 auto 40px;">We let our Google reviews do the talking.</p>
    </div>
    <div class="reviews-card">
      <div class="g-logo"><span class="g-b">G</span><span class="g-r">o</span><span class="g-y">o</span><span class="g-b">g</span><span class="g-g">l</span><span class="g-r">e</span> <span style="font-size:16px;color:#555;font-weight:500;">Reviews</span></div>
      <div class="reviews-num">${content.stat4.number.replace('★','')}</div>
      <div class="reviews-stars">★★★★★</div>
      <div class="reviews-count">Verified Google reviews</div>
      <p style="font-size:15px;color:var(--mid);margin-bottom:24px;font-weight:300;">Read what your neighbors say about us directly on Google.</p>
      <a href="https://www.google.com/maps/search/${encodeURIComponent(businessName + ' ' + city + ' ' + state)}" target="_blank" class="btn btn-primary" style="width:100%;justify-content:center;">Read Our Google Reviews →</a>
      <p class="reviews-note">We never post or solicit fake reviews.</p>
    </div>
  </section>

  ${blogPosts.length > 0 ? `
  <section class="sec">
    <div class="sec-hdr"><p class="sec-tag">Our Blog</p><h2 class="sec-title sec-title-dark">Latest Articles</h2></div>
    <div class="blog-grid">${blogPreviewHTML}</div>
  </section>` : ''}

  <div class="cta-band">
    <div><h2>${content.ctaHeadline}</h2><p>${content.ctaBody}</p></div>
    <div class="cta-btns">
      <a href="tel:${phoneRaw}" class="btn btn-white">📞 ${phone}</a>
      <button class="btn btn-wghost" onclick="showPage('contact')">Get a Quote</button>
    </div>
  </div>

</div><!-- /home -->


<!-- ══ SERVICES ══════════════════════════════════════════════════════════ -->
<div id="page-services" class="page">
  <section class="sec sec-off" style="padding-top:80px;">
    <div class="sec-hdr"><p class="sec-tag">What We Offer</p><h2 class="sec-title sec-title-dark">Our Services</h2><p class="sec-body">Professional service tailored to your needs in ${city}, ${state}.</p></div>
    <div class="svc-grid">${servicesHTML}</div>
  </section>
  ${imageCount >= 8 ? `
  <section class="sec" style="padding-top:0;padding-bottom:0;">
    <div class="gallery-grid">
      <div class="gal-item tall"><img src="${img('img6')}" alt="Service 1" style="height:100%;min-height:480px;"></div>
      <div class="gal-item"><img src="${img('img7')}" alt="Service 2" style="height:100%;min-height:260px;"></div>
      <div class="gal-item"><img src="${img('img8')}" alt="Service 3" style="height:100%;min-height:260px;"></div>
    </div>
  </section>` : ''}
  <div class="cta-band">
    <div><h2>Ready to Get Started?</h2><p>Call us today for a free estimate.</p></div>
    <div class="cta-btns">
      <a href="tel:${phoneRaw}" class="btn btn-white">📞 ${phone}</a>
      <button class="btn btn-wghost" onclick="showPage('contact')">Contact Us</button>
    </div>
  </div>
</div>


<!-- ══ ABOUT ══════════════════════════════════════════════════════════════ -->
<div id="page-about" class="page">
  <div class="about-split" style="min-height:560px;">
    <div class="about-img"><img src="${img('about')}" alt="About ${businessName}" style="height:100%;min-height:560px;"></div>
    <div class="about-text">
      <p class="sec-tag">Our Story</p>
      <h2 class="sec-title sec-title-light">${content.aboutTitle}</h2>
      <p class="sec-body sec-body-light">${content.aboutBody}</p>
      <div class="about-list">
        ${content.promiseBadges.map(b => `<div class="about-item"><div class="about-dot"></div><span>${b}</span></div>`).join('')}
      </div>
    </div>
  </div>
  ${imageCount >= 12 ? `
  <section class="sec sec-off">
    <div class="sec-hdr"><p class="sec-tag">Our Work</p><h2 class="sec-title sec-title-dark">See The Difference</h2></div>
    <div class="gallery-grid">
      <div class="gal-item tall"><img src="${img('img9')}" alt="Work 1" style="height:100%;min-height:480px;"></div>
      <div class="gal-item"><img src="${img('img10')}" alt="Work 2" style="height:100%;min-height:260px;"></div>
      <div class="gal-item"><img src="${img('img11')}" alt="Work 3" style="height:100%;min-height:260px;"></div>
      <div class="gal-item"><img src="${img('img12')}" alt="Work 4" style="height:100%;min-height:220px;"></div>
      <div class="gal-item"><img src="${img('img6')}" alt="Work 5" style="height:100%;min-height:220px;"></div>
    </div>
  </section>` : ''}
  <section class="sec sec-dark">
    <div class="sec-hdr"><p class="sec-tag">Our Process</p><h2 class="sec-title sec-title-light">How We Work</h2></div>
    <div class="process-grid">${stepsHTML}</div>
  </section>
</div>


<!-- ══ BLOG ══════════════════════════════════════════════════════════════ -->
<div id="page-blog" class="page">
  <section class="sec" style="padding-top:80px;">
    <div class="sec-hdr"><p class="sec-tag">Our Blog</p><h2 class="sec-title sec-title-dark">Articles &amp; Tips</h2><p class="sec-body">Helpful advice from the team at ${businessName}.</p></div>
    ${blogFullHTML}
  </section>
</div>


<!-- ══ CONTACT ═══════════════════════════════════════════════════════════ -->
<div id="page-contact" class="page">
  <div class="contact-split">
    <div class="con-info">
      <p class="sec-tag">Reach Us</p>
      <h2 class="sec-title sec-title-light">${content.ctaHeadline}</h2>
      <div class="con-rows">
        <div class="con-row"><div class="con-icon">📞</div><div><div class="con-lbl">Phone</div><div class="con-val">${phone}</div></div></div>
        ${email ? `<div class="con-row"><div class="con-icon">✉️</div><div><div class="con-lbl">Email</div><div class="con-val">${email}</div></div></div>` : ''}
        <div class="con-row"><div class="con-icon">📍</div><div><div class="con-lbl">Location</div><div class="con-val">${city}, ${state}</div></div></div>
        <div class="con-row"><div class="con-icon">🕐</div><div><div class="con-lbl">Hours</div><div class="con-val">Mon–Fri: 8am–6pm<br>Sat: 9am–3pm</div></div></div>
      </div>
    </div>
    <div class="con-form">
      <p class="sec-tag">Send a Message</p>
      <h2 class="sec-title sec-title-dark" style="margin-bottom:28px;">Get In Touch</h2>
      <div class="form-row-2">
        <div class="form-grp"><label>First Name</label><input type="text" placeholder="John"></div>
        <div class="form-grp"><label>Last Name</label><input type="text" placeholder="Smith"></div>
      </div>
      <div class="form-grp"><label>Email</label><input type="email" placeholder="john@email.com"></div>
      <div class="form-grp"><label>Phone</label><input type="tel" placeholder="${phone}"></div>
      <div class="form-grp"><label>How Can We Help?</label><textarea placeholder="Tell us about your project..."></textarea></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="handleSubmit(this)">Send Message</button>
    </div>
  </div>
</div>

<footer>
  <div class="foot-logo">${businessName}</div>
  <span class="foot-copy">© ${year} ${businessName} · ${city}, ${state} · All rights reserved</span>
  <div class="foot-links">
    <a href="#" onclick="showPage('home')">Home</a>
    <a href="#" onclick="showPage('services')">Services</a>
    <a href="#" onclick="showPage('blog')">Blog</a>
    <a href="#" onclick="showPage('contact')">Contact</a>
  </div>
</footer>

<script>
  function showPage(n) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const p = document.getElementById('page-' + n);
    if (p) { p.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    document.getElementById('nav-links').classList.remove('open');
  }
  function toggleMenu() { document.getElementById('nav-links').classList.toggle('open'); }
  function handleSubmit(btn) {
    btn.textContent = '✅ Message Sent!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = 'Send Message'; btn.style.background = ''; btn.disabled = false; }, 4000);
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.svc-card, .blog-card, .step').forEach(el => {
    el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    io.observe(el);
  });
</script>
</body>
</html>`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Git push ─────────────────────────────────────────────────────────────────
function gitPush(subdomain) {
  execSync('git config user.name "Exsisto Bot"');
  execSync('git config user.email "bot@exsisto.ai"');
  execSync(`git add public/sites/${subdomain}/`);
  try {
    execSync(`git commit -m "🚀 Build site: ${subdomain}"`);
    execSync('git pull --rebase && git push');
    console.log('✅ Pushed to GitHub');
  } catch (e) {
    if (e.message.includes('nothing to commit')) {
      console.log('Nothing to commit — site unchanged');
    } else throw e;
  }
}

// ── Notify Supabase ──────────────────────────────────────────────────────────
async function notifySupabase(siteUrl) {
  if (!config.businessId || !config.supabaseUrl) return;
  const res = await fetch(`${config.supabaseUrl}/rest/v1/websites?business_id=eq.${config.businessId}`, {
    method: 'PATCH',
    headers: {
      'apikey': config.supabaseKey,
      'Authorization': `Bearer ${config.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      status: 'admin_review',
      site_url: siteUrl,
      built_at: new Date().toISOString(),
    }),
  });
  if (res.ok) console.log('✅ Supabase updated → status: admin_review');
  else console.warn('⚠️  Supabase update failed:', await res.text());
}

// ── Save blog posts to Supabase ───────────────────────────────────────────────
async function saveBlogPosts(posts) {
  if (!config.businessId || !config.supabaseUrl) return;
  for (const post of posts) {
    await fetch(`${config.supabaseUrl}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        business_id: config.businessId,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.body,
        meta_description: post.metaDescription,
        post_status: 'draft',
        created_at: new Date().toISOString(),
      }),
    });
  }
  console.log(`✅ ${posts.length} blog posts saved to Supabase (status: draft)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Exsisto Site Generator`);
  console.log(`   Business : ${config.businessName}`);
  console.log(`   Industry : ${config.industry}`);
  console.log(`   Plan     : ${config.plan} (${imageCount} images, ${blogCount} blog posts)`);
  console.log(`   Template : ${config.template}`);
  console.log(`   Subdomain: ${config.subdomain}\n`);

  // 1. Generate images
  const imagePrompts = buildImagePrompts();
  console.log(`📸 Generating ${imagePrompts.length} images via Nano Banana...\n`);

  const imageUrls = {};
  for (const { slot, prompt } of imagePrompts) {
    try {
      console.log(`  [${slot}] Generating...`);
      const img = await generateImage(prompt);
      const url = await uploadImage(img.base64, img.mimeType, slot);
      imageUrls[slot] = url;
      console.log(`  ✅ ${slot} → Supabase`);
      await sleep(1500);
    } catch (e) {
      console.warn(`  ⚠️  ${slot} failed: ${e.message}`);
      imageUrls[slot] = '';
    }
  }

  // 2. Generate copy
  console.log('\n✍️  Generating copy...');
  const content = await generateContent(imageUrls);
  console.log('  ✅ Copy generated');

  // 3. Generate blog posts
  console.log(`\n📝 Generating ${blogCount} blog posts...`);
  const topics = BLOG_TOPICS[config.industry] || BLOG_TOPICS['auto'];
  const blogPosts = [];
  for (let i = 0; i < blogCount; i++) {
    try {
      const post = await generateBlogPost(topics[i % topics.length], i);
      blogPosts.push(post);
      console.log(`  ✅ Post ${i + 1}: "${post.title}"`);
      await sleep(1000);
    } catch (e) {
      console.warn(`  ⚠️  Blog post ${i + 1} failed: ${e.message}`);
    }
  }

  // 4. Assemble HTML
  console.log('\n🔧 Assembling HTML...');
  const html = buildHTML(content, imageUrls, blogPosts);

  // 5. Write file
  const outDir = path.join(__dirname, '..', 'public', 'sites', config.subdomain);
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');
  await fs.writeFile(outFile, html, 'utf8');
  const sizeKB = Math.round((await fs.stat(outFile)).size / 1024);
  console.log(`\n✅ Site written: public/sites/${config.subdomain}/index.html (${sizeKB}KB)`);

  // 6. Save blog posts to Supabase
  await saveBlogPosts(blogPosts);

  // 7. Git push
  console.log('\n📤 Pushing to GitHub...');
  gitPush(config.subdomain);

  // 8. Notify Supabase
  const siteUrl = `https://${config.subdomain}.exsisto.ai`;
  await notifySupabase(siteUrl);

  console.log(`\n🎉 Done! Site ready for QA at: ${siteUrl}\n`);
}

main().catch(err => {
  console.error('\n❌ Build failed:', err);
  process.exit(1);
});

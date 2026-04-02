"use client";
import "./preview.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface AIContent {
  headline: string; tagline: string; subtext: string;
  services: string[];
  stat1: string; stat1Label: string;
  stat2: string; stat2Label: string;
}

interface SocialPost {
  platform: string;
  icon: string;
  content: string;
  likes: string;
  comments: string;
}

interface ContentSamples {
  blog: { title: string; excerpt: string; readTime: string; date: string; }[];
  social: SocialPost[];
}

const INDUSTRIES = [
  { id: "auto",        label: "Auto",           emoji: "🚗" },
  { id: "restaurant",  label: "Restaurant",     emoji: "🍝" },
  { id: "gym",         label: "Gym & Fitness",  emoji: "💪" },
  { id: "plumbing",    label: "Plumbing",       emoji: "🔧" },
  { id: "dental",      label: "Dental",         emoji: "🦷" },
  { id: "law",         label: "Law Firm",       emoji: "⚖️" },
  { id: "salon",       label: "Salon & Beauty", emoji: "✂️" },
  { id: "realestate",  label: "Real Estate",    emoji: "🏠" },
  { id: "pet",         label: "Pet Care",       emoji: "🐾" },
  { id: "hvac",        label: "HVAC",           emoji: "❄️" },
  { id: "bakery",      label: "Bakery",         emoji: "🥐" },
  { id: "landscaping", label: "Landscaping",    emoji: "🌿" },
  { id: "other",       label: "Other",          emoji: "✏️" },
];

const BUSINESS_TYPES: Record<string, string[]> = {
  auto:        ["Classic Car Restoration","Custom Paint & Body","Auto Detailing","Engine Rebuilding","European Import Specialist","Muscle Car Specialist","Vintage Motorcycle Restoration","Hot Rod Builder","Performance Tuning Shop","Auto Upholstery"],
  restaurant:  ["Italian Restaurant","Steakhouse","Family Diner","Sushi & Japanese","Mexican Restaurant","Pizza Parlor","Seafood Restaurant","Farm-to-Table Bistro","BBQ & Smokehouse","Fine Dining"],
  gym:         ["Personal Training Studio","CrossFit Gym","Yoga & Pilates Studio","Boxing & MMA Gym","Strength & Conditioning","Women's Fitness Studio","24-Hour Gym","Martial Arts School","Spin & Cycling Studio","Athletic Performance Center"],
  plumbing:    ["Emergency Plumber","Bathroom Remodeling","Water Heater Specialist","Drain Cleaning Service","Commercial Plumbing","Pipe Repair & Replacement","Sewer Line Specialist","Gas Line Services","Water Filtration","Green Plumbing Solutions"],
  dental:      ["General Dentistry","Cosmetic Dentistry","Pediatric Dentistry","Orthodontics & Braces","Dental Implants","Emergency Dental Care","Teeth Whitening Studio","Family Dental Practice","Oral Surgery","Sleep Dentistry"],
  law:         ["Personal Injury Law","Criminal Defense","Family Law & Divorce","Estate Planning","Business & Corporate Law","Immigration Law","Real Estate Law","Workers' Compensation","DUI Defense","Medical Malpractice"],
  salon:       ["Full-Service Hair Salon","Barbershop","Color & Highlights Studio","Bridal Hair Specialist","Natural & Curly Hair","Luxury Blowout Bar","Hair Extension Studio","Men's Grooming Lounge","Kids Hair Salon","Scalp & Hair Treatment"],
  realestate:  ["Residential Sales","Luxury Home Specialist","First-Time Buyer Agent","Property Management","Commercial Real Estate","Investment Properties","New Construction Specialist","Relocation Services","Vacation & Short-Term Rental","Land & Development"],
  pet:         ["Dog Grooming Salon","Pet Boarding","Dog Daycare","Dog Training","Mobile Pet Grooming","Cat Grooming","Veterinary Clinic","Pet Sitting Service","Exotic Animal Care","Aquatic & Reptile Specialist"],
  hvac:        ["AC Installation & Repair","Heating & Furnace","Emergency HVAC Service","Duct Cleaning","Commercial HVAC","Smart Home & Thermostats","Geothermal Systems","Air Quality & Purification","Boiler Specialist","HVAC Maintenance Plans"],
  bakery:      ["Artisan Bread Bakery","Custom Cake Studio","French Pastry Shop","Wedding Cake Specialist","Gluten-Free Bakery","Cupcake & Dessert Shop","Bagel Shop","Pie Shop","Cookie & Confections","Wholesale Bakery"],
  landscaping: ["Full-Service Landscaping","Lawn Maintenance","Landscape Design","Irrigation Systems","Tree Service & Removal","Hardscaping & Patios","Snow Removal","Commercial Landscaping","Garden Design","Organic Lawn Care"],
  other:       ["Retail Shop","Photography Studio","Tutoring & Education","Event Planning","Cleaning Service","Moving Company","Catering","Consulting","Childcare / Daycare","Specialty Service"],
};

const IMAGES: Record<string, string[]> = {
  auto:       ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/automotive/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/automotive/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/automotive/card2.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/automotive/card3.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/automotive/card4.png"],
  restaurant: ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  gym:        ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  plumbing:   ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/plumbing/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/plumbing/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/plumbing/card2.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/plumbing/card3.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/plumbing/card4.png"],
  dental:     ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  law:        ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  salon:      ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  realestate: ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  pet:        ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  hvac:       ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/hvac/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/hvac/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/hvac/card2.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/hvac/card3.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/hvac/card4.png"],
  bakery:     ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png"],
  landscaping:["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/landscaping/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/landscaping/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/landscaping/card2.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/landscaping/card3.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/landscaping/card4.png"],
  other:      ["https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/hero.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card1.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card2.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card3.png","https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/other/card4.png"],
};

const PLANS = [
  { id: "starter", name: "Starter", price: "$99", period: "/mo", images: 1,
    features: ["5-page website","1 AI image","2 blogs/mo","8 social posts/mo","On-page SEO"] },
  { id: "pro", name: "Pro", price: "$299", period: "/mo", images: 3, popular: true,
    features: ["Full Stitch AI template","3 AI images","4 blogs/mo","16 social posts/mo","Advanced SEO","Gallery + stats"] },
  { id: "premium", name: "Premium", price: "$599", period: "/mo", images: 6,
    features: ["Full Stitch AI template","6 AI images","8 blogs/mo","32 social posts/mo","Priority support","Before/after gallery"] },
];

// ─── SITE BUILDERS ────────────────────────────────────────────────────────────
const PLACEHOLDER_IMG_HTML = `<div style="width:100%;height:100%;min-height:500px;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e40af 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:rgba(255,255,255,0.9);font-family:Inter,sans-serif;text-align:center;padding:48px;"><div style="font-size:48px;margin-bottom:18px;">📸</div><div style="font-size:18px;font-weight:800;margin-bottom:10px;">Your Custom Photos Go Here</div></div>`;
const PLACEHOLDER_CARD = (n: number) => `<div style="width:100%;height:240px;background:linear-gradient(135deg,#1e1b4b ${n*12}%,#312e81 ${40+n*8}%,#1e40af 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.8);font-family:Inter,sans-serif;"><span style="font-size:12px;font-weight:700;">Photo ${n}</span></div>`;

function buildStarterSite(bizType: string, industry: string, city: string, phone: string, ai: AIContent): string {
  const imgs = IMAGES[industry] || [];
  const hero = imgs[0] || "";
  const heroEl = hero ? `<img src="${hero}" style="width:100%;height:100%;object-fit:cover;display:block;" />` : PLACEHOLDER_IMG_HTML;
  const svcs = ai.services.slice(0, 6);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;color:#111;background:#fff;}nav{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0;background:#fff;gap:12px;}.logo{font-size:15px;font-weight:900;flex-shrink:0;}.cta-btn{background:#111;color:#fff;padding:9px 16px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;flex-shrink:0;}.hero{position:relative;height:90vh;min-height:400px;overflow:hidden;background:#1a1a2e;}.hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.8) 100%);}.hero-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:32px 24px;}.tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin-bottom:12px;}h1{font-size:clamp(28px,7vw,52px);font-weight:900;color:#fff;line-height:1.05;letter-spacing:-1px;margin-bottom:14px;}.sub{font-size:clamp(13px,2.5vw,15px);color:rgba(255,255,255,0.75);line-height:1.7;margin-bottom:22px;}.btns{display:flex;gap:10px;flex-wrap:wrap;}.btn-w{background:#fff;color:#111;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:700;}.btn-g{border:2px solid rgba(255,255,255,0.4);color:#fff;padding:12px 16px;border-radius:8px;font-size:13px;font-weight:600;}.services{padding:40px 20px;background:#f9f9f9;}.sec-tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;}.sec-h{font-size:clamp(20px,5vw,28px);font-weight:800;letter-spacing:-0.5px;margin-bottom:24px;}.svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;}.svc{background:#fff;border-radius:10px;padding:18px;border:1px solid #f0f0f0;}.svc-dot{width:8px;height:8px;background:#111;border-radius:50%;margin-bottom:10px;}.svc-n{font-size:13px;font-weight:700;}.stats{display:grid;grid-template-columns:repeat(2,1fr);background:#111;}.stat{padding:22px 16px;text-align:center;border-right:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);}.stat-n{font-size:22px;font-weight:900;color:#fff;}.stat-l{font-size:9px;color:rgba(255,255,255,0.4);margin-top:4px;text-transform:uppercase;letter-spacing:1px;}.cta-sec{padding:36px 20px;}.cta-sec h2{font-size:clamp(18px,4vw,24px);font-weight:800;margin-bottom:16px;}.cta-ph{background:#111;color:#fff;padding:13px 24px;border-radius:8px;font-size:14px;font-weight:800;display:inline-block;}footer{padding:16px 20px;background:#f5f5f5;display:flex;justify-content:space-between;font-size:10px;color:#999;flex-wrap:wrap;gap:4px;}@media(min-width:640px){nav{padding:18px 48px;}.hero-content{padding:0 72px;justify-content:center;}.hero-overlay{background:linear-gradient(to right,rgba(0,0,0,0.80) 55%,rgba(0,0,0,0.1));}.stats{grid-template-columns:repeat(4,1fr);}.cta-sec{padding:52px 48px;display:flex;justify-content:space-between;align-items:center;}.cta-sec h2{margin-bottom:0;}.services{padding:64px 48px;}footer{padding:20px 48px;}}</style></head><body><nav><div class="logo">${bizType}</div><div class="cta-btn">${phone||"Call Us"}</div></nav><div class="hero"><div style="position:absolute;inset:0;">${heroEl}</div><div class="hero-overlay"></div><div class="hero-content"><div class="tag">${city} · ${bizType}</div><h1>${ai.headline}</h1><p class="sub">${ai.subtext}</p><div class="btns"><div class="btn-w">Get Free Estimate →</div><div class="btn-g">Our Services</div></div></div></div><section class="services"><div class="sec-tag">What We Offer</div><h2 class="sec-h">Our Services</h2><div class="svc-grid">${svcs.map(s=>`<div class="svc"><div class="svc-dot"></div><div class="svc-n">${s}</div></div>`).join("")}</div></section><div class="stats"><div class="stat"><div class="stat-n">${ai.stat1}</div><div class="stat-l">${ai.stat1Label}</div></div><div class="stat"><div class="stat-n">${ai.stat2}</div><div class="stat-l">${ai.stat2Label}</div></div><div class="stat"><div class="stat-n">4.9★</div><div class="stat-l">Rating</div></div><div class="stat"><div class="stat-n">Free</div><div class="stat-l">Estimates</div></div></div><section class="cta-sec"><h2>Ready to get started?</h2><div class="cta-ph">${phone||"Contact Us"}</div></section><footer><span>${bizType} · ${city}</span><span>Exsisto Starter · $99/mo</span></footer></body></html>`;
}

function buildProSite(bizType: string, industry: string, city: string, phone: string, ai: AIContent): string {
  const imgs = IMAGES[industry] || [];
  const [hero, card1, card2] = [imgs[0]||"", imgs[1]||imgs[0]||"", imgs[2]||imgs[0]||""];
  const hasImgs = imgs.length > 0;
  const heroEl = hasImgs ? `<img src="${hero}" style="width:100%;height:100%;object-fit:cover;min-height:300px;"/>` : PLACEHOLDER_IMG_HTML;
  const svcs = ai.services.slice(0, 6);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;color:#111;background:#fff;}nav{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0;background:#fff;gap:12px;}.logo{font-size:15px;font-weight:900;flex-shrink:0;}.nav-links{display:none;}.nav-links a{font-size:13px;font-weight:500;color:#666;text-decoration:none;}.cta-btn{background:#111;color:#fff;padding:9px 16px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;flex-shrink:0;}.hero{display:flex;flex-direction:column;}.hero-left{padding:36px 20px;display:flex;flex-direction:column;justify-content:center;order:2;}.tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:12px;}h1{font-size:clamp(26px,7vw,46px);font-weight:900;line-height:1.05;letter-spacing:-1px;margin-bottom:14px;}.sub{font-size:clamp(13px,2.5vw,15px);color:#555;line-height:1.8;margin-bottom:20px;}.stats-row{display:flex;flex-wrap:wrap;gap:16px;padding:14px 16px;background:#f9f9f9;border-radius:10px;margin-bottom:20px;}.stat-n{font-size:18px;font-weight:900;}.stat-l{font-size:9px;color:#999;margin-top:2px;text-transform:uppercase;letter-spacing:1px;}.btns{display:flex;gap:10px;flex-wrap:wrap;}.btn-d{background:#111;color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:700;}.btn-o{border:2px solid #e5e5e5;color:#333;padding:12px 16px;border-radius:8px;font-size:13px;font-weight:600;}.hero-right{position:relative;overflow:hidden;min-height:260px;order:1;}.hero-right img{width:100%;height:100%;object-fit:cover;min-height:260px;}.badge{position:absolute;bottom:16px;left:16px;background:rgba(255,255,255,0.95);padding:10px 14px;border-radius:10px;}.badge-n{font-size:16px;font-weight:900;}.badge-l{font-size:9px;color:#999;margin-top:2px;}.services{padding:40px 20px;background:#f9f9f9;}.sec-tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;}.sec-h{font-size:clamp(20px,5vw,28px);font-weight:800;letter-spacing:-0.5px;margin-bottom:22px;}.svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;}.svc{background:#fff;border-radius:10px;padding:18px;}.svc-dot{width:8px;height:8px;background:#111;border-radius:50%;margin-bottom:10px;}.svc-n{font-size:13px;font-weight:700;}.gallery{padding:36px 20px;}.gal-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;}.gal-grid img{width:100%;height:150px;object-fit:cover;border-radius:10px;background:#eee;display:block;}.cta-sec{background:#111;padding:36px 20px;}.cta-sec h2{font-size:clamp(18px,5vw,24px);font-weight:800;color:#fff;margin-bottom:16px;}.cta-ph{background:#fff;color:#111;padding:13px 22px;border-radius:8px;font-size:14px;font-weight:800;display:inline-block;}footer{padding:16px 20px;background:#f0f0f0;display:flex;justify-content:space-between;font-size:10px;color:#999;flex-wrap:wrap;gap:4px;}@media(min-width:700px){nav{padding:18px 56px;}.nav-links{display:flex;gap:24px;}.hero{display:grid;grid-template-columns:45% 55%;min-height:88vh;}.hero-left{padding:80px 56px;order:1;}.hero-right{order:2;}.stats-row{flex-wrap:nowrap;}.gallery{padding:64px 56px;}.gal-grid{grid-template-columns:2fr 1fr 1fr;}.gal-grid img{height:240px;}.cta-sec{padding:52px 56px;display:flex;justify-content:space-between;align-items:center;}.cta-sec h2{margin-bottom:0;}.services{padding:64px 56px;}footer{padding:20px 56px;}}</style></head><body><nav><div class="logo">${bizType}</div><div class="nav-links"><a href="#">Services</a><a href="#">Gallery</a><a href="#">About</a></div><div class="cta-btn">${phone||"Call Now"}</div></nav><div class="hero"><div class="hero-left"><div class="tag">${city}</div><h1>${ai.headline}</h1><p class="sub">${ai.subtext}</p><div class="stats-row"><div><div class="stat-n">${ai.stat1}</div><div class="stat-l">${ai.stat1Label}</div></div><div><div class="stat-n">${ai.stat2}</div><div class="stat-l">${ai.stat2Label}</div></div><div><div class="stat-n">4.9★</div><div class="stat-l">Rating</div></div></div><div class="btns"><div class="btn-d">Get Free Estimate →</div><div class="btn-o">View Our Work</div></div></div><div class="hero-right">${heroEl}<div class="badge"><div class="badge-n">★ 4.9</div><div class="badge-l">200+ Reviews</div></div></div></div><section class="services"><div class="sec-tag">What We Offer</div><h2 class="sec-h">Our Services</h2><div class="svc-grid">${svcs.map(s=>`<div class="svc"><div class="svc-dot"></div><div class="svc-n">${s}</div></div>`).join("")}</div></section><section class="gallery"><div class="sec-tag">Our Work</div><h2 class="sec-h">See the Results</h2><div class="gal-grid">${hasImgs?`<img src="${hero}"/><img src="${card1}"/><img src="${card2}"/>`:`${PLACEHOLDER_CARD(1)}${PLACEHOLDER_CARD(2)}${PLACEHOLDER_CARD(3)}`}</div></section><section class="cta-sec"><h2>Ready to get started?</h2><div class="cta-ph">${phone||"Contact Us"}</div></section><footer><span>${bizType} · ${city}</span><span>Exsisto Pro · $299/mo</span></footer></body></html>`;
}

function buildPremiumSite(bizType: string, industry: string, city: string, phone: string, ai: AIContent): string {
  const imgs = IMAGES[industry] || IMAGES["other"] || [];
  const [img1, img2, img3] = [imgs[0]||"", imgs[1]||imgs[0]||"", imgs[2]||imgs[0]||""];
  const svcs = ai.services.slice(0, 6);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;background:#0a0a14;color:#fff;}nav{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(10,10,20,0.96);gap:12px;}.logo{font-size:15px;font-weight:900;background:linear-gradient(135deg,#a78bfa,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;flex-shrink:0;}.nav-links{display:none;gap:28px;}.nav-links a{font-size:13px;color:rgba(255,255,255,0.5);text-decoration:none;}.nav-cta{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;padding:9px 16px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;flex-shrink:0;}.hero{display:flex;flex-direction:column;}.hero-left{padding:36px 20px;display:flex;flex-direction:column;justify-content:center;order:2;}.tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6366f1;margin-bottom:16px;display:flex;align-items:center;gap:6px;}.tag::before{content:'';width:14px;height:1px;background:#6366f1;}h1{font-size:clamp(26px,7vw,48px);font-weight:900;line-height:1.05;letter-spacing:-1px;margin-bottom:16px;background:linear-gradient(135deg,#fff 60%,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}.sub{font-size:clamp(13px,2.5vw,15px);color:rgba(255,255,255,0.6);line-height:1.8;margin-bottom:22px;}.stats{display:flex;flex-wrap:wrap;gap:16px;padding:16px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:22px;}.stat-n{font-size:18px;font-weight:900;color:#a78bfa;}.stat-l{font-size:9px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin-top:2px;}.btns{display:flex;gap:10px;flex-wrap:wrap;}.btn-p{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;padding:12px 22px;border-radius:8px;font-size:13px;font-weight:700;}.btn-s{border:1.5px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.8);padding:12px 16px;border-radius:8px;font-size:13px;}.hero-right{position:relative;overflow:hidden;min-height:260px;order:1;}.hero-right img{width:100%;height:100%;object-fit:cover;min-height:260px;}.services{padding:40px 20px;background:#0d0d1a;}.sec-eyebrow{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6366f1;margin-bottom:8px;}.sec-h{font-size:clamp(20px,5vw,28px);font-weight:800;letter-spacing:-0.5px;margin-bottom:22px;background:linear-gradient(135deg,#fff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}.svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;}.svc{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;}.svc-dot{width:26px;height:26px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:8px;margin-bottom:10px;}.svc-n{font-size:13px;font-weight:700;color:#fff;}.gallery{padding:36px 20px;background:#0a0a14;}.gal-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;}.gal-grid img{width:100%;height:140px;object-fit:cover;border-radius:10px;}.cta{padding:48px 20px;background:linear-gradient(135deg,#1e1b4b,#312e81);text-align:center;}.cta h2{font-size:clamp(22px,6vw,32px);font-weight:900;letter-spacing:-1px;margin-bottom:10px;}.cta p{font-size:14px;color:rgba(255,255,255,0.65);margin-bottom:22px;}.cta-btn{background:#fff;color:#312e81;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:800;display:inline-block;}footer{padding:16px 20px;background:#050509;display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.25);flex-wrap:wrap;gap:4px;}@media(min-width:700px){nav{padding:20px 56px;}.nav-links{display:flex;}.hero{display:grid;grid-template-columns:1fr 1fr;min-height:88vh;}.hero-left{padding:80px 56px;order:1;}.hero-right{order:2;}.gallery{padding:64px 56px;}.gal-grid{grid-template-columns:1fr 1fr 1fr;}.gal-grid img{height:220px;}.cta{padding:56px;}.services{padding:64px 56px;}footer{padding:22px 56px;}}</style></head><body><nav><div class="logo">${bizType}</div><div class="nav-links"><a href="#">Services</a><a href="#">Work</a><a href="#">About</a></div><div class="nav-cta">${phone||"Contact Us"}</div></nav><div class="hero"><div class="hero-left"><div class="tag">${city||"Your City"}</div><h1>${ai.headline}</h1><p class="sub">${ai.subtext}</p><div class="stats"><div><div class="stat-n">${ai.stat1}</div><div class="stat-l">${ai.stat1Label}</div></div><div><div class="stat-n">${ai.stat2}</div><div class="stat-l">${ai.stat2Label}</div></div><div><div class="stat-n">4.9★</div><div class="stat-l">Rating</div></div></div><div class="btns"><div class="btn-p">Get Started →</div><div class="btn-s">View Our Work</div></div></div><div class="hero-right"><img src="${img1}" onerror="this.style.background='#1a1a2e';this.removeAttribute('src')"/></div></div><section class="services"><div class="sec-eyebrow">What We Offer</div><h2 class="sec-h">Our Services</h2><div class="svc-grid">${svcs.map((s:string)=>`<div class="svc"><div class="svc-dot"></div><div class="svc-n">${s}</div></div>`).join("")}</div></section><section class="gallery"><div class="sec-eyebrow">Our Work</div><h2 class="sec-h">See the Results</h2><div class="gal-grid"><img src="${img1}"/><img src="${img2}"/><img src="${img3}"/></div></section><section class="cta"><h2>Ready to work together?</h2><p>${bizType} · ${city||"Your City"}</p><div class="cta-btn">${phone||"Contact Us Today"}</div></section><footer><span>${bizType} · ${city||"Your City"}</span><span>Exsisto Premium · $599/mo</span></footer></body></html>`;
}
// ─── STEP BAR ─────────────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ["Industry", "Business Type", "Your Details", "Your Site", "Sign Up"];
  return (
    <div className="step-bar">
      {steps.map((s, i) => (
        <div key={i} className={`step-item ${i < step ? "done" : i === step ? "active" : ""}`}>
          <div className="step-circle">{i < step ? "✓" : i + 1}</div>
          <span className="step-label">{s}</span>
          {i < steps.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
function StepIndustry({ onNext }: { onNext: (id: string) => void }) {
  return (
    <div className="step-content">
      <div className="step-header"><h2>What kind of business do you run?</h2><p>Pick your industry to get started</p></div>
      <div className="industry-grid">
        {INDUSTRIES.map(ind => (
          <button key={ind.id} className="industry-btn" onClick={() => onNext(ind.id)}>
            <span className="industry-emoji">{ind.emoji}</span>
            <span className="industry-label">{ind.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────
function StepBizType({ industry, onNext, onBack }: { industry: string; onNext: (bizType: string) => void; onBack: () => void; }) {
  const ind = INDUSTRIES.find(i => i.id === industry);
  const types = BUSINESS_TYPES[industry] || [];
  const [customType, setCustomType] = useState("");
  const [error, setError] = useState("");

  function handleOtherNext() {
    if (!customType.trim()) return setError("Please describe your business type");
    onNext(customType.trim());
  }

  if (industry === "other") {
    return (
      <div className="step-content">
        <div className="step-header"><h2>✏️ Describe your business</h2><p>Tell us what you do — our AI will build your entire site around it</p></div>
        <div className="other-writein">
          <div className="writein-examples">
            <div className="writein-example-label">Examples</div>
            <div className="writein-example-chips">
              {["Candy Shop","Wedding Photography","Dog Training","Music School","Tattoo Studio","Food Truck","Wine Bar","Escape Room","Yoga Retreat","Art Gallery"].map(ex => (
                <button key={ex} className="example-chip" onClick={() => setCustomType(ex)}>{ex}</button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{marginTop:"20px"}}>
            <label>Your Business Type *</label>
            <input className="form-input form-input-lg" type="text" placeholder="e.g. Artisan Candy Shop..." value={customType} onChange={e => { setCustomType(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleOtherNext()} autoFocus />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div className="step-actions">
            <button className="btn-ghost" onClick={onBack}>← Back</button>
            <button className="btn-primary btn-lg" onClick={handleOtherNext}>Build My Site →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-content">
      <div className="step-header"><h2>{ind?.emoji} What best describes your business?</h2><p>Pick the closest match — we'll tailor your site to it</p></div>
      <div className="biztype-grid">
        {types.map(t => (<button key={t} className="biztype-btn" onClick={() => onNext(t)}>{t}</button>))}
      </div>
      <div className="step-actions"><button className="btn-ghost" onClick={onBack}>← Back</button></div>
    </div>
  );
}

// ─── STEP 3: NEW 3-ROW LAYOUT ─────────────────────────────────────────────────
// ─── STEP DETAILS ─────────────────────────────────────────────────────────────
function StepDetails({ industry, bizType, onNext, onBack }: {
  industry: string;
  bizType: string;
  onNext: (details: { description: string; years: string; differentiator: string; stat: string; statLabel: string; services: string[] }) => void;
  onBack: () => void;
}) {
  const [description, setDescription] = useState("");
  const [years, setYears] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [stat, setStat] = useState("");
  const [statLabel, setStatLabel] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [error, setError] = useState("");

  const industryServices: Record<string, string[]> = {
    auto: ["Oil Changes", "Brake Repair", "Engine Diagnostics", "Tire Service", "Transmission Repair", "AC Service", "Detailing", "Inspections"],
    plumbing: ["Emergency Repairs", "Drain Cleaning", "Water Heater Install", "Pipe Replacement", "Fixture Install", "Sewer Service", "Backflow Prevention", "Leak Detection"],
    dental: ["Cleanings", "Teeth Whitening", "Fillings", "Crowns", "Implants", "Invisalign", "Root Canals", "Emergency Care"],
    hvac: ["AC Installation", "Heating Repair", "Duct Cleaning", "Preventive Maintenance", "Emergency Service", "Smart Thermostats", "Air Quality", "Commercial HVAC"],
    landscaping: ["Lawn Mowing", "Tree Trimming", "Landscape Design", "Irrigation", "Snow Removal", "Mulching", "Fertilization", "Hardscaping"],
    restaurant: ["Dine-In", "Takeout", "Catering", "Private Events", "Delivery", "Happy Hour", "Brunch", "Custom Menus"],
    legal: ["Consultations", "Contract Review", "Litigation", "Estate Planning", "Business Formation", "Real Estate", "Family Law", "Criminal Defense"],
    cleaning: ["Residential Cleaning", "Commercial Cleaning", "Deep Cleaning", "Move-In/Out", "Window Washing", "Carpet Cleaning", "Post-Construction", "Green Cleaning"],
    roofing: ["Roof Replacement", "Repairs", "Inspections", "Gutters", "Skylights", "Emergency Tarping", "Insurance Claims", "Commercial Roofing"],
    beauty: ["Haircuts", "Color", "Highlights", "Balayage", "Blowouts", "Extensions", "Treatments", "Bridal"],
    fitness: ["Personal Training", "Group Classes", "Yoga", "Pilates", "Nutrition Coaching", "Online Training", "Corporate Wellness", "Kids Programs"],
    pet: ["Dog Walking", "Pet Sitting", "Boarding", "Grooming", "Training", "Daycare", "Vet Transport", "Home Visits"],
  };

  const availableServices = industryServices[industry] || ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5", "Service 6", "Service 7", "Service 8"];

  function toggleService(s: string) {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 6 ? [...prev, s] : prev);
  }

  function handleNext() {
    if (!description.trim()) return setError("Please describe your business");
    setError("");
    onNext({ description, years, differentiator, stat, statLabel, services });
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Tell us about your business ✍️</h2>
        <p>The more you share, the better your site will be — our AI uses this to write your copy</p>
      </div>

      <div className="form-group">
        <label>What does your business do? <span style={{color:"#dc2626"}}>*</span></label>
        <textarea
          className="form-input"
          rows={3}
          placeholder={`e.g. "We're a family-owned ${bizType} in Westfield serving residential and commercial clients. We specialize in..."`}
          value={description}
          onChange={e => { setDescription(e.target.value); setError(""); }}
          style={{ resize: "vertical", lineHeight: 1.6 }}
        />
        <div style={{ fontSize: "11px", color: "#9090a8", marginTop: "4px" }}>Tip: mention your specialty, who you serve, and what you're known for</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Years in business</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. 12"
            value={years}
            onChange={e => setYears(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>What makes you different?</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Same-day service"
            value={differentiator}
            onChange={e => setDifferentiator(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>A stat you're proud of</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. 500+"
            value={stat}
            onChange={e => setStat(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>What does that stat mean?</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Happy customers"
            value={statLabel}
            onChange={e => setStatLabel(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: "16px" }}>
        <label>Your main services <span style={{ fontSize: "11px", color: "#9090a8", fontWeight: 400 }}>(pick up to 6)</span></label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
          {availableServices.map(s => (
            <button
              key={s}
              onClick={() => toggleService(s)}
              className={services.includes(s) ? "service-chip active" : "service-chip"}
              style={{ fontFamily: "inherit" }}
            >
              {services.includes(s) ? "✓ " : ""}{s}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button className="btn-primary btn-lg btn-full" onClick={handleNext} style={{ marginTop: "8px" }}>
        See my site preview →
      </button>
      <div className="step-actions" style={{ marginTop: "12px" }}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

function StepSite({ industry, bizType, bizDetails, onNext, onBack }: {
  industry: string; bizType: string;
  bizDetails: { description: string; years: string; differentiator: string; stat: string; statLabel: string; services: string[] };
  onNext: (city: string, phone: string, email: string, planId: string) => void;
  onBack: () => void;
}) {
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [ai, setAI] = useState<AIContent | null>(null);
  const [siteLoading, setSiteLoading] = useState(true);
  const [samples, setSamples] = useState<ContentSamples | null>(null);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState<string | null>(null);
  const [modalDevice, setModalDevice] = useState<"desktop"|"tablet"|"mobile">("desktop");
  const [error, setError] = useState("");

  useEffect(() => { generateSite(); generateSamples(); }, []);

  async function generateSite() {
    setSiteLoading(true);
    try {
      const res = await fetch("/api/generate-preview-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, bizType, city: city || "your city", description: bizDetails.description, differentiator: bizDetails.differentiator, services: bizDetails.services }),
      });
      setAI(await res.json());
    } catch {
      setAI({ headline: `${bizType} — Trusted Professionals`, tagline: "", subtext: "Professional service delivered with care.", services: bizDetails.services.length ? bizDetails.services : (BUSINESS_TYPES[industry]||[]).slice(0,6), stat1: bizDetails.stat || "15+", stat1Label: bizDetails.statLabel || "Years", stat2:"500+", stat2Label:"Clients" });
    }
    setSiteLoading(false);
  }

  async function generateSamples() {
    setSamplesLoading(true);
    try {
      const res = await fetch("/api/generate-content-samples", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bizType, industry, city: "your city" }),
      });
      setSamples(await res.json());
    } catch { setSamples(null); }
    setSamplesLoading(false);
  }

  const imgs = IMAGES[industry] || IMAGES["other"] || [];

  function buildSite(planId: string) {
    if (!ai) return "";
    const c = city || "Your City", p = phone || "Call Us";
    if (planId === "starter") return buildStarterSite(bizType, industry, c, p, ai);
    if (planId === "pro") return buildProSite(bizType, industry, c, p, ai);
    return buildPremiumSite(bizType, industry, c, p, ai);
  }

  const deviceWidths: Record<string, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

  function handleNext() {
    if (!city.trim()) return setError("Please enter your city");
    if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email");
    setError("");
    onNext(city, phone, email, selectedPlan);
  }

  const plan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];

  return (
    <div className="step-content step-wide">
      <div className="step-header">
        <h2>Here's your complete digital presence</h2>
        <p>{`${bizType} · ${city||"Your City"} · Website + Blog + Social, all handled`}</p>
      </div>

      {siteLoading ? (
        <div className="site-generating">
          <div className="loading-spinner" style={{width:"40px",height:"40px",borderWidth:"3px"}} />
          <div className="site-generating-title">Building your site…</div>
          <div className="site-generating-sub">Our AI is writing your headlines, services, and copy</div>
        </div>
      ) : (<>


      {/* ── DISCLAIMER BANNER ──────────────────────────────────────────── */}
      <div className="sample-disclaimer">
        <span className="sample-disclaimer-icon">📸</span>
        <span>The photos shown are samples. After sign up, you'll receive <strong>AI-generated images tailored to your specific business</strong> — and you'll always have the ability to swap them out for your own photos.</span>
      </div>

      {/* ── ROW 1: Three site designs ───────────────────────────────────── */}
      <div className="site-row-label">Your website — choose a design, click to preview</div>
      <div className="site-cards-row">
        {PLANS.map(p => (
          <div
            key={p.id}
            className={`site-card ${selectedPlan === p.id ? "site-card-selected" : ""}`}
            onClick={() => setSelectedPlan(p.id)}
          >
            <div className="site-card-header">
              <span className="site-card-name">{p.name} · {p.price}/mo</span>
              {p.popular && <span className="site-card-popular">Most popular</span>}
              <button className="site-card-preview-btn" onClick={e => { e.stopPropagation(); setModalPlan(p.id); setModalDevice("desktop"); }}>
                ⤢ preview
              </button>
            </div>
            <div className="site-card-iframe-wrap">
              {siteLoading ? (
                <div className="site-card-loading"><div className="loading-spinner" /></div>
              ) : (
                <iframe
                  srcDoc={buildSite(p.id)}
                  className="site-card-iframe"
                  title={`${p.name} preview`}
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
              <div className="site-card-iframe-overlay" onClick={() => { setModalPlan(p.id); setModalDevice("desktop"); }} />
            </div>
            <div className="site-card-footer">
              <span className="site-card-check">{selectedPlan === p.id ? "✓ Selected" : "Click to select"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: Three social posts ───────────────────────────────────── */}
      <div className="site-row-label" style={{marginTop:"36px"}}>
        Your social media — written &amp; posted automatically every week
      </div>
      <div className="social-row">

        {/* Facebook — wide 16:9 */}
        <div className="social-post-card">
          <div className="social-post-header">
            <div className="social-avatar-wrap" style={{background:"#1877f2"}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:"13px"}}>{bizType.charAt(0)}</span>
            </div>
            <div>
              <div className="social-biz-name">{bizType}</div>
              <div className="social-platform-name">📘 Facebook</div>
            </div>
          </div>
          <div className="social-img-wide">
            {imgs[0] ? <img src={imgs[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div className="social-img-placeholder">Photo</div>}
          </div>
          <div className="social-post-text">
            {samplesLoading ? <div className="social-loading-text" /> : (samples?.social[0]?.content || `Serving ${city||"your city"} with pride! 🏆 Licensed, insured, and local. Call today for a free estimate!`)}
          </div>
          <div className="social-engagement">
            <span>❤️ {samples?.social[0]?.likes||"47"}</span>
            <span>💬 {samples?.social[0]?.comments||"12"}</span>
          </div>
        </div>

        {/* Instagram — square 1:1 */}
        <div className="social-post-card">
          <div className="social-post-header">
            <div className="social-avatar-wrap" style={{background:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:"13px"}}>{bizType.charAt(0)}</span>
            </div>
            <div>
              <div className="social-biz-name">{bizType.toLowerCase().replace(/\s+/g,"_")}</div>
              <div className="social-platform-name">📸 Instagram</div>
            </div>
          </div>
          <div className="social-img-square">
            {imgs[1]||imgs[0] ? <img src={imgs[1]||imgs[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div className="social-img-placeholder">Photo</div>}
          </div>
          <div className="social-post-text">
            {samplesLoading ? <div className="social-loading-text" /> : (samples?.social[1]?.content || `✨ Another happy customer! DM us to get started. #${bizType.replace(/\s+/g,"")} #Local`)}
          </div>
          <div className="social-engagement">
            <span>❤️ {samples?.social[1]?.likes||"183"}</span>
            <span>💬 {samples?.social[1]?.comments||"24"}</span>
          </div>
        </div>

        {/* TikTok — portrait 9:16 */}
        <div className="social-post-card">
          <div className="social-post-header">
            <div className="social-avatar-wrap" style={{background:"#010101"}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:"13px"}}>{bizType.charAt(0)}</span>
            </div>
            <div>
              <div className="social-biz-name">@{bizType.toLowerCase().replace(/\s+/g,"")}</div>
              <div className="social-platform-name">🎵 TikTok</div>
            </div>
          </div>
          <div className="social-img-portrait">
            {imgs[2]||imgs[0] ? <img src={imgs[2]||imgs[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div className="social-img-placeholder">Photo</div>}
          </div>
          <div className="social-post-text">
            {samplesLoading ? <div className="social-loading-text" /> : (samples?.social[2]?.content || `POV: You finally found a ${bizType.toLowerCase()} you can trust 🙌 Comment INFO! #LocalBiz`)}
          </div>
          <div className="social-engagement">
            <span>❤️ {samples?.social[2]?.likes||"1.2K"}</span>
            <span>💬 {samples?.social[2]?.comments||"89"}</span>
          </div>
        </div>

      </div>

      {/* ── ROW 3: Two blog cards + plan chooser ───────────────────────── */}
      <div className="site-row-label" style={{marginTop:"36px"}}>
        Your blog + choose a plan
      </div>
      <div className="bottom-row">

        {/* Blog card 1 */}
        <div className="blog-card">
          <div className="blog-card-eyebrow">📝 Blog post · published weekly</div>
          {samplesLoading ? (
            <div className="blog-loading"><div className="loading-spinner" /><span>Writing your blog…</span></div>
          ) : (
            <>
              <div className="blog-card-title">{samples?.blog?.[0]?.title || `5 Reasons ${city||"Local"} Residents Trust ${bizType}`}</div>
              <div className="blog-card-excerpt">{samples?.blog?.[0]?.excerpt || `When it comes to finding reliable ${bizType.toLowerCase()} services, homeowners deserve the best. Here's what sets the top providers apart…`}</div>
              <div className="blog-card-meta">{samples?.blog?.[0]?.date} · {samples?.blog?.[0]?.readTime}</div>
            </>
          )}
          <div className="blog-card-note">→ Goes live on your site automatically</div>
        </div>

        {/* Blog card 2 */}
        <div className="blog-card">
          <div className="blog-card-eyebrow">📝 Blog post · next week</div>
          {samplesLoading ? (
            <div className="blog-loading"><div className="loading-spinner" /><span>Writing your blog…</span></div>
          ) : (
            <>
              <div className="blog-card-title">{samples?.blog?.[1]?.title || `The Complete Guide to ${bizType} in ${city||"Your City"}`}</div>
              <div className="blog-card-excerpt">{samples?.blog?.[1]?.excerpt || `Everything you need to know about choosing the right ${bizType.toLowerCase()} for your needs — from what to look for to questions you should ask…`}</div>
              <div className="blog-card-meta">{samples?.blog?.[1]?.date} · {samples?.blog?.[1]?.readTime}</div>
            </>
          )}
          <div className="blog-card-note">→ Goes live on your site automatically</div>
        </div>

        {/* Plan chooser */}
        <div className="plan-chooser">
          <div className="plan-chooser-title">Choose your plan</div>
          {PLANS.map(p => (
            <div key={p.id} className={`plan-option ${selectedPlan === p.id ? "selected" : ""}`} onClick={() => setSelectedPlan(p.id)}>
              {p.popular && <div className="plan-option-popular">Most popular</div>}
              <div className="plan-option-header">
                <div>
                  <div className="plan-option-name">{p.name}</div>
                  <div className="plan-option-badge">{p.images} AI images</div>
                </div>
                <div className="plan-option-price">{p.price}<span>/mo</span></div>
              </div>
              {selectedPlan === p.id && (
                <ul className="plan-option-feats">
                  {p.features.map((f, i) => <li key={i}><span className="ck">✓</span>{f}</li>)}
                </ul>
              )}
            </div>
          ))}

          <div className="plan-chooser-divider" />

          <div className="form-group"><label>City *</label><input className="form-input" type="text" placeholder="e.g. Westfield" value={city} onChange={e => setCity(e.target.value)} /></div>
          <div className="form-group"><label>Phone</label><input className="form-input" type="tel" placeholder="(908) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div className="form-group"><label>Email *</label><input className="form-input" type="email" placeholder="you@yourbusiness.com" value={email} onChange={e => setEmail(e.target.value)} /></div>

          {error && <div className="error-msg">{error}</div>}
          <button className="btn-primary btn-lg btn-full" onClick={handleNext}>Get My Site — {plan.price}/mo →</button>
          <p className="terms">Site live within 48 hours. Cancel anytime.</p>
        </div>

      </div>

      {/* ── FULLSCREEN MODAL ────────────────────────────────────────────── */}
      {modalPlan && (
        <div className="fs-modal" onClick={() => setModalPlan(null)}>
          <div className="fs-modal-inner" onClick={e => e.stopPropagation()}>
            <div className="fs-modal-bar">
              <span>{bizType} — {PLANS.find(p=>p.id===modalPlan)?.name} Preview</span>
              <div className="device-toggle">
                {(["desktop","tablet","mobile"] as const).map(d => (
                  <button key={d} className={`device-btn ${modalDevice===d?"device-btn-active":""}`} onClick={() => setModalDevice(d)}>
                    {d==="desktop"?"🖥":d==="tablet"?"⬜":"📱"} {d}
                  </button>
                ))}
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setModalPlan(null)}>✕ Close</button>
            </div>
            <div className="fs-modal-body">
              <div style={{width: deviceWidths[modalDevice], maxWidth:"100%", margin:"0 auto", height:"100%"}}>
                <iframe srcDoc={buildSite(modalPlan)} className="fs-iframe" title="Full preview" sandbox="allow-scripts allow-same-origin" />
              </div>
            </div>
          </div>
        </div>
      )}

      </>
      )}

      <div className="step-actions" style={{marginTop:"24px"}}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <button className="refresh-btn" onClick={() => { generateSite(); generateSamples(); }}>🔄 Refresh content</button>
      </div>
    </div>
  );
}

// ─── STEP 4 ───────────────────────────────────────────────────────────────────
function StepSignup({ industry, bizType, city, phone, email, planId, bizDetails, onBack }: {
  industry: string; bizType: string; city: string; phone: string; email: string; planId: string;
  bizDetails: { description: string; years: string; differentiator: string; stat: string; statLabel: string; services: string[] };
  onBack: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const plan = PLANS.find(p => p.id === planId) || PLANS[1];
  const ind = INDUSTRIES.find(i => i.id === industry);

  async function submit() {
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true); setError("");
    try {
      // 1. Create the account server-side
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password, businessName:bizType, industry, city, phone, planId, description: bizDetails.description, years: bizDetails.years, differentiator: bizDetails.differentiator, stat: bizDetails.stat, statLabel: bizDetails.statLabel, services: bizDetails.services }) });
      const d = await res.json();
      if (!res.ok) { throw new Error(d.error||"Signup failed"); }
      const bizId = d.businessId || "";

      // 2. Sign in client-side to establish browser session
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error("Account created but sign-in failed. Please log in.");

      // 3. Redirect to success page
      router.push(`/checkout/success${bizId ? `?business_id=${bizId}` : ""}`);
    } catch(err: unknown) { setError(err instanceof Error ? err.message : "Something went wrong"); setLoading(false); }
  }

  return (
    <div className="step-content">
      <div className="step-header"><h2>You're almost live 🎉</h2><p>Create your account — we start building immediately</p></div>
      <div className="order-box">
        <div className="order-title">Order Summary</div>
        <div className="order-row"><span>Business</span><span>{bizType}</span></div>
        <div className="order-row"><span>Industry</span><span>{ind?.emoji} {ind?.label}</span></div>
        <div className="order-row"><span>City</span><span>{city}</span></div>
        <div className="order-divider" />
        <div className="order-row order-total"><span>{plan.name} Plan</span><span className="order-plan-val">{plan.price}/mo</span></div>
      </div>
      <div className="form-group"><label>Email</label><input className="form-input" type="email" value={email} disabled style={{opacity:0.6}} /></div>
      <div className="form-group"><label>Password *</label><input className="form-input" type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} /></div>
      {error && (
        <div className="error-msg">
          {error}
          {error.includes("already exists") && <span> <a href="/login" style={{color:"inherit",fontWeight:700,textDecoration:"underline"}}>Log in instead →</a></span>}
        </div>
      )}
      <button className="btn-primary btn-lg btn-full" onClick={submit} disabled={loading}>
        {loading ? "Creating your account…" : `Create Account & Pay ${plan.price}/mo →`}
      </button>
      <p className="terms">By signing up you agree to our Terms of Service. Cancel anytime.</p>
      <div className="step-actions" style={{marginTop:"12px"}}><button className="btn-ghost" onClick={onBack}>← Back</button></div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
function PreviewPageInner() {
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") || "light";
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [bizType, setBizType] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("pro");
  const [bizDetails, setBizDetails] = useState<{
    description: string;
    years: string;
    differentiator: string;
    stat: string;
    statLabel: string;
    services: string[];
  }>({ description: "", years: "", differentiator: "", stat: "", statLabel: "", services: [] });

  return (
    <div className="preview-page" data-theme={theme}>
      <nav className="preview-nav">
        <a href="/" className="preview-nav-logo">Exsisto</a>
        <div className="preview-nav-tag">✦ Your site, built by AI in 48 hours</div>
      </nav>
      <div className="preview-container">
        <StepBar step={step} />
        {step===0 && <StepIndustry onNext={id => { setIndustry(id); setStep(1); }} />}
        {step===1 && <StepBizType industry={industry} onNext={t => { setBizType(t); setStep(2); }} onBack={() => setStep(0)} />}
        {step===2 && <StepDetails industry={industry} bizType={bizType} onNext={details => { setBizDetails(details); setStep(3); }} onBack={() => setStep(1)} />}
        {step===3 && <StepSite industry={industry} bizType={bizType} bizDetails={bizDetails} onNext={(c,p,e,pid) => { setCity(c); setPhone(p); setEmail(e); setPlanId(pid); setStep(4); }} onBack={() => setStep(2)} />}
        {step===4 && <StepSignup industry={industry} bizType={bizType} city={city} phone={phone} email={email} planId={planId} bizDetails={bizDetails} onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div style={{background:'#0a0a0f',minHeight:'100vh'}} />}>
      <PreviewPageInner />
    </Suspense>
  );
}

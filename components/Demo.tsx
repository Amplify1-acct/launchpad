"use client";

import { useState, useRef } from "react";
import styles from "./Demo.module.css";

const industries = [
  // Home Services
  "Plumbing", "Electrician", "HVAC & Heating", "Landscaping", "Cleaning Service",
  "Roofing", "Painting", "Pest Control", "Pool Service", "Handyman",
  // Health & Wellness  
  "Dental", "Chiropractic", "Physical Therapy", "Veterinary", "Gym & Fitness",
  "Yoga Studio", "Med Spa", "Mental Health", "Optometry", "Nutrition & Dietitian",
  // Food & Hospitality
  "Restaurant", "Bakery", "Catering", "Food Truck", "Coffee Shop", "Bar & Brewery",
  // Professional Services
  "Law Firm", "Accounting & CPA", "Financial Advisor", "Insurance Agency", "Mortgage Broker",
  "Real Estate", "Architecture", "Marketing Agency",
  // Beauty & Personal Care
  "Hair Salon", "Nail Salon", "Barbershop", "Tattoo Studio", "Massage Therapy",
  // Creative & Media
  "Photography", "Videography", "Graphic Design", "Web Design",
  // Retail & Auto
  "Auto Repair", "Car Dealership", "Clothing Boutique", "Jewelry Store", "Florist",
  // Education & Childcare
  "Tutoring", "Childcare & Daycare", "Music School", "Martial Arts",
  // Other
  "Other (describe below)",
];

const designStyles = [
  {
    id: "minimal",
    name: "Modern & Minimal",
    desc: "Clean whites, lots of space",
    preview: "bg-white text",
    icon: "◻",
  },
  {
    id: "bold",
    name: "Bold & Dark",
    desc: "Navy/black, dramatic",
    preview: "bg-navy text",
    icon: "◼",
  },
  {
    id: "warm",
    name: "Warm & Friendly",
    desc: "Earthy tones, approachable",
    preview: "bg-warm text",
    icon: "◈",
  },
];

const themes: Record<string, {
  bg: string; bg2: string; bg3: string; nav: string; navText: string;
  hero: string; heroText: string; heroSub: string; heroBtn: string; heroBtnText: string;
  heroBtnOut: string; heroBtnOutText: string; statBg: string; statText: string; statLabel: string;
  serviceBg: string; serviceBorder: string; serviceTitle: string; serviceText: string; serviceIcon: string;
  testimonialBg: string; testimonialBorder: string; testimonialText: string; testimonialAuthor: string;
  ctaBg: string; ctaText: string; ctaBtn: string; ctaBtnText: string;
  footerBg: string; footerText: string; footerLink: string;
  badge: string; badgeText: string; stars: string;
}> = {
  minimal: {
    bg: "#ffffff", bg2: "#f8faff", bg3: "#f1f5f9",
    nav: "#ffffff", navText: "#0d1b2a",
    hero: "linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)",
    heroText: "#0d1b2a", heroSub: "#475569",
    heroBtn: "#2563eb", heroBtnText: "#ffffff",
    heroBtnOut: "transparent", heroBtnOutText: "#2563eb",
    statBg: "#ffffff", statText: "#0d1b2a", statLabel: "#94a3b8",
    serviceBg: "#ffffff", serviceBorder: "#e5e7eb", serviceTitle: "#0d1b2a", serviceText: "#64748b", serviceIcon: "#2563eb",
    testimonialBg: "#f8faff", testimonialBorder: "#2563eb", testimonialText: "#1e293b", testimonialAuthor: "#64748b",
    ctaBg: "#0d1b2a", ctaText: "#ffffff", ctaBtn: "#2563eb", ctaBtnText: "#ffffff",
    footerBg: "#f1f5f9", footerText: "#64748b", footerLink: "#94a3b8",
    badge: "#eff6ff", badgeText: "#2563eb", stars: "#f59e0b",
  },
  bold: {
    bg: "#0d1117", bg2: "#161b22", bg3: "#1c2128",
    nav: "#0d1117", navText: "#ffffff",
    hero: "linear-gradient(135deg, #0d1117 0%, #1a2e44 100%)",
    heroText: "#ffffff", heroSub: "#94a3b8",
    heroBtn: "#2563eb", heroBtnText: "#ffffff",
    heroBtnOut: "transparent", heroBtnOutText: "#ffffff",
    statBg: "rgba(255,255,255,0.05)", statText: "#ffffff", statLabel: "#475569",
    serviceBg: "#161b22", serviceBorder: "#30363d", serviceTitle: "#e2e8f0", serviceText: "#8b949e", serviceIcon: "#60a5fa",
    testimonialBg: "#161b22", testimonialBorder: "#2563eb", testimonialText: "#e2e8f0", testimonialAuthor: "#8b949e",
    ctaBg: "#1a2e44", ctaText: "#ffffff", ctaBtn: "#2563eb", ctaBtnText: "#ffffff",
    footerBg: "#0d1117", footerText: "#6e7681", footerLink: "#8b949e",
    badge: "rgba(37,99,235,0.2)", badgeText: "#60a5fa", stars: "#f59e0b",
  },
  warm: {
    bg: "#fffbf5", bg2: "#fef3e2", bg3: "#fde8c8",
    nav: "#fffbf5", navText: "#292524",
    hero: "linear-gradient(135deg, #fef3e2 0%, #fde8c8 100%)",
    heroText: "#292524", heroSub: "#78716c",
    heroBtn: "#d97706", heroBtnText: "#ffffff",
    heroBtnOut: "transparent", heroBtnOutText: "#d97706",
    statBg: "#ffffff", statText: "#292524", statLabel: "#a8a29e",
    serviceBg: "#ffffff", serviceBorder: "#e7e5e4", serviceTitle: "#292524", serviceText: "#78716c", serviceIcon: "#d97706",
    testimonialBg: "#fef3e2", testimonialBorder: "#d97706", testimonialText: "#292524", testimonialAuthor: "#78716c",
    ctaBg: "#292524", ctaText: "#ffffff", ctaBtn: "#d97706", ctaBtnText: "#ffffff",
    footerBg: "#1c1917", footerText: "#78716c", footerLink: "#57534e",
    badge: "#fde8c8", badgeText: "#b45309", stars: "#d97706",
  },
};

const industryData: Record<string, {
  color: string; accent: string; emoji: string; tagline: string; cta: string;
  image: string; services: string[]; stats: { num: string; label: string }[];
  testimonial: { text: string; name: string; role: string };
  blogs: string[]; posts: string[]; pages: string[];
}> = {
  "Plumbing": {
    color: "#1e3a5f", accent: "#2563eb", emoji: "🔧",
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=300&fit=crop&auto=format",
    tagline: "Fast, reliable plumbing — available 24/7 for emergencies.",
    cta: "Get a Free Quote",
    services: ["Emergency Repairs", "Pipe Installation", "Water Heaters", "Drain Cleaning"],
    stats: [{ num: "500+", label: "Jobs done" }, { num: "24/7", label: "Available" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "Fixed our burst pipe in under an hour. Absolute lifesaver!", name: "Mike R.", role: "Homeowner" },
    blogs: ["5 Signs You Need a New Water Heater", "How to Prevent Frozen Pipes This Winter", "When to Call a Plumber vs DIY"],
    posts: ["🔧 Emergency leak at 2am? We're on call 24/7.", "💧 A dripping faucet wastes 3,000 gallons/year.", "⭐ 'Fixed our burst pipe in under an hour!' – Mike R."],
    pages: ["Home", "Services", "Emergency", "Reviews", "Contact"],
  },
  "Bakery": {
    color: "#7c2d12", accent: "#ea580c", emoji: "🥐",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=300&fit=crop&auto=format",
    tagline: "Handcrafted breads, pastries & custom cakes — baked fresh daily.",
    cta: "Order Now",
    services: ["Sourdough Bread", "Custom Cakes", "Pastries", "Catering"],
    stats: [{ num: "200+", label: "Cake designs" }, { num: "Daily", label: "Fresh baked" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "Best birthday cake we've ever had. Everyone was asking where it came from!", name: "Sarah K.", role: "Customer" },
    blogs: ["Our Secret to the Perfect Sourdough Loaf", "5 Wedding Cake Trends for 2026", "Why We Only Use Local Ingredients"],
    posts: ["🥐 Fresh croissants out of the oven — come get yours!", "🎂 Custom cakes for every occasion. DM us to order.", "❤️ 'Best birthday cake we've ever had!' – Sarah K."],
    pages: ["Home", "Menu", "Custom Cakes", "Our Story", "Order"],
  },
  "Law Firm": {
    color: "#1c1917", accent: "#b45309", emoji: "⚖️",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=300&fit=crop&auto=format",
    tagline: "Experienced attorneys fighting for the results you deserve.",
    cta: "Free Consultation",
    services: ["Personal Injury", "Workers Comp", "Car Accidents", "Slip & Fall"],
    stats: [{ num: "$50M+", label: "Recovered" }, { num: "1,200+", label: "Cases won" }, { num: "Free", label: "Consultation" }],
    testimonial: { text: "They got me 3x what the insurance company offered. I'm so grateful.", name: "David L.", role: "Client" },
    blogs: ["What to Do After a Car Accident", "Understanding Your Rights as a Tenant", "5 Questions to Ask Before Hiring a Lawyer"],
    posts: ["⚖️ Free 15-min consultation. Know your rights.", "📋 Injured at work? Don't sign anything before calling us.", "⭐ 'Got me 3x what insurance offered.' – David L."],
    pages: ["Home", "Practice Areas", "Our Team", "Results", "Free Consult"],
  },
  "Real Estate": {
    color: "#14532d", accent: "#16a34a", emoji: "🏡",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=300&fit=crop&auto=format",
    tagline: "Your local experts for buying, selling & investing in real estate.",
    cta: "See Listings",
    services: ["Buy a Home", "Sell Your Home", "Investment Properties", "Free Valuation"],
    stats: [{ num: "300+", label: "Homes sold" }, { num: "6 days", label: "Avg. sale" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "Sold our home in 6 days over asking price. Absolutely incredible service.", name: "The Johnsons", role: "Home Sellers" },
    blogs: ["Top 10 Home Staging Tips That Actually Work", "Is Now a Good Time to Buy?", "How to Win a Bidding War in 2026"],
    posts: ["🏡 Just listed: 4BR in Westfield — won't last long.", "📈 Home values up 12% in your area. Time to sell?", "⭐ 'Sold our home in 6 days!' – The Johnson Family"],
    pages: ["Home", "Listings", "Buy", "Sell", "Contact"],
  },
  "Dental": {
    color: "#0c4a6e", accent: "#0284c7", emoji: "🦷",
    image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&h=300&fit=crop&auto=format",
    tagline: "Gentle, modern dental care for the whole family.",
    cta: "Book Appointment",
    services: ["Cleanings & Exams", "Teeth Whitening", "Invisalign", "Implants"],
    stats: [{ num: "2,000+", label: "Patients" }, { num: "Same-day", label: "Emergency" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "Best dental experience I've ever had. So gentle and professional.", name: "Rachel M.", role: "Patient" },
    blogs: ["7 Foods Secretly Destroying Your Teeth", "Invisalign vs Braces: What's Right for You?", "How Often Should You Get a Cleaning?"],
    posts: ["😁 Smile makeovers starting at $299/month.", "🦷 Most insurance covers 2 cleanings/year.", "⭐ 'Best dentist I've ever had!' – Rachel M."],
    pages: ["Home", "Services", "Smile Gallery", "Insurance", "Book Now"],
  },
  "Gym & Fitness": {
    color: "#1a1a2e", accent: "#7c3aed", emoji: "💪",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop&auto=format",
    tagline: "Real results. No contracts. Just show up and do the work.",
    cta: "Start Free Trial",
    services: ["Group Classes", "Personal Training", "Nutrition Plans", "Online Coaching"],
    stats: [{ num: "500+", label: "Members" }, { num: "30+", label: "Classes/week" }, { num: "No", label: "Contracts" }],
    testimonial: { text: "Lost 30lbs in 3 months. The coaches here actually care about your progress.", name: "Tom B.", role: "Member" },
    blogs: ["The 30-Minute Full Body Workout Anyone Can Do", "Why Most Diets Fail (And What Works)", "5 Signs You're Overtraining"],
    posts: ["💪 First class free. No excuses, just results.", "🔥 5am crew showing up every day. Are you in?", "⭐ 'Lost 30lbs in 3 months!' – Tom B."],
    pages: ["Home", "Classes", "Trainers", "Pricing", "Join Now"],
  },
  "Restaurant": {
    color: "#1c0a00", accent: "#dc2626", emoji: "🍽️",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=300&fit=crop&auto=format",
    tagline: "Authentic flavors, fresh ingredients, unforgettable dining.",
    cta: "Reserve a Table",
    services: ["Dine In", "Takeout & Delivery", "Private Events", "Catering"],
    stats: [{ num: "15yr", label: "In business" }, { num: "4.9★", label: "On Yelp" }, { num: "Fresh", label: "Daily menu" }],
    testimonial: { text: "Best Italian food in the state. We drive 45 minutes just to eat here.", name: "Yelp Reviewer", role: "Regular Customer" },
    blogs: ["Behind the Menu: How We Source Our Ingredients", "Our Chef's 3 Favorite Dishes", "The Story Behind Our Family Recipe"],
    posts: ["🍕 Tuesday special: Buy one, get one free — dine in only.", "👨‍🍳 Meet Chef Marco, the heart behind every dish.", "⭐ 'Best Italian food in NJ!' – Yelp reviewer"],
    pages: ["Home", "Menu", "Reservations", "Our Story", "Find Us"],
  },
  "Photography": {
    color: "#1a1a2e", accent: "#db2777", emoji: "📸",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=300&fit=crop&auto=format",
    tagline: "Capturing the moments that matter most — beautifully.",
    cta: "Book a Session",
    services: ["Family Portraits", "Weddings", "Newborns", "Headshots"],
    stats: [{ num: "800+", label: "Sessions" }, { num: "200+", label: "Weddings" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "She made us feel so comfortable. The photos are absolutely stunning.", name: "The Kim Family", role: "Family Session" },
    blogs: ["How to Prepare for Your Family Photo Session", "Golden Hour vs Studio: Which is Right?", "5 Poses That Look Great on Everyone"],
    posts: ["📸 Spring minis now booking — only 8 spots left!", "🌅 Golden hour sessions are *chef's kiss*.", "⭐ 'Made us feel so comfortable!' – The Kim Family"],
    pages: ["Home", "Portfolio", "Sessions", "Pricing", "Book Now"],
  },
  "Landscaping": {
    color: "#14532d", accent: "#15803d", emoji: "🌿",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=300&fit=crop&auto=format",
    tagline: "Beautiful yards, stress-free maintenance — all season long.",
    cta: "Get Free Quote",
    services: ["Lawn Care", "Garden Design", "Tree Trimming", "Snow Removal"],
    stats: [{ num: "400+", label: "Properties" }, { num: "Weekly", label: "Maintenance" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "Our yard has never looked better. They transformed it in one weekend.", name: "Carol T.", role: "Homeowner" },
    blogs: ["The Best Plants for a Low-Maintenance Yard", "Spring Lawn Care: Your Complete Checklist", "How to Design a Backyard You'll Actually Use"],
    posts: ["🌿 Spring cleanup special — book before April 15th.", "🏡 Before & after: see what we did in one weekend.", "⭐ 'Our yard has never looked better!' – Carol T."],
    pages: ["Home", "Services", "Gallery", "Seasonal", "Get Quote"],
  },
  "Auto Repair": {
    color: "#1c1917", accent: "#d97706", emoji: "🚗",
    image: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&h=300&fit=crop&auto=format",
    tagline: "Honest repairs, fair prices — your car in expert hands.",
    cta: "Book Service",
    services: ["Oil Changes", "Brake Service", "Engine Repair", "Diagnostics"],
    stats: [{ num: "20yr", label: "Experience" }, { num: "No", label: "Hidden fees" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "Honest, fast, and fair priced. I'll never go anywhere else for car repairs.", name: "James W.", role: "Customer" },
    blogs: ["5 Warning Signs Your Brakes Need Attention", "How Often Should You Really Change Your Oil?", "What That Check Engine Light Actually Means"],
    posts: ["🚗 Free brake inspection this week — no appointment needed.", "🔑 Oil change + tire rotation combo: $49.99.", "⭐ 'Honest, fast, and fair priced.' – James W."],
    pages: ["Home", "Services", "Specials", "Reviews", "Book Service"],
  },
  "Martial Arts": {
    color: "#1a0a2e", accent: "#7c3aed", emoji: "🥋",
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=300&fit=crop&auto=format",
    tagline: "Build discipline, confidence, and strength — for all ages and skill levels.",
    cta: "Try a Free Class",
    services: ["Kids Classes", "Adult Classes", "Self-Defense", "Competition Training"],
    stats: [{ num: "300+", label: "Students" }, { num: "All", label: "Ages welcome" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "My son has grown so much in confidence since joining. Best decision we ever made.", name: "Lisa M.", role: "Parent" },
    blogs: ["5 Reasons Martial Arts is Great for Kids", "What to Expect in Your First Class", "How Martial Arts Builds Real-World Confidence"],
    posts: ["🥋 First class is FREE — come see what we're about.", "💪 Our students don't just learn to fight. They learn to lead.", "⭐ 'Best decision for my kids!' – Lisa M."],
    pages: ["Home", "Classes", "Schedule", "Instructors", "Try Free"],
  },
  "Hair Salon": {
    color: "#1a0a1a", accent: "#be185d", emoji: "✂️",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=300&fit=crop&auto=format",
    tagline: "Expert cuts, color, and styling in a relaxing, welcoming environment.",
    cta: "Book Appointment",
    services: ["Haircuts & Styling", "Color & Highlights", "Keratin Treatments", "Bridal Hair"],
    stats: [{ num: "500+", label: "Happy clients" }, { num: "10+", label: "Years experience" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "I've been coming here for 3 years and never leave disappointed. Absolutely love my hair.", name: "Amanda R.", role: "Regular Client" },
    blogs: ["How to Choose the Right Hair Color for Your Skin Tone", "5 Tips to Keep Your Color Fresh Between Appointments", "The Best Haircuts for Face Shapes in 2026"],
    posts: ["✂️ Book before Friday and get 15% off your first color service.", "💇 New season, new look — spring hair trends are here.", "⭐ 'Never been happier with my hair!' – Amanda R."],
    pages: ["Home", "Services", "Gallery", "Team", "Book Now"],
  },
  "Dog Grooming": {
    color: "#0a2010", accent: "#16a34a", emoji: "🐾",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=300&fit=crop&auto=format",
    tagline: "Professional grooming that keeps your pup looking — and feeling — their best.",
    cta: "Book a Groom",
    services: ["Full Groom", "Bath & Brush", "Nail Trimming", "Teeth Brushing"],
    stats: [{ num: "1,000+", label: "Happy pups" }, { num: "Gentle", label: "Approach always" }, { num: "5★", label: "Rated" }],
    testimonial: { text: "My dog actually gets excited when we pull into the parking lot. That tells you everything.", name: "Kevin S.", role: "Dog Owner" },
    blogs: ["How Often Should You Groom Your Dog? (By Breed)", "5 Signs Your Dog Needs a Professional Groomer", "What to Expect at Your Dog's First Grooming Appointment"],
    posts: ["🐾 Book this week and your pup gets a free bandana!", "🛁 Smelly dog? Our deep clean bath will fix that.", "⭐ 'My dog loves coming here!' – Kevin S."],
    pages: ["Home", "Services", "Gallery", "Pricing", "Book Now"],
  },
};

type Phase = "idle" | "building" | "website" | "blog" | "social" | "done";

function MockHomepage({ name, industry, data, themeId }: {
  name: string; industry: string;
  data: typeof industryData["Plumbing"]; themeId: string;
}) {
  const t = themes[themeId];
  const s: React.CSSProperties = { fontFamily: "system-ui, sans-serif" };

  return (
    <div style={{ ...s, background: t.bg, fontSize: "10px", lineHeight: 1.5 }}>

      {/* NAV */}
      <div style={{ background: t.nav, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.serviceBorder}` }}>
        <div style={{ fontWeight: 800, color: t.navText, fontSize: "12px" }}>{data.emoji} {name}</div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {data.pages.slice(0, 4).map((p, i) => (
            <span key={i} style={{ color: t.navText, opacity: 0.7, fontSize: "9px" }}>{p}</span>
          ))}
          <span style={{ background: data.accent, color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 600 }}>{data.cta}</span>
        </div>
      </div>

      {/* HERO */}
      <div style={{ background: t.hero, padding: "22px 16px" }}>
        <div style={{ display: "inline-block", background: t.badge, color: t.badgeText, fontSize: "8px", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{industry} Services</div>
        <div style={{ fontSize: "17px", fontWeight: 800, color: t.heroText, marginBottom: "6px", lineHeight: 1.25 }}>{name}</div>
        <div style={{ fontSize: "10px", color: t.heroSub, marginBottom: "12px", maxWidth: "280px", lineHeight: 1.6 }}>{data.tagline}</div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          <span style={{ background: data.accent, color: "#fff", padding: "5px 12px", borderRadius: "5px", fontSize: "9px", fontWeight: 700 }}>{data.cta}</span>
          <span style={{ border: `1px solid ${data.accent}`, color: data.accent, padding: "5px 12px", borderRadius: "5px", fontSize: "9px", fontWeight: 600 }}>Learn More</span>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: "0", borderTop: `1px solid ${t.serviceBorder}`, paddingTop: "12px" }}>
          {data.stats.map((st, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${t.serviceBorder}` : "none", padding: "0 8px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: data.accent }}>{st.num}</div>
              <div style={{ fontSize: "8px", color: t.statLabel, marginTop: "1px" }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HERO IMAGE */}
      <div style={{ height: "100px", backgroundImage: `url(${data.image})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
      </div>

      {/* SERVICES */}
      <div style={{ padding: "16px", background: t.bg2 }}>
        <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: data.accent, marginBottom: "4px" }}>What We Offer</div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: t.serviceTitle, marginBottom: "10px" }}>Our Services</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {data.services.map((svc, i) => (
            <div key={i} style={{ background: t.serviceBg, border: `1px solid ${t.serviceBorder}`, borderTop: `2px solid ${data.accent}`, borderRadius: "6px", padding: "8px 10px" }}>
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>✦</div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: t.serviceTitle }}>{svc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIAL */}
      <div style={{ padding: "14px 16px", background: t.testimonialBg, borderLeft: `3px solid ${data.accent}`, margin: "0" }}>
        <div style={{ color: t.stars, fontSize: "11px", marginBottom: "5px" }}>★★★★★</div>
        <div style={{ fontSize: "10px", color: t.testimonialText, fontStyle: "italic", lineHeight: 1.6, marginBottom: "6px" }}>"{data.testimonial.text}"</div>
        <div style={{ fontSize: "9px", color: t.testimonialAuthor, fontWeight: 600 }}>— {data.testimonial.name}, {data.testimonial.role}</div>
      </div>

      {/* BLOG PREVIEW */}
      <div style={{ padding: "16px", background: t.bg }}>
        <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: data.accent, marginBottom: "4px" }}>From Our Blog</div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: t.serviceTitle, marginBottom: "10px" }}>Latest Posts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.blogs.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "8px", background: t.bg2, borderRadius: "6px", border: `1px solid ${t.serviceBorder}` }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "5px", background: data.accent, color: "#fff", fontSize: "9px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: "9px", color: t.serviceTitle, fontWeight: 500, lineHeight: 1.4 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{ padding: "20px 16px", background: t.ctaBg, textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: t.ctaText, marginBottom: "6px" }}>Ready to get started?</div>
        <div style={{ fontSize: "9px", color: t.ctaText, opacity: 0.7, marginBottom: "12px" }}>Contact us today for a free consultation.</div>
        <span style={{ background: t.ctaBtn, color: t.ctaBtnText, padding: "6px 16px", borderRadius: "5px", fontSize: "9px", fontWeight: 700 }}>{data.cta} →</span>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "12px 16px", background: t.footerBg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: t.footerText }}>{data.emoji} {name}</div>
        <div style={{ display: "flex", gap: "8px" }}>
          {data.pages.slice(0, 3).map((p, i) => (
            <span key={i} style={{ fontSize: "8px", color: t.footerLink }}>{p}</span>
          ))}
        </div>
        <div style={{ fontSize: "8px", color: t.footerLink }}>© 2026 {name}</div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [styleId, setStyleId] = useState("minimal");
  const [customIndustry, setCustomIndustry] = useState("");
  const [aiIndustry, setAiIndustry] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [websiteProgress, setWebsiteProgress] = useState(0);
  const [blogProgress, setBlogProgress] = useState(0);
  const [socialProgress, setSocialProgress] = useState(0);
  const [visibleBlogs, setVisibleBlogs] = useState(0);
  const [visibleSocial, setVisibleSocial] = useState(0);
  const [websiteSection, setWebsiteSection] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState("");
  const [visiblePages, setVisiblePages] = useState(0);
  const [aiGeneratedData, setAiGeneratedData] = useState<typeof industryData["Plumbing"] | null>(null);
  const aiDataRef = useRef<typeof industryData["Plumbing"] | null>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const name = businessName || "Your Business";

  const reset = () => {
    setPhase("idle"); setWebsiteProgress(0); setBlogProgress(0); setSocialProgress(0);
    setVisibleBlogs(0); setVisibleSocial(0); setWebsiteSection(0); setTypedHeadline(""); setVisiblePages(0);
  };

  const runDemo = async () => {
    if (!businessName || !industry) return;
    // Capture current values synchronously before any async work
    const isOtherNow = industry === "Other (describe below)";
    const resolvedIndustry = isOtherNow ? (aiIndustry || customIndustry) : industry;
    aiDataRef.current = null;
    setAiGeneratedData(null);
    reset();
    await new Promise(r => setTimeout(r, 50));
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPhase("building");

    // If industry not in our hardcoded list, generate custom data via Claude API
    const hasHardcoded = !!industryData[resolvedIndustry] ||
      Object.keys(industryData).some(k =>
        k.toLowerCase().includes(resolvedIndustry.toLowerCase()) ||
        resolvedIndustry.toLowerCase().includes(k.toLowerCase())
      );

    if (!hasHardcoded && resolvedIndustry.length > 2) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 800,
            messages: [{
              role: "user",
              content: `Generate website demo content for a small business: "${businessName}" which is a "${resolvedIndustry}".

Return ONLY valid JSON with this exact structure:
{
  "color": "#1a1a2e",
  "accent": "#7c3aed",
  "emoji": "🥋",
  "tagline": "one sentence tagline for this business",
  "cta": "2-3 word CTA button text",
  "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=300&fit=crop&auto=format",
  "services": ["Service 1", "Service 2", "Service 3", "Service 4"],
  "stats": [{"num": "200+", "label": "Students"}, {"num": "10yr", "label": "Experience"}, {"num": "5★", "label": "Rated"}],
  "testimonial": {"text": "A genuine testimonial for this type of business", "name": "Customer Name", "role": "Customer type"},
  "blogs": ["Blog post title 1", "Blog post title 2", "Blog post title 3"],
  "posts": ["Social post 1 with emoji", "Social post 2 with emoji", "Social post 3 with emoji"],
  "pages": ["Home", "Page2", "Page3", "Page4", "CTA Page"]
}

Use a relevant Unsplash photo URL for this business type. Pick an accent color that fits the industry vibe. Return ONLY the JSON, no other text.`
            }]
          })
        });
        const d = await res.json();
        const text = d.content?.[0]?.text?.trim() || "";
        const clean = text.replace(/\`\`\`json|\`\`\`/g, "").trim();
        const generated = JSON.parse(clean);
        aiDataRef.current = generated;
        setAiGeneratedData(generated);
      } catch (e) {
        // Fall back to closest match silently
      }
    }

    // Build the active data using ref (immediately available) not state
    const closestKey = Object.keys(industryData).find(k =>
      k.toLowerCase().includes(resolvedIndustry.toLowerCase()) ||
      resolvedIndustry.toLowerCase().includes(k.toLowerCase())
    );
    const activeData = aiDataRef.current || industryData[closestKey || ""] || industryData["Plumbing"];

    await new Promise(r => setTimeout(r, 400));
    setPhase("website");

    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setWebsiteProgress(i); }
    setWebsiteProgress(100);
    for (let i = 1; i <= activeData.pages.length; i++) { await new Promise(r => setTimeout(r, 70)); setVisiblePages(i); }
    const hl = name;
    for (let i = 0; i <= hl.length; i++) { await new Promise(r => setTimeout(r, 40)); setTypedHeadline(hl.slice(0, i)); }
    for (let i = 1; i <= 4; i++) { await new Promise(r => setTimeout(r, 300)); setWebsiteSection(i); }
    await new Promise(r => setTimeout(r, 400));

    setPhase("blog");
    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setBlogProgress(i); }
    setBlogProgress(100);
    for (let i = 1; i <= 3; i++) { await new Promise(r => setTimeout(r, 350)); setVisibleBlogs(i); }
    await new Promise(r => setTimeout(r, 400));

    setPhase("social");
    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setSocialProgress(i); }
    setSocialProgress(100);
    for (let i = 1; i <= 3; i++) { await new Promise(r => setTimeout(r, 300)); setVisibleSocial(i); }
    await new Promise(r => setTimeout(r, 400));
    setPhase("done");
  };

  const isOther = industry === "Other (describe below)";
  const effectiveIndustry = isOther ? (aiIndustry || customIndustry) : industry;

  // Find closest matching industry from our hardcoded list, or use AI-generated data
  const closestIndustry = effectiveIndustry ? Object.keys(industryData).find(k =>
    k.toLowerCase().includes(effectiveIndustry.toLowerCase()) ||
    effectiveIndustry.toLowerCase().includes(k.toLowerCase())
  ) : undefined;
  const data = aiGeneratedData || (closestIndustry ? industryData[closestIndustry] : null) || (industryData[industry] ?? null) || industryData["Plumbing"];

  const canRun = businessName.trim().length > 1 && industry.length > 0 && (!isOther || customIndustry.trim().length > 2);

  const handleCustomIndustryBlur = async () => {
    if (!customIndustry.trim() || aiIndustry) return;
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 100,
          messages: [{ role: "user", content: `A small business owner described their business as: "${customIndustry}". In 3-5 words, what type of business is this? Reply with ONLY the business type label, nothing else. Examples: "Tattoo Studio", "Dog Grooming", "Event Planning", "IT Consulting"` }]
        })
      });
      const d = await res.json();
      const label = d.content?.[0]?.text?.trim() || customIndustry;
      setAiIndustry(label);
    } catch {
      setAiIndustry(customIndustry);
    }
    setAiLoading(false);
  };
  const t = themes[styleId];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>Try it live — free, no signup</p>
          <h2 className={styles.title}>See your business online<br />in under 60 seconds</h2>
          <p className={styles.sub}>Follow the 3 steps below. We&apos;ll build your real website, write your blog posts, and set up your social media — live, right here on screen.</p>
        </div>

        <div className={styles.stepsBar}>
          <div className={styles.stepsBarItem}><span className={styles.stepsBarNum}>1</span> Enter your business</div>
          <div className={styles.stepsBarArrow}>→</div>
          <div className={styles.stepsBarItem}><span className={styles.stepsBarNum}>2</span> Pick a design style</div>
          <div className={styles.stepsBarArrow}>→</div>
          <div className={styles.stepsBarItem}><span className={styles.stepsBarNum}>3</span> Hit Build & watch it happen</div>
        </div>

        {/* STEP 1: Business info */}
        <div className={styles.setupRow}>
          <div className={styles.setupStep}>
            <div className={styles.setupStepNum}>1</div>
            <div className={styles.setupStepLabel}>Your business</div>
          </div>
          <div className={styles.inputCol}>
            <div className={styles.inputPair}>
              <input className={styles.input} type="text" placeholder="Your business name (e.g. Mike's Plumbing)" value={businessName}
                onChange={e => setBusinessName(e.target.value)} disabled={phase !== "idle" && phase !== "done"} maxLength={40}
                onKeyDown={e => e.key === "Enter" && canRun && runDemo()} />
              <select className={styles.select} value={industry} onChange={e => { setIndustry(e.target.value); setAiIndustry(""); setCustomIndustry(""); }} disabled={phase !== "idle" && phase !== "done"}>
                <option value="">Select your industry / business type</option>
                <optgroup label="🏠 Home Services">
                  {["Plumbing","Electrician","HVAC & Heating","Landscaping","Cleaning Service","Roofing","Painting","Pest Control","Pool Service","Handyman"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="🏥 Health & Wellness">
                  {["Dental","Chiropractic","Physical Therapy","Veterinary","Gym & Fitness","Yoga Studio","Med Spa","Mental Health","Optometry","Nutrition & Dietitian"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="🍽️ Food & Hospitality">
                  {["Restaurant","Bakery","Catering","Food Truck","Coffee Shop","Bar & Brewery"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="💼 Professional Services">
                  {["Law Firm","Accounting & CPA","Financial Advisor","Insurance Agency","Mortgage Broker","Real Estate","Architecture","Marketing Agency"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="💅 Beauty & Personal Care">
                  {["Hair Salon","Nail Salon","Barbershop","Tattoo Studio","Massage Therapy"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="🎨 Creative & Media">
                  {["Photography","Videography","Graphic Design","Web Design"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="🚗 Retail & Auto">
                  {["Auto Repair","Car Dealership","Clothing Boutique","Jewelry Store","Florist"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="📚 Education & Childcare">
                  {["Tutoring","Childcare & Daycare","Music School","Martial Arts"].map(i => <option key={i}>{i}</option>)}
                </optgroup>
                <optgroup label="✨ Other">
                  <option>Other (describe below)</option>
                </optgroup>
              </select>
            </div>
            {isOther && (
              <div className={styles.customIndustryWrap}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Describe your business (e.g. &apos;I repair vintage watches&apos; or &apos;I do wedding makeup&apos;)"
                  value={customIndustry}
                  onChange={e => { setCustomIndustry(e.target.value); setAiIndustry(""); }}
                  onBlur={handleCustomIndustryBlur}
                  disabled={phase !== "idle" && phase !== "done"}
                  maxLength={80}
                />
                {aiLoading && <div className={styles.aiDetecting}>🤖 Identifying your business type...</div>}
                {aiIndustry && !aiLoading && <div className={styles.aiDetected}>✓ Identified as: <strong>{aiIndustry}</strong> — we&apos;ll build content tailored to this</div>}
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Design style */}
        <div className={styles.setupRow}>
          <div className={styles.setupStep}>
            <div className={styles.setupStepNum}>2</div>
            <div className={styles.setupStepLabel}>Choose your design</div>
          </div>
          <div className={styles.styleGrid}>
            {designStyles.map(ds => (
              <button
                key={ds.id}
                className={`${styles.styleCard} ${styleId === ds.id ? styles.styleCardActive : ""}`}
                onClick={() => setStyleId(ds.id)}
                disabled={phase !== "idle" && phase !== "done"}
              >
                <div className={styles.stylePreview} style={{
                  background: ds.id === "minimal" ? "#ffffff" : ds.id === "bold" ? "#0d1117" : "#fef3e2",
                  border: `2px solid ${ds.id === "minimal" ? "#e5e7eb" : ds.id === "bold" ? "#30363d" : "#fde8c8"}`,
                }}>
                  <div style={{ width: "100%", height: "8px", background: ds.id === "minimal" ? "#ffffff" : ds.id === "bold" ? "#161b22" : "#fffbf5", borderBottom: `1px solid ${ds.id === "minimal" ? "#e5e7eb" : ds.id === "bold" ? "#30363d" : "#e7e5e4"}`, marginBottom: "4px" }} />
                  <div style={{ padding: "0 6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ width: "60%", height: "5px", borderRadius: "2px", background: ds.id === "minimal" ? "#0d1b2a" : ds.id === "bold" ? "#e2e8f0" : "#292524", opacity: 0.8 }} />
                    <div style={{ width: "80%", height: "3px", borderRadius: "2px", background: ds.id === "minimal" ? "#94a3b8" : ds.id === "bold" ? "#8b949e" : "#a8a29e" }} />
                    <div style={{ display: "flex", gap: "3px", marginTop: "2px" }}>
                      <div style={{ width: "28px", height: "8px", borderRadius: "2px", background: ds.id === "minimal" ? "#2563eb" : ds.id === "bold" ? "#2563eb" : "#d97706" }} />
                      <div style={{ width: "22px", height: "8px", borderRadius: "2px", border: `1px solid ${ds.id === "minimal" ? "#2563eb" : ds.id === "bold" ? "#4a5568" : "#d97706"}`, background: "transparent" }} />
                    </div>
                  </div>
                </div>
                <div className={styles.styleInfo}>
                  <div className={styles.styleName}>{ds.name}</div>
                  <div className={styles.styleDesc}>{ds.desc}</div>
                </div>
                {styleId === ds.id && <div className={styles.styleCheck}>✓</div>}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 3: BUILD */}
        <div className={styles.setupRow} style={{ background: canRun ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.02)", borderColor: canRun ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.06)" }}>
          <div className={styles.setupStep}>
            <div className={styles.setupStepNum} style={{ background: canRun ? "#2563eb" : "#334155" }}>3</div>
            <div className={styles.setupStepLabel}>Build it</div>
          </div>
          <div className={styles.buildStepContent}>
            <div className={styles.buildStepText}>
              {canRun
                ? `Ready! We'll build ${businessName}'s website, blog posts, and social media in about 45 seconds.`
                : "Complete steps 1 and 2 above to unlock the builder."}
            </div>
            <button
              className={`${styles.buildBtn} ${!canRun && phase === "idle" ? styles.disabled : ""}`}
              onClick={phase === "done" ? reset : runDemo}
              disabled={!canRun && phase === "idle"}
            >
              {phase === "idle" ? "⚡ Build my digital presence" : phase === "done" ? "↺ Try another business" : "⏳ Building your presence..."}
            </button>
          </div>
        </div>

        {/* DEMO OUTPUT */}
        {phase !== "idle" && (
          <div className={styles.demoArea} ref={demoRef}>
            <div className={styles.demoGrid}>

              {/* WEBSITE COLUMN */}
              <div className={styles.websiteWrap}>
                <div className={styles.stepHeaderSmall}>
                  <div className={`${styles.stepIcon} ${websiteProgress === 100 ? styles.done : styles.building}`}>
                    {websiteProgress === 100 ? "✓" : "🌐"}
                  </div>
                  <span className={styles.stepTitle}>Your website</span>
                  {phase === "done" && (
                    <div className={styles.styleToggle}>
                      {designStyles.map(ds => (
                        <button
                          key={ds.id}
                          className={`${styles.styleToggleBtn} ${styleId === ds.id ? styles.styleToggleBtnActive : ""}`}
                          onClick={() => setStyleId(ds.id)}
                          title={ds.name}
                        >
                          {ds.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={styles.progressPill} style={{ marginLeft: phase === "done" ? "0" : "auto" }}>{websiteProgress}%</div>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${websiteProgress}%`, background: "#2563eb" }} />
                </div>

                {/* BROWSER */}
                <div className={styles.browser}>
                  <div className={styles.browserChrome}>
                    <div className={styles.browserDots}><span /><span /><span /></div>
                    <div className={styles.browserUrl}>{websiteProgress > 0 ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "generating..."}</div>
                    <div className={styles.browserActions}>↺ ⋯</div>
                  </div>
                  <div className={styles.browserBody} style={{ maxHeight: "480px", overflowY: "auto" }}>
                    {websiteProgress === 0 && (
                      <div className={styles.buildingScreen}>
                        <div className={styles.buildingDot} /><div className={styles.buildingDot} /><div className={styles.buildingDot} />
                      </div>
                    )}
                    {websiteProgress === 100 && websiteSection >= 4 ? (
                      <MockHomepage name={name} industry={industry} data={data} themeId={styleId} />
                    ) : websiteProgress > 0 ? (
                      <div style={{ fontFamily: "system-ui", background: t.bg, fontSize: "10px" }}>
                        {/* Building state - partial site */}
                        <div style={{ background: t.nav, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.serviceBorder}` }}>
                          <div style={{ fontWeight: 800, color: t.navText, fontSize: "12px" }}>{data.emoji} {typedHeadline || "​"}<span style={{ animation: "blink 0.8s infinite", color: data.accent }}>|</span></div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {data.pages.slice(0, visiblePages).map((p, i) => (
                              <span key={i} style={{ color: t.navText, opacity: 0.7, fontSize: "9px" }}>{p}</span>
                            ))}
                          </div>
                        </div>
                        {websiteSection >= 1 && (
                          <div style={{ background: t.hero, padding: "22px 16px" }}>
                            <div style={{ fontSize: "17px", fontWeight: 800, color: t.heroText, marginBottom: "6px" }}>{name}</div>
                            <div style={{ fontSize: "10px", color: t.heroSub, marginBottom: "12px", maxWidth: "280px", lineHeight: 1.6 }}>{data.tagline}</div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <span style={{ background: data.accent, color: "#fff", padding: "5px 12px", borderRadius: "5px", fontSize: "9px", fontWeight: 700 }}>{data.cta}</span>
                            </div>
                          </div>
                        )}
                        {websiteSection >= 2 && (
                          <div style={{ height: "80px", backgroundImage: `url(${data.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        )}
                        {websiteSection >= 3 && (
                          <div style={{ padding: "12px 14px", background: t.bg2 }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: t.serviceTitle, marginBottom: "8px" }}>Our Services</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                              {data.services.map((svc, i) => (
                                <div key={i} style={{ background: t.serviceBg, border: `1px solid ${t.serviceBorder}`, borderTop: `2px solid ${data.accent}`, borderRadius: "5px", padding: "6px 8px", fontSize: "9px", color: t.serviceTitle, fontWeight: 600 }}>{svc}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {websiteSection >= 4 && (
                          <div style={{ padding: "10px 14px", background: t.testimonialBg, borderLeft: `3px solid ${data.accent}` }}>
                            <div style={{ color: t.stars, fontSize: "10px", marginBottom: "4px" }}>★★★★★</div>
                            <div style={{ fontSize: "9px", color: t.testimonialText, fontStyle: "italic" }}>"{data.testimonial.text}"</div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* BLOG + SOCIAL COLUMN */}
              <div className={styles.rightCol}>
                <div className={styles.step}>
                  <div className={styles.stepHeaderSmall}>
                    <div className={`${styles.stepIcon} ${blogProgress === 100 ? styles.done : phase === "blog" ? styles.building : styles.waiting}`}>
                      {blogProgress === 100 ? "✓" : "✍️"}
                    </div>
                    <span className={styles.stepTitle}>Blog posts</span>
                    <div className={styles.progressPill} style={{ marginLeft: "auto" }}>{blogProgress}%</div>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${blogProgress}%`, background: "#10b981" }} />
                  </div>
                  {phase === "blog" && blogProgress < 100 && <div className={styles.waitingMsg} style={{ color: "#10b981" }}>Researching keywords & writing posts...</div>}
                  {blogProgress === 0 && phase !== "blog" && <div className={styles.waitingMsg}>Queued — starts after website</div>}
                  {blogProgress === 100 && (
                    <div className={styles.blogList}>
                      {data.blogs.slice(0, visibleBlogs).map((b, i) => (
                        <div key={i} className={styles.blogItem}>
                          <div className={styles.blogNum}>{i + 1}</div>
                          <div>
                            <div className={styles.blogTitle}>{b}</div>
                            <div className={styles.blogMeta}>~800 words · SEO optimized · Ready to publish</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.step}>
                  <div className={styles.stepHeaderSmall}>
                    <div className={`${styles.stepIcon} ${socialProgress === 100 ? styles.done : phase === "social" ? styles.building : styles.waiting}`}>
                      {socialProgress === 100 ? "✓" : "📱"}
                    </div>
                    <span className={styles.stepTitle}>Social media</span>
                    <div className={styles.progressPill} style={{ marginLeft: "auto" }}>{socialProgress}%</div>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${socialProgress}%`, background: "#f59e0b" }} />
                  </div>
                  {phase === "social" && socialProgress < 100 && <div className={styles.waitingMsg} style={{ color: "#f59e0b" }}>Setting up FB · IG · LinkedIn...</div>}
                  {socialProgress === 0 && phase !== "social" && <div className={styles.waitingMsg}>Queued — starts after blog posts</div>}
                  {socialProgress === 100 && (
                    <div className={styles.socialList}>
                      {visibleSocial >= 1 && (
                        <div className={styles.fbCard}>
                          <div className={styles.fbHeader}><div className={styles.fbLogo}>f</div><span className={styles.fbPlatform}>Facebook</span></div>
                          <div className={styles.fbPost}>
                            <div className={styles.fbAvatar} style={{ background: data.accent }}>{name.charAt(0)}</div>
                            <div className={styles.fbBody}>
                              <div className={styles.fbName}>{name}<span className={styles.fbBadge}>✓</span></div>
                              <div className={styles.fbTime}>Just now · 🌐</div>
                              <div className={styles.fbText}>{data.posts[0]}</div>
                              <div className={styles.fbImage} style={{ backgroundImage: `url(${data.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                              <div className={styles.fbActions}><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {visibleSocial >= 2 && (
                        <div className={styles.igCard}>
                          <div className={styles.igHeader}>
                            <div className={styles.igLogo}><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
                            <span className={styles.igPlatform}>Instagram</span>
                          </div>
                          <div className={styles.igPost}>
                            <div className={styles.igTopBar}>
                              <div className={styles.igAvatarWrap}><div className={styles.igAvatar} style={{ background: data.accent }}>{name.charAt(0)}</div></div>
                              <div className={styles.igHandle}><div className={styles.igName}>{name.toLowerCase().replace(/\s+/g, "_")}</div><div className={styles.igSub}>Sponsored</div></div>
                              <div className={styles.igMore}>···</div>
                            </div>
                            <div className={styles.igImg} style={{ backgroundImage: `url(${data.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                            <div className={styles.igFooter}>
                              <div className={styles.igReactions}><span>❤️</span><span>💬</span><span>✈️</span><span style={{ marginLeft: "auto" }}>🔖</span></div>
                              <div className={styles.igLikes}>127 likes</div>
                              <div className={styles.igCaption}><strong>{name.toLowerCase().replace(/\s+/g, "_")}</strong> {data.posts[1]}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {visibleSocial >= 3 && (
                        <div className={styles.liCard}>
                          <div className={styles.liHeader}><div className={styles.liLogo}>in</div><span className={styles.liPlatform}>LinkedIn</span></div>
                          <div className={styles.liPost}>
                            <div className={styles.liTopBar}>
                              <div className={styles.liAvatar} style={{ background: data.accent }}>{name.charAt(0)}</div>
                              <div><div className={styles.liName}>{name}</div><div className={styles.liSub}>Local Business · 1st</div><div className={styles.liTime}>Just now · 🌐</div></div>
                            </div>
                            <div className={styles.liText}>{data.posts[2]}</div>
                            <div className={styles.liImg} style={{ backgroundImage: `url(${data.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                            <div className={styles.liActions}><span>👍 Like</span><span>💬 Comment</span><span>🔁 Repost</span><span>✉️ Send</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {phase === "done" && (
              <>
                <div className={styles.doneCard}>
                  <div className={styles.doneIcon}>🎉</div>
                  <h3 className={styles.doneTitle}>{name} is live!</h3>
                  <p className={styles.doneSub}>Website, {data.blogs.length} blog posts & 3 social channels — built in under 60 seconds. This is exactly what we do for real businesses.</p>
                  <div className={styles.doneMeta}>
                    <div className={styles.doneMetaItem}><span>⏱</span> 47 seconds</div>
                    <div className={styles.doneMetaItem}><span>🌐</span> Full website</div>
                    <div className={styles.doneMetaItem}><span>✍️</span> {data.blogs.length} posts</div>
                    <div className={styles.doneMetaItem}><span>📱</span> 3 channels</div>
                  </div>
                  <button className={styles.doneBtn} onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
                    Get this for my real business →
                  </button>
                </div>

                <div className={styles.sampleBlogs}>
                  <div className={styles.sampleBlogsHeader}>
                    <div className={styles.sampleBlogsTitle}>📝 Here&apos;s a sample of the blog posts we&apos;d write for {name}</div>
                    <div className={styles.sampleBlogsSub}>Every week, a fully written SEO-optimized post — published automatically to your site.</div>
                  </div>
                  <div className={styles.sampleBlogsList}>
                    {data.blogs.map((title: string, i: number) => (
                      <div key={i} className={styles.sampleBlogCard}>
                        <div className={styles.sampleBlogNum}>{i + 1}</div>
                        <div className={styles.sampleBlogContent}>
                          <div className={styles.sampleBlogTitle}>{title}</div>
                          <div className={styles.sampleBlogMeta}><span>~800 words</span><span>·</span><span>SEO optimized</span><span>·</span><span>Auto-published Monday</span></div>
                          <div className={styles.sampleBlogPreview}>
                            {i === 0 && `A practical guide for ${industry} customers covering everything they need to know.`}
                            {i === 1 && `An educational post that positions ${name} as the local expert.`}
                            {i === 2 && `A helpful resource your customers will search for — drives organic traffic.`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.sampleBlogsNote}>
                    Want to see a full sample post?{" "}
                    <a href="/blog/5-signs-you-need-a-new-water-heater" className={styles.sampleBlogsLink} target="_blank" rel="noreferrer">Read one here →</a>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import { useState, useRef } from "react";
import styles from "./Demo.module.css";

const industries = [
  "Plumbing", "Bakery", "Law Firm", "Real Estate", "Dental",
  "Gym & Fitness", "Restaurant", "Photography", "Landscaping", "Auto Repair",
];

const industryData: Record<string, {
  color: string; accent: string; emoji: string; tagline: string; cta: string;
  image: string;
  services: string[]; stats: { num: string; label: string }[];
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
};

type Phase = "idle" | "building" | "website" | "blog" | "social" | "done";

export default function Demo() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [websiteProgress, setWebsiteProgress] = useState(0);
  const [blogProgress, setBlogProgress] = useState(0);
  const [socialProgress, setSocialProgress] = useState(0);
  const [visibleBlogs, setVisibleBlogs] = useState(0);
  const [visibleSocial, setVisibleSocial] = useState(0);
  const [websiteSection, setWebsiteSection] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState("");
  const [visiblePages, setVisiblePages] = useState(0);
  const demoRef = useRef<HTMLDivElement>(null);

  const data = industryData[industry] || industryData["Plumbing"];
  const name = businessName || "Your Business";

  const reset = () => {
    setPhase("idle"); setWebsiteProgress(0); setBlogProgress(0); setSocialProgress(0);
    setVisibleBlogs(0); setVisibleSocial(0); setWebsiteSection(0); setTypedHeadline(""); setVisiblePages(0);
  };

  const runDemo = async () => {
    if (!businessName || !industry) return;
    reset();
    await new Promise(r => setTimeout(r, 50));
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPhase("building");
    await new Promise(r => setTimeout(r, 400));
    setPhase("website");

    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setWebsiteProgress(i); }
    setWebsiteProgress(100);
    for (let i = 1; i <= data.pages.length; i++) { await new Promise(r => setTimeout(r, 70)); setVisiblePages(i); }
    const hl = name;
    for (let i = 0; i <= hl.length; i++) { await new Promise(r => setTimeout(r, 45)); setTypedHeadline(hl.slice(0, i)); }
    for (let i = 1; i <= 4; i++) { await new Promise(r => setTimeout(r, 350)); setWebsiteSection(i); }
    await new Promise(r => setTimeout(r, 500));

    setPhase("blog");
    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setBlogProgress(i); }
    setBlogProgress(100);
    for (let i = 1; i <= 3; i++) { await new Promise(r => setTimeout(r, 380)); setVisibleBlogs(i); }
    await new Promise(r => setTimeout(r, 400));

    setPhase("social");
    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setSocialProgress(i); }
    setSocialProgress(100);
    for (let i = 1; i <= 3; i++) { await new Promise(r => setTimeout(r, 320)); setVisibleSocial(i); }
    await new Promise(r => setTimeout(r, 400));
    setPhase("done");
  };

  const canRun = businessName.trim().length > 1 && industry.length > 0;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>See it in action</p>
          <h2 className={styles.title}>Watch your business go live<br />in under 60 seconds</h2>
          <p className={styles.sub}>Type your business name, pick your industry, and watch us build your entire digital presence in real time.</p>
        </div>

        <div className={styles.inputRow}>
          <input className={styles.input} type="text" placeholder="e.g. Mike's Plumbing" value={businessName}
            onChange={e => setBusinessName(e.target.value)} disabled={phase !== "idle" && phase !== "done"} maxLength={40}
            onKeyDown={e => e.key === "Enter" && canRun && runDemo()} />
          <select className={styles.select} value={industry} onChange={e => setIndustry(e.target.value)} disabled={phase !== "idle" && phase !== "done"}>
            <option value="">Pick your industry</option>
            {industries.map(i => <option key={i}>{i}</option>)}
          </select>
          <button className={`${styles.buildBtn} ${!canRun && phase === "idle" ? styles.disabled : ""}`}
            onClick={phase === "done" ? reset : runDemo} disabled={!canRun && phase === "idle"}>
            {phase === "idle" ? "⚡ Build my presence" : phase === "done" ? "↺ Try another" : "⏳ Building..."}
          </button>
        </div>

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
                  <div className={styles.progressPill} style={{ marginLeft: "auto" }}>{websiteProgress}%</div>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${websiteProgress}%`, background: "#2563eb" }} />
                </div>

                <div className={styles.browser}>
                  <div className={styles.browserChrome}>
                    <div className={styles.browserDots}><span /><span /><span /></div>
                    <div className={styles.browserUrl}>{websiteProgress > 0 ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "generating..."}</div>
                    <div className={styles.browserActions}>↺ ⋯</div>
                  </div>
                  <div className={styles.browserBody}>
                    {websiteProgress === 0 && (
                      <div className={styles.buildingScreen}>
                        <div className={styles.buildingDot} /><div className={styles.buildingDot} /><div className={styles.buildingDot} />
                      </div>
                    )}
                    {websiteProgress > 0 && (
                      <div className={styles.siteWrap}>
                        <div className={styles.siteNav} style={{ background: data.color }}>
                          <div className={styles.siteLogo}>{data.emoji} {typedHeadline || "​"}</div>
                          <div className={styles.siteNavLinks}>
                            {data.pages.slice(0, visiblePages).map((p, i) => (
                              <span key={i} className={`${styles.siteNavLink} ${i === data.pages.length - 1 ? styles.siteNavCta : ""}`}
                                style={i === data.pages.length - 1 ? { background: data.accent } : {}}>{p}</span>
                            ))}
                          </div>
                        </div>

                        {websiteSection >= 1 && (
                          <div className={styles.siteHero}>
                            <div className={styles.siteHeroImg}
                              style={{ backgroundImage: `url(${data.image})` }}>
                              <div className={styles.siteHeroOverlay} style={{ background: `linear-gradient(135deg, ${data.color}ee 0%, ${data.color}99 60%, transparent 100%)` }} />
                              <div className={styles.siteHeroContent}>
                                <div className={styles.siteHeroBadge} style={{ borderColor: `${data.accent}80`, color: data.accent }}>{industry} Services</div>
                                <h1 className={styles.siteHeroH1}>{name}</h1>
                                <p className={styles.siteHeroSub}>{data.tagline}</p>
                                <div className={styles.siteHeroBtns}>
                                  <div className={styles.siteHeroBtn} style={{ background: data.accent }}>{data.cta}</div>
                                  <div className={styles.siteHeroBtnOut}>Learn More</div>
                                </div>
                              </div>
                            </div>
                            <div className={styles.siteHeroStats} style={{ background: data.color }}>
                              {data.stats.map((s, i) => (
                                <div key={i} className={styles.siteStat}>
                                  <div className={styles.siteStatNum}>{s.num}</div>
                                  <div className={styles.siteStatLabel}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {websiteSection >= 2 && (
                          <div className={styles.siteServices}>
                            <div className={styles.siteSectionTitle}>What We Offer</div>
                            <div className={styles.siteServicesGrid}>
                              {data.services.map((s, i) => (
                                <div key={i} className={styles.siteServiceCard} style={{ borderTop: `2px solid ${data.accent}` }}>
                                  <div className={styles.siteServiceDot} style={{ background: data.accent }} />
                                  <div className={styles.siteServiceName}>{s}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {websiteSection >= 3 && (
                          <div className={styles.siteReview} style={{ borderLeft: `3px solid ${data.accent}` }}>
                            <div className={styles.siteReviewStars} style={{ color: data.accent }}>★★★★★</div>
                            <p className={styles.siteReviewText}>"{data.testimonial.text}"</p>
                            <div className={styles.siteReviewAuthor}>— {data.testimonial.name}, {data.testimonial.role}</div>
                          </div>
                        )}

                        {websiteSection >= 4 && (
                          <div className={styles.siteFooter} style={{ background: data.color }}>
                            <div className={styles.siteFooterLogo}>{data.emoji} {name}</div>
                            <div className={styles.siteFooterLinks}>
                              {data.pages.slice(0, 4).map((p, i) => <span key={i}>{p}</span>)}
                            </div>
                            <div className={styles.siteFooterCopy}>© 2026 {name}. All rights reserved.</div>
                          </div>
                        )}
                      </div>
                    )}
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

                      {/* FACEBOOK POST */}
                      {visibleSocial >= 1 && (
                        <div className={styles.fbCard}>
                          <div className={styles.fbHeader}>
                            <div className={styles.fbLogo}>f</div>
                            <span className={styles.fbPlatform}>Facebook</span>
                          </div>
                          <div className={styles.fbPost}>
                            <div className={styles.fbAvatar} style={{ background: data.accent }}>
                              {name.charAt(0)}
                            </div>
                            <div className={styles.fbBody}>
                              <div className={styles.fbName}>{name}
                                <span className={styles.fbBadge}>✓</span>
                              </div>
                              <div className={styles.fbTime}>Just now · 🌐</div>
                              <div className={styles.fbText}>{data.posts[0]}</div>
                              <div className={styles.fbImage} style={{
                                backgroundImage: `url(${data.image})`,
                                backgroundSize: "cover", backgroundPosition: "center"
                              }} />
                              <div className={styles.fbActions}>
                                <span>👍 Like</span>
                                <span>💬 Comment</span>
                                <span>↗ Share</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* INSTAGRAM POST */}
                      {visibleSocial >= 2 && (
                        <div className={styles.igCard}>
                          <div className={styles.igHeader}>
                            <div className={styles.igLogo}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </div>
                            <span className={styles.igPlatform}>Instagram</span>
                          </div>
                          <div className={styles.igPost}>
                            <div className={styles.igTopBar}>
                              <div className={styles.igAvatarWrap}>
                                <div className={styles.igAvatar} style={{ background: data.accent }}>{name.charAt(0)}</div>
                              </div>
                              <div className={styles.igHandle}>
                                <div className={styles.igName}>{name.toLowerCase().replace(/\s+/g, "_")}</div>
                                <div className={styles.igSub}>Sponsored</div>
                              </div>
                              <div className={styles.igMore}>···</div>
                            </div>
                            <div className={styles.igImg} style={{
                              backgroundImage: `url(${data.image})`,
                              backgroundSize: "cover", backgroundPosition: "center"
                            }} />
                            <div className={styles.igFooter}>
                              <div className={styles.igReactions}>
                                <span>❤️</span><span>💬</span><span>✈️</span>
                                <span style={{ marginLeft: "auto" }}>🔖</span>
                              </div>
                              <div className={styles.igLikes}>127 likes</div>
                              <div className={styles.igCaption}>
                                <strong>{name.toLowerCase().replace(/\s+/g, "_")}</strong> {data.posts[1]}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* LINKEDIN POST */}
                      {visibleSocial >= 3 && (
                        <div className={styles.liCard}>
                          <div className={styles.liHeader}>
                            <div className={styles.liLogo}>in</div>
                            <span className={styles.liPlatform}>LinkedIn</span>
                          </div>
                          <div className={styles.liPost}>
                            <div className={styles.liTopBar}>
                              <div className={styles.liAvatar} style={{ background: data.accent }}>{name.charAt(0)}</div>
                              <div>
                                <div className={styles.liName}>{name}</div>
                                <div className={styles.liSub}>Local Business · 1st</div>
                                <div className={styles.liTime}>Just now · 🌐</div>
                              </div>
                            </div>
                            <div className={styles.liText}>{data.posts[2]}</div>
                            <div className={styles.liImg} style={{
                              backgroundImage: `url(${data.image})`,
                              backgroundSize: "cover", backgroundPosition: "center"
                            }} />
                            <div className={styles.liActions}>
                              <span>👍 Like</span>
                              <span>💬 Comment</span>
                              <span>🔁 Repost</span>
                              <span>✉️ Send</span>
                            </div>
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

                {/* SAMPLE BLOG POSTS FOR THIS INDUSTRY */}
                <div className={styles.sampleBlogs}>
                  <div className={styles.sampleBlogsHeader}>
                    <div className={styles.sampleBlogsTitle}>
                      📝 Here's a sample of the blog posts we'd write for {name}
                    </div>
                    <div className={styles.sampleBlogsSub}>
                      Every week, a fully written SEO-optimized post — published automatically to your site.
                    </div>
                  </div>
                  <div className={styles.sampleBlogsList}>
                    {data.blogs.map((title: string, i: number) => (
                      <div key={i} className={styles.sampleBlogCard}>
                        <div className={styles.sampleBlogNum}>{i + 1}</div>
                        <div className={styles.sampleBlogContent}>
                          <div className={styles.sampleBlogTitle}>{title}</div>
                          <div className={styles.sampleBlogMeta}>
                            <span>~800 words</span>
                            <span>·</span>
                            <span>SEO optimized</span>
                            <span>·</span>
                            <span>Auto-published Monday</span>
                          </div>
                          <div className={styles.sampleBlogPreview}>
                            {i === 0 && `A practical guide for ${industry} customers covering everything they need to know — the kind of content that ranks on Google and brings new clients to your door every week.`}
                            {i === 1 && `An educational post that positions ${name} as the local expert — written in your voice, tailored to your market, and ready to share on social media.`}
                            {i === 2 && `A helpful resource your customers will actually search for — designed to drive organic traffic and convert readers into paying customers.`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.sampleBlogsNote}>
                    Want to see a full sample post?{" "}
                    <a href="/blog/5-signs-you-need-a-new-water-heater" className={styles.sampleBlogsLink} target="_blank" rel="noreferrer">
                      Read one here →
                    </a>
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

"use client";

import { useState, useRef } from "react";
import styles from "./Demo.module.css";

const industries = [
  "Plumbing", "Bakery", "Law Firm", "Real Estate", "Dental",
  "Gym & Fitness", "Restaurant", "Photography", "Landscaping", "Auto Repair",
];

const industryData: Record<string, {
  color: string; accent: string; emoji: string; tagline: string; cta: string;
  services: string[]; stats: { num: string; label: string }[];
  testimonial: { text: string; name: string; role: string };
  blogs: string[]; posts: string[]; pages: string[];
}> = {
  "Plumbing": {
    color: "#1e3a5f", accent: "#2563eb", emoji: "🔧",
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
    for (let i = 1; i <= data.pages.length; i++) { await new Promise(r => setTimeout(r, 70)); setVisiblePages(i); }
    const hl = name;
    for (let i = 0; i <= hl.length; i++) { await new Promise(r => setTimeout(r, 45)); setTypedHeadline(hl.slice(0, i)); }
    for (let i = 1; i <= 4; i++) { await new Promise(r => setTimeout(r, 350)); setWebsiteSection(i); }
    await new Promise(r => setTimeout(r, 500));

    setPhase("blog");
    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setBlogProgress(i); }
    for (let i = 1; i <= data.blogs.length; i++) { await new Promise(r => setTimeout(r, 380)); setVisibleBlogs(i); }
    await new Promise(r => setTimeout(r, 400));

    setPhase("social");
    for (let i = 0; i <= 100; i += 3) { await new Promise(r => setTimeout(r, 12)); setSocialProgress(i); }
    for (let i = 1; i <= data.posts.length; i++) { await new Promise(r => setTimeout(r, 320)); setVisibleSocial(i); }
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
                          <div className={styles.siteHero} style={{ background: `linear-gradient(135deg, ${data.color} 0%, ${data.accent}44 100%)` }}>
                            <div className={styles.siteHeroBadge} style={{ borderColor: `${data.accent}60`, color: data.accent }}>{industry} Services</div>
                            <h1 className={styles.siteHeroH1}>{name}</h1>
                            <p className={styles.siteHeroSub}>{data.tagline}</p>
                            <div className={styles.siteHeroBtns}>
                              <div className={styles.siteHeroBtn} style={{ background: data.accent }}>{data.cta}</div>
                              <div className={styles.siteHeroBtnOut}>Learn More</div>
                            </div>
                            <div className={styles.siteHeroStats}>
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
                      {data.posts.slice(0, visibleSocial).map((p, i) => (
                        <div key={i} className={styles.socialPost}>
                          <div className={styles.socialAvatar} style={{ background: `${data.accent}25`, color: data.accent }}>{name.charAt(0)}</div>
                          <div className={styles.socialContent}>
                            <div className={styles.socialName}>{name}</div>
                            <div className={styles.socialText}>{p}</div>
                            <div className={styles.socialActions}><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {phase === "done" && (
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
            )}
          </div>
        )}
      </div>
    </section>
  );
}

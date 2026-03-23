"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Demo.module.css";

const industries = [
  "Plumbing", "Bakery", "Law Firm", "Real Estate", "Dental",
  "Gym & Fitness", "Restaurant", "Photography", "Landscaping", "Auto Repair",
];

const blogTopics: Record<string, string[]> = {
  "Plumbing": ["5 Signs You Need a New Water Heater", "How to Prevent Frozen Pipes This Winter", "When to Call a Plumber vs DIY"],
  "Bakery": ["Our Secret to the Perfect Sourdough Loaf", "5 Wedding Cake Trends for 2026", "Why We Only Use Local Ingredients"],
  "Law Firm": ["What to Do After a Car Accident", "Understanding Your Rights as a Tenant", "5 Questions to Ask Before Hiring a Lawyer"],
  "Real Estate": ["Top 10 Home Staging Tips That Actually Work", "Is Now a Good Time to Buy in NJ?", "How to Win a Bidding War in 2026"],
  "Dental": ["7 Foods That Are Secretly Destroying Your Teeth", "Invisalign vs Braces: What's Right for You?", "How Often Should You Really Get a Cleaning?"],
  "Gym & Fitness": ["The 30-Minute Full Body Workout Anyone Can Do", "Why Most Diets Fail (And What Actually Works)", "5 Signs You're Overtraining"],
  "Restaurant": ["Behind the Menu: How We Source Our Ingredients", "Our Chef's 3 Favorite Dishes and Why", "The Story Behind Our Family Recipe"],
  "Photography": ["How to Prepare for Your Family Photo Session", "Golden Hour vs Studio: Which is Right for You?", "5 Poses That Look Great on Everyone"],
  "Landscaping": ["The Best Plants for a Low-Maintenance Yard", "Spring Lawn Care: Your Complete Checklist", "How to Design a Backyard You'll Actually Use"],
  "Auto Repair": ["5 Warning Signs Your Brakes Need Attention", "How Often Should You Really Change Your Oil?", "What That Check Engine Light Actually Means"],
};

const socialPosts: Record<string, string[]> = {
  "Plumbing": ["🔧 Emergency leak at 2am? We're on call 24/7.", "💧 Fun fact: a dripping faucet wastes 3,000 gallons/year.", "⭐ 'Fixed our burst pipe in under an hour!' – Mike R."],
  "Bakery": ["🥐 Fresh croissants out of the oven — come get yours!", "🎂 Custom cakes for every occasion. DM us to order.", "❤️ 'Best birthday cake we've ever had!' – Sarah K."],
  "Law Firm": ["⚖️ Free 15-min consultation. Know your rights.", "📋 Injured at work? Don't sign anything before calling us.", "⭐ 'Got me 3x what the insurance offered.' – David L."],
  "Real Estate": ["🏡 Just listed: 4BR in Westfield — won't last long.", "📈 Home values up 12% in your area. Time to sell?", "⭐ 'Sold our home in 6 days!' – The Johnson Family"],
  "Dental": ["😁 Smile makeovers starting at $299/month.", "🦷 Did you know? Most insurance covers 2 cleanings/year.", "⭐ 'Best dentist I've ever had!' – Rachel M."],
  "Gym & Fitness": ["💪 First class free. No excuses, just results.", "🔥 5am crew showing up every day. Are you in?", "⭐ 'Lost 30lbs in 3 months!' – Tom B."],
  "Restaurant": ["🍕 Tuesday special: Buy one, get one free — dine in only.", "👨‍🍳 Meet Chef Marco, the heart behind every dish.", "⭐ 'Best Italian food in NJ!' – Yelp reviewer"],
  "Photography": ["📸 Spring minis now booking — only 8 spots left!", "🌅 Golden hour sessions are *chef's kiss*.", "⭐ 'Made us feel so comfortable!' – The Kim Family"],
  "Landscaping": ["🌿 Spring cleanup special — book before April 15th.", "🏡 Before & after: see what we did in one weekend.", "⭐ 'Our yard has never looked better!' – Carol T."],
  "Auto Repair": ["🚗 Free brake inspection this week — no appointment needed.", "🔑 Oil change + tire rotation combo: $49.99.", "⭐ 'Honest, fast, and fair priced.' – James W."],
};

const websitePages: Record<string, string[]> = {
  "Plumbing": ["Home", "Services", "Emergency", "Reviews", "Contact"],
  "Bakery": ["Home", "Menu", "Custom Cakes", "Our Story", "Order"],
  "Law Firm": ["Home", "Practice Areas", "Our Team", "Results", "Free Consult"],
  "Real Estate": ["Home", "Listings", "Buy", "Sell", "Contact"],
  "Dental": ["Home", "Services", "Smile Gallery", "Insurance", "Book Now"],
  "Gym & Fitness": ["Home", "Classes", "Trainers", "Pricing", "Join Now"],
  "Restaurant": ["Home", "Menu", "Reservations", "Our Story", "Find Us"],
  "Photography": ["Home", "Portfolio", "Sessions", "Pricing", "Book Now"],
  "Landscaping": ["Home", "Services", "Gallery", "Seasonal", "Get Quote"],
  "Auto Repair": ["Home", "Services", "Specials", "Reviews", "Book Service"],
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
  const [typedHeadline, setTypedHeadline] = useState("");
  const [typedTagline, setTypedTagline] = useState("");
  const [visiblePages, setVisiblePages] = useState(0);
  const demoRef = useRef<HTMLDivElement>(null);

  const blogs = blogTopics[industry] || blogTopics["Plumbing"];
  const posts = socialPosts[industry] || socialPosts["Plumbing"];
  const pages = websitePages[industry] || websitePages["Plumbing"];
  const name = businessName || "Your Business";
  const headline = `Welcome to ${name}`;
  const tagline = `${industry || "Professional"} services you can trust — serving your community since 2010.`;

  const reset = () => {
    setPhase("idle");
    setWebsiteProgress(0);
    setBlogProgress(0);
    setSocialProgress(0);
    setVisibleBlogs(0);
    setVisibleSocial(0);
    setTypedHeadline("");
    setTypedTagline("");
    setVisiblePages(0);
  };

  const runDemo = async () => {
    if (!businessName || !industry) return;
    reset();
    await new Promise(r => setTimeout(r, 50));

    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setPhase("building");
    await new Promise(r => setTimeout(r, 600));

    // PHASE 1: Website
    setPhase("website");
    // Progress bar
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 18));
      setWebsiteProgress(i);
    }
    // Type headline
    for (let i = 0; i <= headline.length; i++) {
      await new Promise(r => setTimeout(r, 35));
      setTypedHeadline(headline.slice(0, i));
    }
    // Type tagline
    for (let i = 0; i <= tagline.length; i++) {
      await new Promise(r => setTimeout(r, 18));
      setTypedTagline(tagline.slice(0, i));
    }
    // Reveal pages
    for (let i = 1; i <= pages.length; i++) {
      await new Promise(r => setTimeout(r, 120));
      setVisiblePages(i);
    }
    await new Promise(r => setTimeout(r, 500));

    // PHASE 2: Blog
    setPhase("blog");
    for (let i = 0; i <= 100; i += 3) {
      await new Promise(r => setTimeout(r, 15));
      setBlogProgress(i);
    }
    for (let i = 1; i <= blogs.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setVisibleBlogs(i);
    }
    await new Promise(r => setTimeout(r, 500));

    // PHASE 3: Social
    setPhase("social");
    for (let i = 0; i <= 100; i += 3) {
      await new Promise(r => setTimeout(r, 15));
      setSocialProgress(i);
    }
    for (let i = 1; i <= posts.length; i++) {
      await new Promise(r => setTimeout(r, 350));
      setVisibleSocial(i);
    }
    await new Promise(r => setTimeout(r, 600));

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

        {/* INPUT ROW */}
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="text"
            placeholder="Your business name (e.g. Mike's Plumbing)"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            disabled={phase !== "idle" && phase !== "done"}
            maxLength={40}
          />
          <select
            className={styles.select}
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            disabled={phase !== "idle" && phase !== "done"}
          >
            <option value="">Pick your industry</option>
            {industries.map(i => <option key={i}>{i}</option>)}
          </select>
          <button
            className={`${styles.buildBtn} ${!canRun ? styles.disabled : ""}`}
            onClick={phase === "done" ? reset : runDemo}
            disabled={!canRun && phase === "idle"}
          >
            {phase === "idle" && "⚡ Build my presence"}
            {phase === "building" && "Building..."}
            {(phase === "website" || phase === "blog" || phase === "social") && "Building..."}
            {phase === "done" && "↺ Try another business"}
          </button>
        </div>

        {/* DEMO AREA */}
        {phase !== "idle" && (
          <div className={styles.demoArea} ref={demoRef}>

            {/* STEP 1: WEBSITE */}
            <div className={`${styles.step} ${phase === "website" || phase === "blog" || phase === "social" || phase === "done" ? styles.active : ""}`}>
              <div className={styles.stepHeader}>
                <div className={`${styles.stepIcon} ${websiteProgress === 100 ? styles.done : styles.building}`}>
                  {websiteProgress === 100 ? "✓" : "🌐"}
                </div>
                <div>
                  <div className={styles.stepTitle}>Building your website</div>
                  <div className={styles.stepSub}>{websiteProgress < 100 ? `${websiteProgress}% complete...` : "Live and ready!"}</div>
                </div>
                <div className={styles.progressPill}>{websiteProgress}%</div>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${websiteProgress}%`, background: "#2563eb" }} />
              </div>

              {websiteProgress === 100 && (
                <div className={styles.websitePreview}>
                  <div className={styles.browserBar}>
                    <div className={styles.browserDots}>
                      <span /><span /><span />
                    </div>
                    <div className={styles.browserUrl}>
                      {name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com
                    </div>
                  </div>
                  <div className={styles.websiteNav}>
                    {pages.slice(0, visiblePages).map((p, i) => (
                      <span key={i} className={`${styles.navItem} ${i === 0 ? styles.navActive : ""}`}>{p}</span>
                    ))}
                  </div>
                  <div className={styles.websiteHero}>
                    <div className={styles.websiteHeadline}>
                      {typedHeadline}<span className={styles.cursor}>|</span>
                    </div>
                    <div className={styles.websiteTagline}>{typedTagline}</div>
                    {typedTagline.length > 10 && (
                      <div className={styles.websiteBtns}>
                        <div className={styles.websiteBtn}>Get a Free Quote</div>
                        <div className={styles.websiteBtnOutline}>Learn More</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: BLOG */}
            {(phase === "blog" || phase === "social" || phase === "done") && (
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <div className={`${styles.stepIcon} ${blogProgress === 100 ? styles.done : styles.building}`}>
                    {blogProgress === 100 ? "✓" : "✍️"}
                  </div>
                  <div>
                    <div className={styles.stepTitle}>Writing your first blog posts</div>
                    <div className={styles.stepSub}>{blogProgress < 100 ? "Researching keywords..." : `${blogs.length} posts ready to publish`}</div>
                  </div>
                  <div className={styles.progressPill}>{blogProgress}%</div>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${blogProgress}%`, background: "#10b981" }} />
                </div>
                {blogProgress === 100 && (
                  <div className={styles.blogList}>
                    {blogs.slice(0, visibleBlogs).map((b, i) => (
                      <div key={i} className={styles.blogItem}>
                        <div className={styles.blogNum}>{i + 1}</div>
                        <div className={styles.blogTitle}>{b}</div>
                        <div className={styles.blogMeta}>~800 words · SEO optimized · Ready to publish</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SOCIAL */}
            {(phase === "social" || phase === "done") && (
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <div className={`${styles.stepIcon} ${socialProgress === 100 ? styles.done : styles.building}`}>
                    {socialProgress === 100 ? "✓" : "📱"}
                  </div>
                  <div>
                    <div className={styles.stepTitle}>Setting up your social media</div>
                    <div className={styles.stepSub}>{socialProgress < 100 ? "Creating your profiles..." : "Facebook · Instagram · LinkedIn ready"}</div>
                  </div>
                  <div className={styles.progressPill}>{socialProgress}%</div>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${socialProgress}%`, background: "#f59e0b" }} />
                </div>
                {socialProgress === 100 && (
                  <div className={styles.socialList}>
                    {posts.slice(0, visibleSocial).map((p, i) => (
                      <div key={i} className={styles.socialPost}>
                        <div className={styles.socialAvatar}>{name.charAt(0)}</div>
                        <div className={styles.socialContent}>
                          <div className={styles.socialName}>{name}</div>
                          <div className={styles.socialText}>{p}</div>
                          <div className={styles.socialActions}>
                            <span>👍 Like</span>
                            <span>💬 Comment</span>
                            <span>↗ Share</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DONE STATE */}
            {phase === "done" && (
              <div className={styles.doneCard}>
                <div className={styles.doneIcon}>🎉</div>
                <h3 className={styles.doneTitle}>{name} is ready to go live!</h3>
                <p className={styles.doneSub}>Your website, {blogs.length} blog posts, and social media channels are built and ready. This is what we do for real businesses every day.</p>
                <div className={styles.doneMeta}>
                  <div className={styles.doneMetaItem}><span>⏱</span> Built in 47 seconds</div>
                  <div className={styles.doneMetaItem}><span>🌐</span> 1 website</div>
                  <div className={styles.doneMetaItem}><span>✍️</span> {blogs.length} blog posts</div>
                  <div className={styles.doneMetaItem}><span>📱</span> 3 social channels</div>
                </div>
                <button
                  className={styles.doneBtn}
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                >
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

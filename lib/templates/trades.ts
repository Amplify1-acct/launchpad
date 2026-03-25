export interface SiteData {
  business: {
    name: string;
    tagline: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    accent_color: string;
    emoji: string;
    stateLicensed?: boolean;
    serviceArea?: string;
    founded?: string;
  };
  team?: Array<{
    name: string;
    title: string;
    bio: string;
    experience: string;
    credentials: string;
    education?: string;
    barAdmissions?: string;
    specializations?: string;
    awards?: string;
    publications?: string;
    linkedin?: string;
  }>;
  website: {
    hero_image_url: string;
    interior_image_url?: string;
    about_image_url?: string;
    process_image_url?: string;
    cta_image_url?: string;
    meta_title: string;
    meta_description: string;
    keywords: string[];
    services: Array<{ name: string; description: string; icon: string; link?: string }>;
    stats: Array<{ value: string; label: string }>;
    testimonials: Array<{ name: string; text: string; rating: number; location: string }>;
    faqs: Array<{ question: string; answer: string }>;
    process_steps: Array<{ title: string; description: string }>;
  };
}

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&display=swap');`;

function css(accent: string) {
  return `
${fonts}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --accent: ${accent};
  --black: #111111;
  --dark: #1c1c1c;
  --text: #2a2a2a;
  --mid: #666;
  --light: #999;
  --white: #fff;
  --bg: #f7f7f5;
  --border: #e4e4e0;
  --radius: 3px;
  --shadow: 0 4px 24px rgba(0,0,0,0.09);
}
html { scroll-behavior: smooth; }
body { font-family: 'Barlow', sans-serif; color: var(--text); background: var(--white); line-height: 1.65; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; object-fit: cover; }
h1,h2,h3,h4 { font-family: 'Barlow Condensed', sans-serif; line-height: 1.05; letter-spacing: -0.01em; }

/* NAV */
nav { position: sticky; top: 0; z-index: 100; background: var(--white); border-bottom: 2px solid var(--border); height: 68px; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.logo { font-family: 'Barlow Condensed', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--black); letter-spacing: -0.02em; }
.logo em { color: var(--accent); font-style: normal; }
.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-links a { font-size: 0.8rem; font-weight: 600; color: var(--mid); text-transform: uppercase; letter-spacing: 0.08em; transition: color 0.2s; }
.nav-links a:hover { color: var(--accent); }
.nav-cta { background: var(--accent) !important; color: var(--white) !important; padding: 0.55rem 1.4rem !important; border-radius: var(--radius) !important; }

/* BUTTONS */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 0.9rem 2rem; font-family: 'Barlow Condensed', sans-serif; font-size: 1rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; border: none; transition: all 0.2s; }
.btn-accent { background: var(--accent); color: var(--white); }
.btn-accent:hover { filter: brightness(1.08); transform: translateY(-1px); }
.btn-dark { background: var(--black); color: var(--white); }
.btn-dark:hover { background: var(--dark); }
.btn-outline { background: transparent; color: var(--white); border: 2px solid rgba(255,255,255,0.45); }
.btn-outline:hover { border-color: var(--white); background: rgba(255,255,255,0.08); }

/* LABEL */
.label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); display: block; margin-bottom: 0.6rem; }
.section-title { font-size: clamp(2.2rem, 4vw, 3.2rem); color: var(--black); margin-bottom: 1rem; }
.section-sub { font-size: 1rem; color: var(--mid); max-width: 520px; line-height: 1.75; }

/* SECTIONS */
section { padding: 5.5rem 2.5rem; }
.container { max-width: 1160px; margin: 0 auto; }
.bg-soft { background: var(--bg); }
.bg-dark { background: var(--dark); }
.bg-black { background: var(--black); }

/* HERO */
.hero { position: relative; min-height: 640px; display: flex; align-items: center; overflow: hidden; }
.hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.15) 100%); }
.hero-content { position: relative; z-index: 1; max-width: 1160px; margin: 0 auto; padding: 6rem 2.5rem; width: 100%; }
.hero-label { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: var(--white); padding: 0.35rem 1rem; border-radius: 2px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1.5rem; }
.hero h1 { font-size: clamp(3rem, 6vw, 5rem); color: var(--white); max-width: 680px; margin-bottom: 1.25rem; text-shadow: 0 2px 20px rgba(0,0,0,0.3); }
.hero h1 em { color: var(--accent); font-style: normal; }
.hero-sub { font-size: 1.1rem; color: rgba(255,255,255,0.78); max-width: 500px; margin-bottom: 2.5rem; line-height: 1.7; }
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 3.5rem; }
.hero-trust { display: flex; gap: 2.5rem; flex-wrap: wrap; }
.trust-badge { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.75); font-size: 0.85rem; font-weight: 600; }
.trust-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }

/* ACCENT BAND */
.accent-band { background: var(--accent); padding: 1.1rem 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.accent-band-text { font-family: 'Barlow Condensed', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--white); letter-spacing: 0.02em; }
.accent-band-sub { font-size: 0.875rem; color: rgba(255,255,255,0.8); margin-top: 2px; }
.accent-band-phone { font-family: 'Barlow Condensed', sans-serif; font-size: 1.8rem; font-weight: 800; color: var(--white); letter-spacing: 0.02em; }

/* ABOUT */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
.about-images { position: relative; }
.about-img-main { border-radius: var(--radius); overflow: hidden; aspect-ratio: 4/3; }
.about-img-main img { width: 100%; height: 100%; }
.about-img-accent { position: absolute; bottom: -1.5rem; right: -1.5rem; width: 45%; border-radius: var(--radius); overflow: hidden; aspect-ratio: 1; border: 4px solid var(--white); box-shadow: var(--shadow); }
.about-img-accent img { width: 100%; height: 100%; }
.about-badges { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 2rem; }
.about-badge { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 600; color: var(--text); }
.about-badge-check { width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: var(--white); font-size: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 800; }
.about-review { margin-top: 2rem; background: var(--bg); border-left: 4px solid var(--accent); border-radius: 0 var(--radius) var(--radius) 0; padding: 1.25rem 1.5rem; }
.about-review-text { font-size: 0.9rem; color: var(--text); line-height: 1.6; font-style: italic; margin-bottom: 0.5rem; }
.about-review-author { font-size: 0.8rem; font-weight: 700; color: var(--accent); }

/* SERVICES */
.services-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
.service-item { border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
.service-item.active { border-color: var(--accent); }
.service-header { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; }
.service-icon { font-size: 1.5rem; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--bg); border-radius: var(--radius); flex-shrink: 0; }
.service-item.active .service-icon { background: var(--accent); }
.service-name { font-family: 'Barlow Condensed', sans-serif; font-size: 1.2rem; font-weight: 700; color: var(--black); }
.service-arrow { margin-left: auto; color: var(--accent); font-size: 1.2rem; transition: transform 0.2s; }
.service-item.active .service-arrow { transform: rotate(45deg); }
.service-body { display: none; padding: 0 1.5rem 1.25rem 1.5rem; border-top: 1px solid var(--border); }
.service-item.active .service-body { display: block; }
.service-body p { font-size: 0.9rem; color: var(--mid); line-height: 1.7; margin-top: 0.75rem; }
.service-body a { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 700; color: var(--accent); margin-top: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

/* SERVICES GRID (services page) */
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
.service-card { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 2rem; transition: all 0.2s; }
.service-card:hover { border-color: var(--accent); box-shadow: var(--shadow); transform: translateY(-2px); }
.service-card-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.service-card-name { font-family: 'Barlow Condensed', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--black); margin-bottom: 0.75rem; }
.service-card-desc { font-size: 0.9rem; color: var(--mid); line-height: 1.7; }

/* STATS BAND */
.stats-band { background: var(--dark); padding: 3.5rem 2.5rem; }
.stats-inner { max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem; }
.stats-left { flex: 1; min-width: 280px; }
.stats-left h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); color: var(--white); margin-bottom: 0.5rem; }
.stats-left p { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
.stats-numbers { display: flex; gap: 3rem; flex-wrap: wrap; }
.stat { text-align: center; }
.stat-val { font-family: 'Barlow Condensed', sans-serif; font-size: 3rem; font-weight: 900; color: var(--accent); line-height: 1; }
.stat-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; font-weight: 600; }

/* PROJECTS */
.projects-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 3rem; }
.project-card { border-radius: var(--radius); overflow: hidden; position: relative; aspect-ratio: 4/3; }
.project-card img { width: 100%; height: 100%; transition: transform 0.4s; }
.project-card:hover img { transform: scale(1.04); }
.project-label { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.75)); padding: 2rem 1.25rem 1rem; color: var(--white); font-family: 'Barlow Condensed', sans-serif; font-size: 1.1rem; font-weight: 700; }

/* PROCESS */
.process-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; margin-top: 2rem; }
.process-steps { display: flex; flex-direction: column; gap: 0; }
.process-step { display: flex; gap: 1.25rem; padding: 1.5rem 0; border-bottom: 1px solid var(--border); }
.process-step:last-child { border-bottom: none; }
.step-num { font-family: 'Barlow Condensed', sans-serif; font-size: 2rem; font-weight: 900; color: var(--accent); opacity: 0.35; line-height: 1; width: 36px; flex-shrink: 0; margin-top: -2px; }
.step-title { font-family: 'Barlow Condensed', sans-serif; font-size: 1.2rem; font-weight: 700; color: var(--black); margin-bottom: 0.35rem; }
.step-desc { font-size: 0.875rem; color: var(--mid); line-height: 1.65; }
.process-img { border-radius: var(--radius); overflow: hidden; aspect-ratio: 3/4; }
.process-img img { width: 100%; height: 100%; }

/* TESTIMONIALS */
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
.testimonial-card { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 1.75rem; transition: box-shadow 0.2s; }
.testimonial-card:hover { box-shadow: var(--shadow); }
.stars { color: var(--accent); font-size: 0.9rem; letter-spacing: 2px; margin-bottom: 1rem; }
.testimonial-text { font-size: 0.9rem; color: var(--text); line-height: 1.75; font-style: italic; margin-bottom: 1.25rem; }
.testimonial-author { display: flex; align-items: center; gap: 10px; }
.author-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--accent); color: var(--white); font-family: 'Barlow Condensed', sans-serif; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.author-name { font-weight: 700; font-size: 0.875rem; color: var(--black); }
.author-loc { font-size: 0.775rem; color: var(--light); }

/* FAQ */
.faq-list { display: flex; flex-direction: column; gap: 0; margin-top: 2rem; max-width: 720px; }
.faq-item { border-bottom: 1.5px solid var(--border); }
.faq-question { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-size: 1.15rem; font-weight: 700; color: var(--black); gap: 1rem; }
.faq-question:hover { color: var(--accent); }
.faq-icon { font-size: 1.25rem; color: var(--accent); flex-shrink: 0; transition: transform 0.2s; }
.faq-item.open .faq-icon { transform: rotate(45deg); }
.faq-answer { display: none; padding-bottom: 1.25rem; font-size: 0.9rem; color: var(--mid); line-height: 1.75; }
.faq-item.open .faq-answer { display: block; }

/* TEAM */
.team-section { background: var(--bg); }
.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
.team-card { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; }
.team-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.team-card-header { padding: 1.75rem 1.5rem 1.25rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid var(--border); }
.team-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: var(--white); font-family: 'Barlow Condensed', sans-serif; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.team-name { font-family: 'Barlow Condensed', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--black); line-height: 1.2; }
.team-title { font-size: 0.775rem; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
.team-card-body { padding: 1.25rem 1.5rem; }
.team-credentials { font-size: 0.775rem; font-weight: 600; color: var(--mid); margin-bottom: 0.6rem; }
.team-experience { display: inline-block; font-size: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: 2px; padding: 2px 8px; color: var(--mid); margin-bottom: 0.75rem; }
.team-bio { font-size: 0.875rem; color: var(--mid); line-height: 1.75; }
.team-bio-full { font-size: 0.9rem; color: var(--text); line-height: 1.8; }
.team-link { display: inline-flex; align-items: center; gap: 5px; font-size: 0.78rem; font-weight: 700; color: var(--accent); margin-top: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

/* TEAM BIO PAGE */
.bio-hero { background: var(--dark); padding: 4rem 2.5rem; }
.bio-hero-inner { max-width: 1160px; margin: 0 auto; display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; }
.bio-avatar-lg { width: 100px; height: 100px; border-radius: 50%; background: var(--accent); color: var(--white); font-family: 'Barlow Condensed', sans-serif; font-size: 2.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 4px solid rgba(255,255,255,0.15); }
.bio-hero-name { font-size: clamp(2rem, 4vw, 3rem); color: var(--white); margin-bottom: 4px; }
.bio-hero-title { font-size: 0.9rem; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }
.bio-hero-meta { font-size: 0.85rem; color: rgba(255,255,255,0.45); }
.bio-content { max-width: 760px; margin: 0 auto; padding: 4rem 2.5rem; }
.bio-content p { font-size: 1rem; color: var(--text); line-height: 1.85; margin-bottom: 1.25rem; }
.bio-cta { background: var(--accent); padding: 3rem 2.5rem; text-align: center; }
.bio-cta h3 { font-size: clamp(1.5rem, 3vw, 2rem); color: var(--white); margin-bottom: 1.25rem; }

/* CTA BANNER */
.cta-banner { position: relative; padding: 5rem 2.5rem; overflow: hidden; }
.cta-banner-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
.cta-banner-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.72); }
.cta-banner-content { position: relative; z-index: 1; max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap; }
.cta-banner h2 { font-size: clamp(2rem, 4vw, 3rem); color: var(--white); max-width: 560px; }
.cta-banner h2 em { color: var(--accent); font-style: normal; }

/* BLOG */
.blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 3rem; }
.blog-card { border-radius: var(--radius); overflow: hidden; border: 1.5px solid var(--border); transition: box-shadow 0.2s; }
.blog-card:hover { box-shadow: var(--shadow); }
.blog-img { aspect-ratio: 16/9; overflow: hidden; }
.blog-img img { width: 100%; height: 100%; transition: transform 0.3s; }
.blog-card:hover .blog-img img { transform: scale(1.04); }
.blog-body { padding: 1.25rem; }
.blog-tag { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 0.5rem; }
.blog-title { font-family: 'Barlow Condensed', sans-serif; font-size: 1.15rem; font-weight: 700; color: var(--black); line-height: 1.3; margin-bottom: 0.5rem; }
.blog-meta { font-size: 0.775rem; color: var(--light); }

/* CONTACT FORM */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: start; }
.contact-detail { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
.contact-detail-icon { width: 42px; height: 42px; background: var(--accent); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.contact-detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--light); margin-bottom: 3px; }
.contact-detail-val { font-size: 0.95rem; font-weight: 600; color: var(--black); }
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mid); margin-bottom: 0.4rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.8rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'Barlow', sans-serif; font-size: 0.9rem; background: var(--white); color: var(--text); transition: border-color 0.2s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--accent); }
.form-group textarea { min-height: 130px; resize: vertical; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-submit { width: 100%; padding: 1rem; background: var(--accent); color: var(--white); border: none; border-radius: var(--radius); font-family: 'Barlow Condensed', sans-serif; font-size: 1.1rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: filter 0.2s; margin-top: 0.5rem; }
.form-submit:hover { filter: brightness(1.08); }

/* FOOTER */
footer { background: var(--black); color: rgba(255,255,255,0.5); padding: 4rem 2.5rem 2rem; }
.footer-inner { max-width: 1160px; margin: 0 auto; }
.footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; padding-bottom: 3rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
.footer-brand .logo { color: var(--white); font-size: 1.8rem; margin-bottom: 1rem; }
.footer-brand p { font-size: 0.875rem; line-height: 1.7; max-width: 280px; }
.footer-col h4 { font-family: 'Barlow Condensed', sans-serif; font-size: 0.85rem; font-weight: 700; color: var(--white); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
.footer-col a { display: block; font-size: 0.85rem; color: rgba(255,255,255,0.45); margin-bottom: 0.6rem; transition: color 0.2s; }
.footer-col a:hover { color: var(--accent); }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.footer-copy { font-size: 0.8rem; }
.footer-tagline { font-family: 'Barlow Condensed', sans-serif; font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.25); letter-spacing: 0.05em; text-transform: uppercase; }

/* INNER PAGE HERO */
.page-hero { background: var(--dark); padding: 4rem 2.5rem; }
.page-hero-inner { max-width: 1160px; margin: 0 auto; }
.page-hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); color: var(--white); margin-bottom: 0.75rem; }
.page-hero p { font-size: 1rem; color: rgba(255,255,255,0.55); max-width: 500px; }
.breadcrumb { font-size: 0.8rem; color: rgba(255,255,255,0.35); margin-bottom: 1rem; }
.breadcrumb a { color: var(--accent); }
.breadcrumb span { margin: 0 6px; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .about-grid, .process-grid, .contact-grid { grid-template-columns: 1fr; gap: 2.5rem; }
  .projects-grid, .blog-grid { grid-template-columns: 1fr 1fr; }
  .footer-top { grid-template-columns: 1fr 1fr; }
  .stats-inner { flex-direction: column; align-items: flex-start; }
  .about-img-accent { display: none; }
}
@media (max-width: 640px) {
  nav { padding: 0 1.25rem; }
  .nav-links { display: none; }
  section { padding: 3.5rem 1.25rem; }
  .hero-content { padding: 4rem 1.25rem; }
  .projects-grid, .blog-grid { grid-template-columns: 1fr; }
  .footer-top { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
/* Scroll animations */
.fade-up { opacity: 1; transform: none; transition: opacity 0.55s ease, transform 0.55s ease; }
.fade-up.visible { opacity: 1; transform: none; }
  `;
}

const js = `
<script>
// Accordion - services
document.querySelectorAll('.service-item').forEach((item, i) => {
  if(i === 0) item.classList.add('active');
  item.querySelector('.service-header').addEventListener('click', () => {
    document.querySelectorAll('.service-item').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
  });
});
// FAQ
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    item.classList.toggle('open');
  });
});
// Scroll fade
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
// Contact form
const form = document.querySelector('.contact-form');
if(form) form.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('.form-submit');
  btn.textContent = '✓ Message sent! We\'ll call you soon.';
  btn.style.background = '#16a34a';
  form.reset();
});
</script>
`;

function nav(business: SiteData['business'], activePage: string, team?: SiteData['team'], services?: SiteData['website']['services']) {
  const hasTeam = team && team.length > 0;
  const hasServices = services && services.length > 0;
  return `
<style>
.nav-dropdown { position: relative; }
.nav-dropdown-menu { display: none; position: absolute; top: 100%; left: 0; background: var(--white); border: 2px solid var(--border); min-width: 190px; box-shadow: var(--shadow); z-index: 200; padding: 0.4rem 0; }
.nav-dropdown:hover .nav-dropdown-menu { display: block; }
.nav-dropdown-menu a { display: block; padding: 0.5rem 1.25rem; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mid); white-space: nowrap; }
.nav-dropdown-menu a:hover { color: var(--accent); background: var(--bg); }
.nav-dropdown-toggle::after { content: ' ▾'; font-size: 0.6rem; opacity: 0.5; }
</style>
<nav>
  <div class="logo">${business.name.split(' ')[0]}<em>${business.name.split(' ').slice(1).join(' ') || '.'}</em></div>
  <div class="nav-links">
    <a href="index.html" ${activePage === 'index.html' ? 'style="color:var(--accent)"' : ''}>Home</a>
    <div class="nav-dropdown">
      <a href="services.html" class="nav-dropdown-toggle" ${activePage === 'services.html' || (activePage && activePage.startsWith('services/')) ? 'style="color:var(--accent)"' : ''}>Services</a>
      <div class="nav-dropdown-menu">
        <a href="services.html" style="font-weight:700;color:var(--black)">All Services</a>
        ${hasServices ? services!.map(s => `<a href="${s.link || 'services.html'}" style="padding-left:2rem;font-size:0.75rem;border-left:2px solid var(--border);margin-left:1.25rem">${s.name}</a>`).join('') : ''}
      </div>
    </div>
    <div class="nav-dropdown">
      <a href="about.html" class="nav-dropdown-toggle" ${activePage === 'about.html' || activePage === 'team.html' ? 'style="color:var(--accent)"' : ''}>About</a>
      <div class="nav-dropdown-menu">
        <a href="about.html">About Us</a>
        ${hasTeam ? `<a href="team.html" style="font-weight:700;color:var(--black)">Our Team</a>` : ''}
        ${hasTeam ? team!.map(m => `<a href="team-${m.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.html" style="padding-left:2rem;font-size:0.75rem;border-left:2px solid var(--border);margin-left:1.25rem">${m.name}</a>`).join('') : ''}
      </div>
    </div>
    <a href="contact.html" ${activePage === 'contact.html' ? 'style="color:var(--accent)"' : ''}>Contact</a>
    <a href="contact.html" class="nav-cta btn">Free Quote</a>
  </div>
</nav>`;
}

function footer(business: SiteData['business']) {
  return `
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <div class="logo">${business.name}</div>
        <p>${business.tagline}. Proudly serving ${business.city}, ${business.state} and surrounding areas.</p>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="index.html">Home</a>
        <a href="about.html">About Us</a>
        <a href="services.html">Services</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        ${business.name ? '<a href="services.html">All Services</a>' : ''}
        <a href="contact.html">Free Estimate</a>
        <a href="contact.html">Emergency Service</a>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <a href="tel:${business.phone}">${business.phone}</a>
        <a href="mailto:${business.email}">${business.email}</a>
        <a href="contact.html">${business.city}, ${business.state}</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© ${new Date().getFullYear()} ${business.name}. All rights reserved. Website by <a href="https://exsisto.ai" style="color:var(--accent)">Exsisto</a>.</div>
      <div class="footer-tagline">${business.tagline}</div>
    </div>
  </div>
</footer>`;
}

function head(title: string, description: string, keywords: string[], accent: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<meta name="keywords" content="${keywords.join(', ')}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<style>${css(accent)}</style>
</head>
<body>`;
}

// ─── INDEX.HTML ───────────────────────────────────────────────────────────────

export function buildIndex(d: SiteData): string {
  const { business: b, website: w } = d;
  const heroImg = w.hero_image_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&auto=format';

  return `${head(w.meta_title, w.meta_description, w.keywords, b.accent_color)}
${nav(b, 'index.html', d.team, w.services)}

<!-- HERO -->
<div class="hero">
  <div class="hero-bg" style="background-image:url('${heroImg}')"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-label">✦ Serving ${b.serviceArea || `${b.city}, ${b.state}`}</div>
    <h1>${b.name}<br/><em>${b.tagline}</em></h1>
    <p class="hero-sub">${b.description}</p>
    <div class="hero-actions">
      <a href="contact.html" class="btn btn-accent">Get a Free Quote →</a>
      <a href="tel:${b.phone}" class="btn btn-outline">📞 ${b.phone}</a>
    </div>
    <div class="hero-trust">
      ${['Licensed & Insured', `Serving ${b.serviceArea || b.state}`, 'Free Estimates', '5-Star Rated'].map(t => `
      <div class="trust-badge"><div class="trust-badge-dot"></div>${t}</div>`).join('')}
    </div>
  </div>
</div>

<!-- AVAILABILITY BAND -->
<div class="accent-band">
  <div>
    <div class="accent-band-text">Serving ${b.serviceArea || `${b.city}, ${b.state} and surrounding areas`}</div>
    <div class="accent-band-sub">Available Monday – Saturday · Emergency services 24/7</div>
  </div>
  <div class="accent-band-phone">📞 ${b.phone}</div>
</div>

<!-- ABOUT -->
<section>
  <div class="container">
    <div class="about-grid">
      <div class="about-images">
        <div class="about-img-main"><img src="${w.about_image_url || heroImg}" alt="${b.name} team" loading="lazy"/></div>
        <div class="about-img-accent"><img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format" alt="Work quality" loading="lazy"/></div>
      </div>
      <div class="about-text fade-up">
        <span class="label">About Us</span>
        <h2 class="section-title">We believe in turning your problem into a permanent solution</h2>
        <p class="section-sub">${b.description}</p>
        <div class="about-badges">
          <div class="about-badge"><div class="about-badge-check">✓</div>Sustainable, quality-first practices</div>
          <div class="about-badge"><div class="about-badge-check">✓</div>Personalized service for every client</div>
          <div class="about-badge"><div class="about-badge-check">✓</div>Fully licensed, bonded & insured</div>
        </div>
        ${w.testimonials?.length > 0 ? `
        <div class="about-review">
          <div class="about-review-text">"${w.testimonials[0].text}"</div>
          <div class="about-review-author">— ${w.testimonials[0].name}, ${w.testimonials[0].location}</div>
        </div>` : ""}
      </div>
    </div>
  </div>
</section>

<!-- SERVICES ACCORDION -->
<section class="bg-soft">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:start">
      <div class="fade-up">
        <span class="label">What We Do</span>
        <h2 class="section-title">Complete solutions you can trust</h2>
        <p class="section-sub" style="margin-bottom:2rem">Our team of skilled professionals is ready to handle any job — big or small — with the same attention to detail.</p>
        <a href="services.html" class="btn btn-dark">View All Services →</a>
      </div>
      <div class="services-list fade-up">
        ${w.services.slice(0, 4).map((s, i) => `
        <div class="service-item${i === 0 ? ' active' : ''}">
          <div class="service-header">
            <div class="service-icon">${s.icon}</div>
            <div class="service-name">${s.name}</div>
            <div class="service-arrow">+</div>
          </div>
          <div class="service-body">
            <p>${s.description}</p>
            <a href="services.html">Learn more →</a>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>

<!-- STATS -->
<div class="stats-band">
  <div class="stats-inner">
    <div class="stats-left">
      <h2>Delivering excellence<br/>across every job</h2>
      <p>Trusted by hundreds of homeowners and businesses ${b.serviceArea ? `throughout ${b.state}` : `in ${b.city}`}.</p>
    </div>
    <div class="stats-numbers">
      ${w.stats.map(s => `
      <div class="stat">
        <div class="stat-val">${s.value}</div>
        <div class="stat-lbl">${s.label}</div>
      </div>`).join('')}
    </div>
  </div>
</div>

<!-- PROCESS -->
<section>
  <div class="container">
    <div class="process-grid">
      <div class="fade-up">
        <span class="label">How It Works</span>
        <h2 class="section-title">How we serve you with care & expertise</h2>
        <div class="process-steps" style="margin-top:2rem">
          ${(w.process_steps || [
            { title: 'Call or Request Online', description: 'Reach out by phone or submit a request form. We respond within 2 hours.' },
            { title: 'Free On-Site Estimate', description: 'We come to you, assess the job, and give you a clear, honest quote — no surprises.' },
            { title: 'We Get to Work', description: 'Our licensed team completes the job efficiently with quality materials.' },
            { title: 'Your Satisfaction Guaranteed', description: "We don't leave until the job is done right and you're completely happy." },
          ]).map((step, i) => `
          <div class="process-step">
            <div class="step-num">0${i + 1}</div>
            <div>
              <div class="step-title">${step.title}</div>
              <div class="step-desc">${step.description}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="process-img fade-up">
        <img src="${w.process_image_url || heroImg}" alt="Professional at work" loading="lazy"/>
      </div>
    </div>
  </div>
</section>

${w.testimonials?.length > 0 ? `
<!-- TESTIMONIALS -->
<section class="bg-soft">
  <div class="container">
    <div style="text-align:center;margin-bottom:0.5rem">
      <span class="label">Client Stories</span>
      <h2 class="section-title">Trusted by ${w.stats[0]?.value || '500+'} customers</h2>
    </div>
    <div class="testimonials-grid">
      ${w.testimonials.map(t => `
      <div class="testimonial-card fade-up">
        <div class="stars">${'★'.repeat(t.rating || 5)}</div>
        <p class="testimonial-text">"${t.text}"</p>
        <div class="testimonial-author">
          <div class="author-avatar">${t.name.charAt(0)}</div>
          <div>
            <div class="author-name">${t.name}</div>
            <div class="author-loc">${t.location}</div>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>` : ""}

<!-- FAQ -->
<section>
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:start">
      <div class="fade-up">
        <span class="label">FAQ</span>
        <h2 class="section-title">Everything you need to know</h2>
        <p class="section-sub" style="margin-top:1rem">Can't find your answer? Give us a call — we're happy to help.</p>
        <a href="tel:${b.phone}" class="btn btn-accent" style="margin-top:2rem">📞 Call Us Now</a>
      </div>
      <div class="faq-list fade-up">
        ${(w.faqs || [
          { question: 'Do you offer free estimates?', answer: 'Yes — all estimates are completely free with no obligation. We\'ll come to your location and give you a clear, honest quote.' },
          { question: 'Are you licensed and insured?', answer: 'Absolutely. We are fully licensed, bonded, and insured for your complete peace of mind.' },
          { question: 'How quickly can you respond?', answer: 'We aim to respond to all requests within 2 hours. Emergency services are available 24/7.' },
          { question: 'What areas do you serve?', answer: `We serve ${b.serviceArea || `${b.city}, ${b.state} and surrounding areas`}. Call us to confirm your location.` },
        ]).map(f => `
        <div class="faq-item">
          <div class="faq-question">${f.question}<span class="faq-icon">+</span></div>
          <div class="faq-answer">${f.answer}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>

${d.team && d.team.length > 0 ? `
<!-- TEAM -->
<section class="team-section">
  <div class="container">
    <div style="text-align:center;margin-bottom:0.5rem">
      <span class="label">Our Team</span>
      <h2 class="section-title">Meet the people behind the work</h2>
    </div>
    <div class="team-grid">
      ${d.team.map(m => `
      <div class="team-card">
        <div class="team-card-header">
          <div class="team-avatar">${m.name.charAt(0)}</div>
          <div>
            <div class="team-name">${m.name}</div>
            <div class="team-title">${m.title}</div>
          </div>
        </div>
        <div class="team-card-body">
          ${m.credentials ? `<div class="team-credentials">${m.credentials}</div>` : ""}
          ${m.experience ? `<div class="team-experience">⚡ ${m.experience} years experience</div>` : ""}
          <div class="team-bio">${m.bio ? m.bio.slice(0, 180) + (m.bio.length > 180 ? "..." : "") : ""}</div>
          ${m.bio && m.bio.length > 60 ? `<a href="team-${m.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.html" class="team-link">Full bio →</a>` : ""}
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

<!-- CTA BANNER -->
<div class="cta-banner">
  <div class="cta-banner-bg" style="background-image:url('${w.cta_image_url || heroImg}')"></div>
  <div class="cta-banner-overlay"></div>
  <div class="cta-banner-content">
    <h2>Ready for a <em>job done right?</em></h2>
    <a href="contact.html" class="btn btn-accent" style="font-size:1.1rem;padding:1rem 2.5rem">Get Your Free Quote →</a>
  </div>
</div>

${footer(b)}
${js}
</body></html>`;
}

// ─── SERVICES.HTML ────────────────────────────────────────────────────────────

export function buildServices(d: SiteData): string {
  const { business: b, website: w } = d;
  const heroImg = w.hero_image_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&auto=format';

  return `${head(`Services | ${w.meta_title}`, `Explore all services offered by ${b.name} in ${b.city}, ${b.state}.`, w.keywords, b.accent_color)}
${nav(b, 'services.html', d.team, w.services)}

<div class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="index.html">Home</a><span>›</span>Services</div>
    <h1>Our Services</h1>
    <p>Everything you need, handled by licensed professionals. Serving ${b.city}, ${b.state}.</p>
  </div>
</div>

<section>
  <div class="container">
    <div style="text-align:center;max-width:600px;margin:0 auto 1rem">
      <span class="label">What We Offer</span>
      <h2 class="section-title">Complete home service solutions</h2>
      <p class="section-sub" style="margin:0 auto">Our team is equipped to handle every job with skill, speed, and professionalism.</p>
    </div>
    <div class="services-grid">
      ${w.services.map(s => `
      <div class="service-card fade-up">
        <div class="service-card-icon">${s.icon}</div>
        <div class="service-card-name">${s.name}</div>
        <div class="service-card-desc">${s.description}</div>
        <a href="${s.link || 'contact.html'}" class="btn btn-outline-dark" style="margin-top:1.25rem;font-size:0.85rem;padding:0.65rem 1.25rem">${s.link ? "Learn more →" : "Get a Quote →"}</a>
      </div>`).join('')}
    </div>
  </div>
</section>

<div class="accent-band">
  <div>
    <div class="accent-band-text">Not sure what you need? We'll figure it out together.</div>
    <div class="accent-band-sub">Free on-site assessment with every estimate</div>
  </div>
  <a href="contact.html" class="btn btn-dark">Schedule a Visit →</a>
</div>

<section class="bg-soft">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center">
      <div class="fade-up">
        <span class="label">Why Choose Us</span>
        <h2 class="section-title">The ${b.name} difference</h2>
        <p class="section-sub">${b.description}</p>
        <div class="about-badges" style="margin-top:1.5rem">
          ${['Upfront, honest pricing', 'Background-checked technicians', 'Workmanship guarantee', 'Clean job sites, always'].map(badge => `
          <div class="about-badge"><div class="about-badge-check">✓</div>${badge}</div>`).join('')}
        </div>
        <a href="contact.html" class="btn btn-accent" style="margin-top:2rem">Request Service →</a>
      </div>
      <div style="border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3" class="fade-up">
        <img src="${heroImg}" alt="${b.name}" style="width:100%;height:100%;object-fit:cover" loading="lazy"/>
      </div>
    </div>
  </div>
</section>

${w.testimonials?.length > 0 ? `
<section>
  <div class="container" style="text-align:center">
    <span class="label">Client Stories</span>
    <h2 class="section-title" style="margin-bottom:3rem">What our customers say</h2>
    <div class="testimonials-grid">
      ${w.testimonials.slice(0, 3).map(t => `
      <div class="testimonial-card fade-up">
        <div class="stars">${'★'.repeat(t.rating || 5)}</div>
        <p class="testimonial-text">"${t.text}"</p>
        <div class="testimonial-author">
          <div class="author-avatar">${t.name.charAt(0)}</div>
          <div><div class="author-name">${t.name}</div><div class="author-loc">${t.location}</div></div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>` : ""}

${footer(b)}
${js}
</body></html>`;
}

// ─── ABOUT.HTML ───────────────────────────────────────────────────────────────

export function buildAbout(d: SiteData): string {
  const { business: b, website: w } = d;
  const heroImg = w.hero_image_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&auto=format';

  return `${head(`About | ${w.meta_title}`, `Learn about ${b.name} — serving ${b.city}, ${b.state} with pride.`, w.keywords, b.accent_color)}
${nav(b, 'about.html', d.team, w.services)}

<div class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="index.html">Home</a><span>›</span>About</div>
    <h1>About ${b.name}</h1>
    <p>Built on trust, driven by quality. Proudly serving ${b.city} and surrounding areas.</p>
  </div>
</div>

<section>
  <div class="container">
    <div class="about-grid">
      <div class="about-images">
        <div class="about-img-main"><img src="${heroImg}" alt="${b.name}" loading="lazy"/></div>
      </div>
      <div class="fade-up">
        <span class="label">Our Story</span>
        <h2 class="section-title">Who we are</h2>
        <p class="section-sub">${b.description}</p>
        <p class="section-sub" style="margin-top:1rem">We started with a simple belief: every customer deserves honest pricing, skilled workmanship, and a job completed on time. That belief drives everything we do.</p>
        <div class="about-badges" style="margin-top:2rem">
          ${['Locally owned & operated', 'Licensed, bonded & insured', '100% satisfaction guarantee', 'Serving ${b.city} & surrounding areas'].map(badge => `
          <div class="about-badge"><div class="about-badge-check">✓</div>${badge}</div>`).join('')}
        </div>
      </div>
    </div>
  </div>
</section>

<div class="stats-band">
  <div class="stats-inner">
    <div class="stats-left">
      <h2>Numbers that speak for themselves</h2>
      <p>Every number represents a family or business we've helped.</p>
    </div>
    <div class="stats-numbers">
      ${w.stats.map(s => `
      <div class="stat">
        <div class="stat-val">${s.value}</div>
        <div class="stat-lbl">${s.label}</div>
      </div>`).join('')}
    </div>
  </div>
</div>

<section class="bg-soft">
  <div class="container">
    <div style="text-align:center;max-width:600px;margin:0 auto 3rem">
      <span class="label">How We Work</span>
      <h2 class="section-title">Our process</h2>
    </div>
    <div class="process-grid">
      <div class="process-steps fade-up">
        ${(w.process_steps || [
          { title: 'You Reach Out', description: 'Call, text, or submit a form. We respond fast — usually within 2 hours.' },
          { title: 'Free Estimate', description: 'We visit your property, assess the situation, and provide a detailed quote at no cost.' },
          { title: 'We Do the Work', description: 'Our crew arrives on time, works cleanly, and keeps you informed throughout.' },
          { title: 'You\'re Delighted', description: 'We follow up after every job to make sure you\'re completely satisfied.' },
        ]).map((step, i) => `
        <div class="process-step">
          <div class="step-num">0${i + 1}</div>
          <div>
            <div class="step-title">${step.title}</div>
            <div class="step-desc">${step.description}</div>
          </div>
        </div>`).join('')}
      </div>
      <div style="border-radius:var(--radius);overflow:hidden;aspect-ratio:3/4" class="fade-up">
        <img src="${w.process_image_url || heroImg}" alt="Professional at work" style="width:100%;height:100%;object-fit:cover" loading="lazy"/>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="container" style="text-align:center;max-width:700px;margin:0 auto">
    <span class="label">Our Promise</span>
    <h2 class="section-title">We stand behind every job</h2>
    <p class="section-sub" style="margin:1rem auto 2.5rem">If you're not completely satisfied with our work, we'll make it right. That's not just a policy — it's who we are.</p>
    <a href="contact.html" class="btn btn-accent" style="font-size:1.1rem">Get a Free Estimate →</a>
  </div>
</section>

${footer(b)}
${js}
</body></html>`;
}

// ─── CONTACT.HTML ─────────────────────────────────────────────────────────────

export function buildContact(d: SiteData): string {
  const { business: b, website: w } = d;

  return `${head(`Contact | ${w.meta_title}`, `Contact ${b.name} for a free estimate in ${b.city}, ${b.state}.`, w.keywords, b.accent_color)}
${nav(b, 'contact.html', d.team, w.services)}

<div class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="index.html">Home</a><span>›</span>Contact</div>
    <h1>Get in Touch</h1>
    <p>Free estimates. Fast response. No pressure — ever.</p>
  </div>
</div>

<section>
  <div class="container">
    <div class="contact-grid">
      <div class="fade-up">
        <span class="label">Contact Info</span>
        <h2 class="section-title">We're ready to help</h2>
        <p class="section-sub" style="margin-bottom:2.5rem">Reach out any time. We respond to all inquiries within 2 hours during business hours.</p>

        ${b.phone ? `<div class="contact-detail">
          <div class="contact-detail-icon">📞</div>
          <div><div class="contact-detail-label">Phone</div><div class="contact-detail-val">${b.phone}</div></div>
        </div>` : ''}
        ${b.email ? `<div class="contact-detail">
          <div class="contact-detail-icon">✉️</div>
          <div><div class="contact-detail-label">Email</div><div class="contact-detail-val">${b.email}</div></div>
        </div>` : ''}
        ${b.address ? `<div class="contact-detail">
          <div class="contact-detail-icon">📍</div>
          <div><div class="contact-detail-label">Location</div><div class="contact-detail-val">${b.address}<br/>${b.city}, ${b.state}</div></div>
        </div>` : ''}
        <div class="contact-detail">
          <div class="contact-detail-icon">📍</div>
          <div><div class="contact-detail-label">Service Area</div><div class="contact-detail-val">Serving ${b.serviceArea || `${b.city}, ${b.state} and surrounding areas`}</div></div>
        </div>
        <div class="contact-detail">
          <div class="contact-detail-icon">🕐</div>
          <div><div class="contact-detail-label">Hours</div><div class="contact-detail-val">Mon–Sat: 7am – 7pm<br/>Emergency: 24/7</div></div>
        </div>

        <div style="margin-top:2.5rem;padding:1.5rem;background:var(--bg);border-radius:var(--radius);border-left:4px solid var(--accent)">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.2rem;font-weight:700;margin-bottom:0.5rem">Free estimates, always.</div>
          <div style="font-size:0.875rem;color:var(--mid)">We'll come to you, assess the job, and give you an honest quote with no obligation.</div>
        </div>
      </div>

      <div class="fade-up">
        <div style="background:var(--bg);border-radius:var(--radius);padding:2.5rem">
          <h3 style="font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:700;margin-bottom:0.5rem">Request a Free Quote</h3>
          <p style="font-size:0.875rem;color:var(--mid);margin-bottom:2rem">Fill out the form and we'll get back to you within 2 hours.</p>
          <form class="contact-form">
            <div class="form-row">
              <div class="form-group"><label>First Name</label><input type="text" placeholder="Jane" required/></div>
              <div class="form-group"><label>Last Name</label><input type="text" placeholder="Smith" required/></div>
            </div>
            <div class="form-group"><label>Phone Number</label><input type="tel" placeholder="${b.phone || '(555) 000-0000'}" required/></div>
            <div class="form-group"><label>Email Address</label><input type="email" placeholder="jane@example.com"/></div>
            <div class="form-group">
              <label>Service Needed</label>
              <select>
                <option value="">Select a service...</option>
                ${w.services.map(s => `<option>${s.name}</option>`).join('')}
                <option>Not sure — I need advice</option>
              </select>
            </div>
            <div class="form-group"><label>Tell Us More</label><textarea placeholder="Describe what you need help with..."></textarea></div>
            <button type="submit" class="form-submit">Send My Request →</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="stats-band">
  <div class="stats-inner">
    <div class="stats-left">
      <h2>Join ${w.stats[0]?.value || 'hundreds of'} satisfied customers</h2>
      <p>Homeowners and businesses throughout ${b.city} trust us.</p>
    </div>
    <div class="stats-numbers">
      ${w.stats.map(s => `
      <div class="stat">
        <div class="stat-val">${s.value}</div>
        <div class="stat-lbl">${s.label}</div>
      </div>`).join('')}
    </div>
  </div>
</div>

${footer(b)}
${js}
</body></html>`;
}

// ─── TEAM BIO PAGE ────────────────────────────────────────────────────────────

function buildTeamBioPage(d: SiteData, member: NonNullable<SiteData['team']>[0]): string {
  const { business: b, website: w } = d;
  const slug = member.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${head(`${member.name} | ${b.name}`, `Meet ${member.name}, ${member.title} at ${b.name}. ${member.bio?.slice(0, 120) || ""}`, w.keywords, b.accent_color)}
${nav(b, '', d.team, w.services)}

<div class="bio-hero">
  <div class="bio-hero-inner">
    <div class="bio-avatar-lg">${member.name.charAt(0)}</div>
    <div>
      <div class="breadcrumb"><a href="index.html">Home</a><span>›</span><a href="index.html#team">Team</a><span>›</span>${member.name}</div>
      <h1 class="bio-hero-name">${member.name}</h1>
      <div class="bio-hero-title">${member.title}${member.credentials ? ` — ${member.credentials}` : ""}</div>
      <div class="bio-hero-meta">
        ${member.experience ? `${member.experience} years of experience · ` : ""}${b.name}${b.city ? ` · ${b.serviceArea || `${b.city}, ${b.state}`}` : ""}
      </div>
    </div>
  </div>
</div>

<div class="bio-content">
  ${member.bio
    ? member.bio.split(/\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join("\n  ")
    : `<p>${member.name} is a ${member.title} at ${b.name}, serving clients ${b.serviceArea || `in ${b.city}, ${b.state}`}.</p>`
  }
  ${member.credentials ? `
  <div style="margin-top:2rem;padding:1.5rem;background:var(--bg);border-left:4px solid var(--accent);border-radius:0 var(--radius) var(--radius) 0">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:700;margin-bottom:0.4rem">Credentials & Licenses</div>
    <div style="font-size:0.9rem;color:var(--mid)">${member.credentials}</div>
  </div>` : ""}
</div>

<div class="bio-cta">
  <h3>Work with ${member.name.split(" ")[0]}</h3>
  <a href="contact.html" class="btn btn-accent" style="font-size:1rem;padding:0.85rem 2.5rem">Get a Free Consultation →</a>
</div>

${footer(b)}
${js}
</body></html>`;
}

// ─── TEAM PAGE ─────────────────────────────────────────────────────────────────

function buildTeamPage(d: SiteData): string {
  const { business: b, website: w } = d;
  const team = d.team || [];
  return `${head(`Our Team | ${w.meta_title}`, `Meet the team at ${b.name}.`, w.keywords, b.accent_color)}
${nav(b, 'team.html', d.team, w.services)}

<div class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="index.html">Home</a><span>›</span>Our Team</div>
    <h1>Our Team</h1>
    <p>The people who show up, do the work, and stand behind every job.</p>
  </div>
</div>

<section>
  <div class="container">
    <div class="team-grid">
      ${team.map(m => `
      <div class="team-card">
        <div class="team-card-header">
          <div class="team-avatar">${m.name.charAt(0)}</div>
          <div>
            <div class="team-name">${m.name}</div>
            <div class="team-title">${m.title}</div>
          </div>
        </div>
        <div class="team-card-body">
          ${m.credentials ? `<div class="team-credentials">${m.credentials}</div>` : ""}
          ${m.experience ? `<div class="team-experience">⚡ ${m.experience} years experience</div>` : ""}
          <div class="team-bio">${m.bio ? m.bio.slice(0, 220) + (m.bio.length > 220 ? "..." : "") : ""}</div>
          ${m.bio && m.bio.length > 60 ? `<a href="team-${m.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.html" class="team-link">Full bio →</a>` : ""}
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>

<div class="cta-banner">
  <div class="cta-banner-bg" style="background-image:url('${w.hero_image_url}')"></div>
  <div class="cta-banner-overlay"></div>
  <div class="cta-banner-content">
    <h2>Ready to work with <em>our team?</em></h2>
    <a href="contact.html" class="btn btn-accent">Get a Free Quote →</a>
  </div>
</div>

${footer(b)}
${js}
</body></html>`;
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

export function buildTradesSite(d: SiteData): Record<string, string> {
  const pages: Record<string, string> = {
    'index.html': buildIndex(d),
    'services.html': buildServices(d),
    'about.html': buildAbout(d),
    'contact.html': buildContact(d),
  };

  // Add team page and individual bio pages if team exists
  if (d.team && d.team.length > 0) {
    pages['team.html'] = buildTeamPage(d);
    d.team.forEach(member => {
      if (member.name.trim()) {
        const slug = member.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        pages[`team-${slug}.html`] = buildTeamBioPage(d, member);
      }
    });
  }

  return pages;
}

// ─── PROFESSIONAL SERVICES TEMPLATE ──────────────────────────────────────────
// Inspired by Jurri — for law firms, consultants, financial advisors, accountants
// Multi-page: index.html, services.html, about.html, contact.html

import { SiteData } from './trades';

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');`;

function css(accent: string) {
  return `
${fonts}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --accent: ${accent};
  --black: #0e0e0e;
  --dark: #1a1a18;
  --text: #2c2c28;
  --mid: #6a6a62;
  --light: #a0a098;
  --white: #ffffff;
  --cream: #f5f2ed;
  --sand: #ede8e0;
  --border: #e0dbd2;
  --radius: 2px;
  --shadow: 0 4px 28px rgba(0,0,0,0.07);
  --shadow-lg: 0 12px 48px rgba(0,0,0,0.12);
}
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; color: var(--text); background: var(--white); line-height: 1.7; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; object-fit: cover; }
h1,h2,h3,h4 { font-family: 'Cormorant Garamond', serif; line-height: 1.1; letter-spacing: -0.01em; font-weight: 600; }

/* NAV */
nav { position: sticky; top: 0; z-index: 100; background: var(--white); border-bottom: 1px solid var(--border); height: 70px; padding: 0 3rem; display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 700; color: var(--black); letter-spacing: 0.02em; }
.logo em { color: var(--accent); font-style: italic; }
.nav-links { display: flex; gap: 2.5rem; align-items: center; }
.nav-links a { font-size: 0.8rem; font-weight: 500; color: var(--mid); letter-spacing: 0.06em; text-transform: uppercase; transition: color 0.2s; }
.nav-links a:hover { color: var(--black); }
.nav-cta { background: var(--black) !important; color: var(--white) !important; padding: 0.6rem 1.5rem !important; border-radius: var(--radius) !important; font-family: 'DM Sans', sans-serif !important; }
.nav-cta:hover { background: var(--dark) !important; }

/* BUTTONS */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 0.85rem 2rem; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; border: none; transition: all 0.2s; }
.btn-dark { background: var(--black); color: var(--white); }
.btn-dark:hover { background: var(--dark); transform: translateY(-1px); }
.btn-accent { background: var(--accent); color: var(--white); }
.btn-accent:hover { filter: brightness(1.08); }
.btn-outline { background: transparent; color: var(--black); border: 1.5px solid var(--black); }
.btn-outline:hover { background: var(--black); color: var(--white); }
.btn-outline-light { background: transparent; color: var(--white); border: 1.5px solid rgba(255,255,255,0.4); }
.btn-outline-light:hover { border-color: var(--white); background: rgba(255,255,255,0.08); }

/* LABELS */
.label { font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); display: block; margin-bottom: 0.75rem; }
.label-light { color: rgba(255,255,255,0.5); }
.section-title { font-size: clamp(2rem, 4vw, 3.2rem); color: var(--black); margin-bottom: 1rem; }
.section-sub { font-size: 1rem; color: var(--mid); max-width: 520px; line-height: 1.8; }

/* SECTIONS */
section { padding: 6rem 3rem; }
.container { max-width: 1180px; margin: 0 auto; }
.bg-cream { background: var(--cream); }
.bg-sand { background: var(--sand); }
.bg-dark { background: var(--dark); }
.bg-black { background: var(--black); }

/* HERO */
.hero { padding: 0 3rem; background: var(--white); }
.hero-inner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: calc(100vh - 70px); }
.hero-left { display: flex; flex-direction: column; justify-content: center; padding: 5rem 4rem 5rem 0; border-right: 1px solid var(--border); }
.hero-eyebrow { font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mid); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; }
.hero-eyebrow::before { content: ''; display: block; width: 28px; height: 1.5px; background: var(--accent); }
.hero h1 { font-size: clamp(3rem, 5vw, 5rem); color: var(--black); margin-bottom: 1.5rem; }
.hero h1 em { color: var(--accent); }
.hero-sub { font-size: 1.05rem; color: var(--mid); max-width: 420px; line-height: 1.8; margin-bottom: 2.5rem; }
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.hero-stats { display: flex; gap: 3rem; margin-top: 4rem; padding-top: 3rem; border-top: 1px solid var(--border); }
.hero-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; font-weight: 700; color: var(--black); line-height: 1; }
.hero-stat-lbl { font-size: 0.75rem; color: var(--mid); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
.hero-right { position: relative; overflow: hidden; }
.hero-right img { width: 100%; height: 100%; object-fit: cover; }
.hero-right-caption { position: absolute; bottom: 2rem; left: 2rem; background: var(--white); padding: 1.25rem 1.5rem; border-radius: var(--radius); box-shadow: var(--shadow-lg); max-width: 240px; }
.hero-caption-quote { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-style: italic; color: var(--text); line-height: 1.5; margin-bottom: 0.5rem; }
.hero-caption-author { font-size: 0.75rem; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; }

/* LOGOS */
.logos-band { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 1.5rem 3rem; background: var(--white); }
.logos-inner { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.logos-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--light); white-space: nowrap; margin-right: 1rem; }
.logo-item { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--light); padding: 0.4rem 1.2rem; border: 1px solid var(--border); border-radius: var(--radius); }

/* SERVICES */
.services-intro { display: grid; grid-template-columns: 1fr 2fr; gap: 5rem; align-items: start; margin-bottom: 4rem; }
.services-list-pro { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.service-card-pro { padding: 2.5rem 2rem; border: 1px solid var(--border); border-radius: var(--radius); transition: all 0.2s; cursor: pointer; }
.service-card-pro:hover { background: var(--cream); border-color: var(--accent); transform: translateY(-2px); }
.service-card-pro-num { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 700; color: var(--accent); opacity: 0.4; line-height: 1; margin-bottom: 1rem; }
.service-card-pro-name { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 600; color: var(--black); margin-bottom: 0.75rem; }
.service-card-pro-desc { font-size: 0.875rem; color: var(--mid); line-height: 1.75; }
.service-card-pro-link { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-top: 1rem; text-transform: uppercase; letter-spacing: 0.06em; }

/* EXPERTISE GRID */
.expertise-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-top: 2rem; }
.expertise-item { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s; }
.expertise-item:hover { background: var(--cream); }
.expertise-item:nth-child(even) { border-right: none; }
.expertise-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.expertise-name { font-size: 0.875rem; font-weight: 500; color: var(--text); }
.expertise-num { font-size: 0.75rem; color: var(--light); margin-left: auto; }

/* FEATURED QUOTE */
.featured-quote { background: var(--dark); padding: 6rem 3rem; }
.featured-quote-inner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
.quote-mark { font-family: 'Cormorant Garamond', serif; font-size: 6rem; color: var(--accent); line-height: 0.5; opacity: 0.6; margin-bottom: 1rem; }
.quote-text { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.5rem, 2.5vw, 2rem); color: var(--white); font-style: italic; line-height: 1.5; margin-bottom: 2rem; }
.quote-author-name { font-size: 0.9rem; font-weight: 600; color: var(--white); letter-spacing: 0.04em; }
.quote-author-title { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 3px; }
.quote-signature { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-style: italic; color: rgba(255,255,255,0.25); margin-top: 1rem; }
.quote-photo { border-radius: var(--radius); overflow: hidden; aspect-ratio: 3/4; }
.quote-photo img { width: 100%; height: 100%; filter: grayscale(20%); }

/* CASE STUDIES */
.case-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 3rem; }
.case-card { border-radius: var(--radius); overflow: hidden; background: var(--cream); border: 1px solid var(--border); transition: all 0.2s; }
.case-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.case-img { aspect-ratio: 4/3; overflow: hidden; }
.case-img img { width: 100%; height: 100%; transition: transform 0.4s; }
.case-card:hover .case-img img { transform: scale(1.04); }
.case-body { padding: 1.5rem; }
.case-tag { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 0.6rem; }
.case-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--black); line-height: 1.3; margin-bottom: 0.75rem; }
.case-desc { font-size: 0.85rem; color: var(--mid); line-height: 1.7; }
.case-link { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-top: 1rem; text-transform: uppercase; letter-spacing: 0.06em; }

/* TEAM */
.team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 3rem; }
.team-card { text-align: center; }
.team-photo { aspect-ratio: 3/4; border-radius: var(--radius); overflow: hidden; margin-bottom: 1.25rem; }
.team-photo img { width: 100%; height: 100%; filter: grayscale(15%); transition: filter 0.3s; }
.team-card:hover .team-photo img { filter: grayscale(0%); }
.team-name { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--black); margin-bottom: 0.25rem; }
.team-title { font-size: 0.8rem; color: var(--mid); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }

/* TESTIMONIALS */
.testimonials-grid-pro { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 3rem; }
.testimonial-pro { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 2.5rem; }
.testimonial-pro-quote { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-style: italic; color: var(--text); line-height: 1.75; margin-bottom: 1.5rem; }
.testimonial-pro-author { display: flex; align-items: center; gap: 12px; }
.testimonial-pro-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--accent); color: var(--white); font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.testimonial-pro-name { font-weight: 600; font-size: 0.9rem; color: var(--black); }
.testimonial-pro-role { font-size: 0.775rem; color: var(--light); margin-top: 2px; }

/* CONTACT */
.contact-band { background: var(--accent); padding: 1.5rem 3rem; }
.contact-band-inner { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap; }
.contact-band-text { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; color: var(--white); }
.contact-band-input { display: flex; gap: 0.5rem; flex: 1; max-width: 400px; }
.contact-band-input input { flex: 1; padding: 0.75rem 1rem; border: none; border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; }
.contact-band-input button { background: var(--black); color: var(--white); border: none; padding: 0.75rem 1.5rem; border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; white-space: nowrap; }

/* CONTACT PAGE */
.contact-grid-pro { display: grid; grid-template-columns: 1fr 1.4fr; gap: 6rem; align-items: start; }
.contact-info-pro h2 { font-size: clamp(2rem, 3vw, 2.8rem); color: var(--black); margin-bottom: 1rem; }
.contact-detail-pro { display: flex; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.contact-detail-pro:last-of-type { border-bottom: none; }
.contact-detail-pro-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--light); margin-bottom: 4px; }
.contact-detail-pro-val { font-size: 0.95rem; color: var(--black); font-weight: 500; }
.form-pro { background: var(--cream); border-radius: var(--radius); padding: 3rem; }
.form-pro h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; margin-bottom: 0.5rem; }
.form-pro p { font-size: 0.875rem; color: var(--mid); margin-bottom: 2rem; }
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mid); margin-bottom: 0.4rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.85rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; background: var(--white); color: var(--text); transition: border-color 0.2s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--accent); }
.form-group textarea { min-height: 120px; resize: vertical; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-submit { width: 100%; padding: 1rem; background: var(--black); color: var(--white); border: none; border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; margin-top: 0.5rem; }
.form-submit:hover { background: var(--dark); }

/* PAGE HERO */
.page-hero { background: var(--cream); padding: 4rem 3rem; border-bottom: 1px solid var(--border); }
.page-hero-inner { max-width: 1180px; margin: 0 auto; }
.page-hero h1 { font-size: clamp(2.5rem, 5vw, 4.5rem); color: var(--black); margin-bottom: 0.75rem; }
.page-hero p { font-size: 1rem; color: var(--mid); max-width: 500px; }
.breadcrumb { font-size: 0.75rem; color: var(--light); margin-bottom: 1rem; letter-spacing: 0.06em; text-transform: uppercase; }
.breadcrumb a { color: var(--accent); }
.breadcrumb span { margin: 0 8px; }

/* FOOTER */
footer { background: var(--dark); color: rgba(255,255,255,0.45); padding: 5rem 3rem 2.5rem; }
.footer-inner { max-width: 1180px; margin: 0 auto; }
.footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 4rem; margin-bottom: 4rem; padding-bottom: 3rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
.footer-brand .logo { color: var(--white); font-size: 2rem; margin-bottom: 1rem; display: block; }
.footer-brand p { font-size: 0.875rem; line-height: 1.75; max-width: 260px; }
.footer-col h4 { font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 1.25rem; }
.footer-col a { display: block; font-size: 0.85rem; color: rgba(255,255,255,0.35); margin-bottom: 0.75rem; transition: color 0.2s; }
.footer-col a:hover { color: var(--white); }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.footer-copy { font-size: 0.8rem; }
.footer-tagline { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; color: rgba(255,255,255,0.2); font-style: italic; }

/* ANIMATIONS */
.fade-up { opacity: 1; transform: none; transition: opacity 0.6s ease, transform 0.6s ease; }
.fade-up.visible { opacity: 1; transform: none; }

/* RESPONSIVE */
@media (max-width: 960px) {
  .hero-inner { grid-template-columns: 1fr; min-height: auto; }
  .hero-left { border-right: none; padding: 4rem 0; border-bottom: 1px solid var(--border); }
  .hero-right { height: 400px; }
  .services-intro, .contact-grid-pro { grid-template-columns: 1fr; gap: 3rem; }
  .services-list-pro, .case-grid, .team-grid { grid-template-columns: 1fr 1fr; }
  .testimonials-grid-pro { grid-template-columns: 1fr; }
  .featured-quote-inner { grid-template-columns: 1fr; }
  .footer-top { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  nav { padding: 0 1.5rem; }
  .nav-links { display: none; }
  section { padding: 4rem 1.5rem; }
  .hero { padding: 0 1.5rem; }
  .services-list-pro, .case-grid, .team-grid { grid-template-columns: 1fr; }
  .footer-top { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .expertise-grid { grid-template-columns: 1fr; }
  .expertise-item:nth-child(even) { border-right: 1px solid var(--border); }
}
  `;
}

const js = `
<script>
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
const form = document.querySelector('.contact-form');
if(form) form.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('.form-submit');
  btn.textContent = '✓ Received — we\'ll be in touch shortly.';
  btn.style.background = '#2d6a4f';
  form.reset();
});
const band = document.querySelector('.contact-band-input');
if(band) band.addEventListener('submit', e => { e.preventDefault(); });
</script>
`;

function nav(business: SiteData['business'], activePage: string) {
  const pages = [
    { href: 'index.html', label: 'Home' },
    { href: 'services.html', label: 'Services' },
    { href: 'about.html', label: 'About' },
    { href: 'contact.html', label: 'Contact' },
  ];
  return `
<nav>
  <div class="logo">${business.name.split(' ')[0]} <em>${business.name.split(' ').slice(1).join(' ')}</em></div>
  <div class="nav-links">
    ${pages.map(p => `<a href="${p.href}"${activePage === p.href ? ' style="color:var(--black);font-weight:600"' : ''}>${p.label}</a>`).join('')}
    <a href="contact.html" class="nav-cta btn">Schedule a Consultation</a>
  </div>
</nav>`;
}

function footer(b: SiteData['business']) {
  return `
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="logo">${b.name}</span>
        <p>${b.tagline}. Trusted by clients throughout ${b.city}, ${b.state}.</p>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="services.html">Services</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        <a href="services.html">All Services</a>
        <a href="contact.html">Free Consultation</a>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <a href="tel:${b.phone}">${b.phone}</a>
        <a href="mailto:${b.email}">${b.email}</a>
        <a href="#">${b.city}, ${b.state}</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© ${new Date().getFullYear()} ${b.name}. All rights reserved. Website by <a href="https://exsisto.ai" style="color:var(--accent)">Exsisto</a>.</div>
      <div class="footer-tagline">${b.tagline}</div>
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
<style>${css(accent)}</style>
</head>
<body>`;
}

const placeholderLogos = ['AlphaGroup', 'Meridian Co.', 'NorthStar LLC', 'Pinnacle Partners', 'Summit Group', 'Vantage Corp'];

export function buildIndex(d: SiteData): string {
  const { business: b, website: w } = d;
  const heroImg = w.hero_image_url || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1000&auto=format';
  const teamImg = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format';

  return `${head(w.meta_title, w.meta_description, w.keywords, b.accent_color)}
${nav(b, 'index.html')}

<!-- HERO -->
<div class="hero">
  <div class="hero-inner">
    <div class="hero-left">
      <div class="hero-eyebrow">${b.city}, ${b.state} · Est. ${new Date().getFullYear()}</div>
      <h1>Your Partner for<br/><em>${b.tagline}</em></h1>
      <p class="hero-sub">${b.description}</p>
      <div class="hero-actions">
        <a href="contact.html" class="btn btn-dark">Schedule a Consultation →</a>
        <a href="services.html" class="btn btn-outline">Our Services</a>
      </div>
      <div class="hero-stats">
        ${w.stats.slice(0, 3).map(s => `
        <div>
          <div class="hero-stat-val">${s.value}</div>
          <div class="hero-stat-lbl">${s.label}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="hero-right">
      <img src="${heroImg}" alt="${b.name} team" loading="eager"/>
      <div class="hero-right-caption">
        <div class="hero-caption-quote">"${w.testimonials?.[0]?.text?.slice(0, 80) || 'Exceptional service and results beyond our expectations.'}"</div>
        <div class="hero-caption-author">— ${w.testimonials?.[0]?.name || 'A satisfied client'}</div>
      </div>
    </div>
  </div>
</div>

<!-- LOGOS -->
<div class="logos-band">
  <div class="logos-inner">
    <div class="logos-label">Trusted by</div>
    ${placeholderLogos.map(l => `<div class="logo-item">${l}</div>`).join('')}
  </div>
</div>

<!-- SERVICES -->
<section>
  <div class="container">
    <div class="services-intro">
      <div class="fade-up">
        <span class="label">What We Do</span>
        <h2 class="section-title">Empowering your success</h2>
        <p class="section-sub">${b.description}</p>
        <a href="services.html" class="btn btn-outline" style="margin-top:2rem">All Services →</a>
      </div>
      <div></div>
    </div>
    <div class="services-list-pro">
      ${w.services.map((s, i) => `
      <div class="service-card-pro fade-up">
        <div class="service-card-pro-num">0${i + 1}</div>
        <div class="service-card-pro-name">${s.name}</div>
        <div class="service-card-pro-desc">${s.description}</div>
        <div class="service-card-pro-link">Learn more →</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- EXPERTISE -->
<section class="bg-cream">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:start">
      <div class="fade-up">
        <span class="label">Overview & Expertise</span>
        <h2 class="section-title">Areas of practice</h2>
        <p class="section-sub">Comprehensive expertise across the disciplines that matter most to your business.</p>
        <a href="contact.html" class="btn btn-dark" style="margin-top:2rem">Book a Consultation →</a>
      </div>
      <div class="expertise-grid fade-up">
        ${w.services.flatMap(s => [s.name, ...(s.description.split('.').slice(0, 1))]).slice(0, 12).map((item, i) => `
        <div class="expertise-item">
          <div class="expertise-dot"></div>
          <div class="expertise-name">${item.trim()}</div>
          <div class="expertise-num">0${i + 1}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>

<!-- FEATURED QUOTE -->
<div class="featured-quote">
  <div class="featured-quote-inner">
    <div class="fade-up">
      <div class="quote-mark">"</div>
      <div class="quote-text">${w.testimonials?.[0]?.text || 'Exceptional service that exceeded all expectations. Highly recommended to anyone seeking professional expertise.'}</div>
      <div class="quote-author-name">${w.testimonials?.[0]?.name || 'Client'}</div>
      <div class="quote-author-title">${w.testimonials?.[0]?.location || b.city}</div>
      <div class="quote-signature">${b.name}</div>
    </div>
    <div class="quote-photo fade-up">
      <img src="${teamImg}" alt="Professional team" loading="lazy"/>
    </div>
  </div>
</div>

<!-- CASE STUDIES -->
<section>
  <div class="container">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:0.5rem">
      <div>
        <span class="label">Client Success Stories</span>
        <h2 class="section-title">Results we've achieved</h2>
      </div>
      <a href="contact.html" class="btn btn-outline">All Stories →</a>
    </div>
    <div class="case-grid">
      ${w.services.slice(0, 3).map((s, i) => `
      <div class="case-card fade-up">
        <div class="case-img">
          <img src="${heroImg}" alt="${s.name}" loading="lazy"/>
        </div>
        <div class="case-body">
          <div class="case-tag">${s.name}</div>
          <div class="case-title">Delivering ${s.name} Excellence for Growing Businesses</div>
          <div class="case-desc">How we helped a client achieve measurable results through focused ${s.name.toLowerCase()} strategy.</div>
          <div class="case-link">Read more →</div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="bg-cream">
  <div class="container">
    <div style="text-align:center;margin-bottom:0.5rem">
      <span class="label">Client Testimonials</span>
      <h2 class="section-title">What our clients say</h2>
    </div>
    <div class="testimonials-grid-pro">
      ${w.testimonials.map(t => `
      <div class="testimonial-pro fade-up">
        <div class="testimonial-pro-quote">"${t.text}"</div>
        <div class="testimonial-pro-author">
          <div class="testimonial-pro-avatar">${t.name.charAt(0)}</div>
          <div>
            <div class="testimonial-pro-name">${t.name}</div>
            <div class="testimonial-pro-role">${t.location}</div>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- CONTACT BAND -->
<div class="contact-band">
  <div class="contact-band-inner">
    <div class="contact-band-text">Ready to get started?</div>
    <div style="display:flex;gap:1rem">
      <a href="contact.html" class="btn" style="background:var(--black);color:white">Schedule a Free Consultation →</a>
      <a href="tel:${b.phone}" class="btn btn-outline-light">📞 ${b.phone}</a>
    </div>
  </div>
</div>

${footer(b)}
${js}
</body></html>`;
}

export function buildServices(d: SiteData): string {
  const { business: b, website: w } = d;
  const heroImg = w.hero_image_url || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1000&auto=format';

  return `${head(`Services | ${w.meta_title}`, `Explore all services from ${b.name} in ${b.city}, ${b.state}.`, w.keywords, b.accent_color)}
${nav(b, 'services.html')}

<div class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="index.html">Home</a><span>›</span>Services</div>
    <h1>Our Services</h1>
    <p>Tailored expertise for every challenge. Serving ${b.city}, ${b.state} and beyond.</p>
  </div>
</div>

<section>
  <div class="container">
    <div class="services-list-pro">
      ${w.services.map((s, i) => `
      <div class="service-card-pro fade-up">
        <div class="service-card-pro-num">0${i + 1}</div>
        <div class="service-card-pro-name">${s.name}</div>
        <div class="service-card-pro-desc">${s.description}</div>
        <a href="contact.html" class="btn btn-outline" style="margin-top:1.5rem;font-size:0.8rem;padding:0.65rem 1.25rem">Get Started →</a>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="bg-cream">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center">
      <div class="fade-up">
        <span class="label">Why ${b.name}</span>
        <h2 class="section-title">The difference is in the details</h2>
        <p class="section-sub">${b.description}</p>
        <div style="margin-top:2rem;display:flex;flex-direction:column;gap:1rem">
          ${['Deep industry expertise', 'Personalized approach to every client', 'Transparent, upfront pricing', 'Ongoing support and communication'].map(item => `
          <div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;font-weight:500">
            <span style="color:var(--accent);font-size:1rem">→</span>${item}
          </div>`).join('')}
        </div>
        <a href="contact.html" class="btn btn-dark" style="margin-top:2rem">Book a Consultation →</a>
      </div>
      <div style="border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3" class="fade-up">
        <img src="${heroImg}" alt="${b.name}" style="width:100%;height:100%;object-fit:cover" loading="lazy"/>
      </div>
    </div>
  </div>
</section>

${footer(b)}
${js}
</body></html>`;
}

export function buildAbout(d: SiteData): string {
  const { business: b, website: w } = d;
  const heroImg = w.hero_image_url || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1000&auto=format';
  const teamImg = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format';

  return `${head(`About | ${w.meta_title}`, `About ${b.name} — ${b.city}, ${b.state}.`, w.keywords, b.accent_color)}
${nav(b, 'about.html')}

<div class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="index.html">Home</a><span>›</span>About</div>
    <h1>About ${b.name}</h1>
    <p>${b.tagline}. Trusted advisors in ${b.city}, ${b.state}.</p>
  </div>
</div>

<section>
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6rem;align-items:center">
      <div style="border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3" class="fade-up">
        <img src="${heroImg}" alt="${b.name}" style="width:100%;height:100%;object-fit:cover"/>
      </div>
      <div class="fade-up">
        <span class="label">Our Story</span>
        <h2 class="section-title">Built on trust, driven by results</h2>
        <p class="section-sub">${b.description}</p>
        <p class="section-sub" style="margin-top:1rem">We believe every client deserves expert guidance delivered with honesty, clarity, and care. That principle has shaped everything we do since day one.</p>
        <a href="contact.html" class="btn btn-dark" style="margin-top:2.5rem">Schedule a Consultation →</a>
      </div>
    </div>
  </div>
</section>

<div class="featured-quote">
  <div class="featured-quote-inner">
    <div class="fade-up">
      <div class="quote-mark">"</div>
      <div class="quote-text">${w.testimonials?.[1]?.text || 'The level of expertise and personal attention we received was exceptional. They truly care about their clients.'}</div>
      <div class="quote-author-name">${w.testimonials?.[1]?.name || 'A valued client'}</div>
      <div class="quote-author-title">${w.testimonials?.[1]?.location || b.city}</div>
      <div class="quote-signature">${b.name}</div>
    </div>
    <div class="quote-photo fade-up">
      <img src="${teamImg}" alt="Our team" loading="lazy"/>
    </div>
  </div>
</div>

<section>
  <div class="container" style="text-align:center;max-width:700px;margin:0 auto">
    <span class="label">Our Values</span>
    <h2 class="section-title" style="margin-bottom:3rem">What we stand for</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;text-align:left">
      ${['Integrity in everything we do', 'Results-driven approach', 'Clear, honest communication', 'Long-term client relationships'].map((v, i) => `
      <div style="padding:2rem;background:var(--cream);border-radius:var(--radius);border-top:3px solid var(--accent)" class="fade-up">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:700;color:var(--accent);opacity:0.4;margin-bottom:0.75rem">0${i+1}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:600;color:var(--black)">${v}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

${footer(b)}
${js}
</body></html>`;
}

export function buildContact(d: SiteData): string {
  const { business: b, website: w } = d;

  return `${head(`Contact | ${w.meta_title}`, `Contact ${b.name} for a free consultation in ${b.city}, ${b.state}.`, w.keywords, b.accent_color)}
${nav(b, 'contact.html')}

<div class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="index.html">Home</a><span>›</span>Contact</div>
    <h1>Let's Talk</h1>
    <p>Schedule a free consultation. No pressure, no commitment — just a conversation.</p>
  </div>
</div>

<section>
  <div class="container">
    <div class="contact-grid-pro">
      <div class="fade-up">
        <span class="label">Get in Touch</span>
        <h2 style="font-size:clamp(2rem,3vw,2.8rem);color:var(--black);margin-bottom:1.25rem">We'd love to hear from you</h2>
        <p style="font-size:0.95rem;color:var(--mid);line-height:1.8;margin-bottom:2.5rem">Whether you have a specific challenge or just want to explore how we can help — reach out. We respond to all inquiries within one business day.</p>

        ${b.phone ? `<div class="contact-detail-pro">
          <div><div class="contact-detail-pro-label">Phone</div><div class="contact-detail-pro-val">${b.phone}</div></div>
        </div>` : ''}
        ${b.email ? `<div class="contact-detail-pro">
          <div><div class="contact-detail-pro-label">Email</div><div class="contact-detail-pro-val">${b.email}</div></div>
        </div>` : ''}
        <div class="contact-detail-pro">
          <div><div class="contact-detail-pro-label">Location</div><div class="contact-detail-pro-val">${b.city}, ${b.state}</div></div>
        </div>
        <div class="contact-detail-pro">
          <div><div class="contact-detail-pro-label">Office Hours</div><div class="contact-detail-pro-val">Monday – Friday, 9am – 6pm</div></div>
        </div>
      </div>

      <div class="form-pro fade-up">
        <h3>Schedule a Consultation</h3>
        <p>Free, no-obligation conversation with one of our experts.</p>
        <form class="contact-form">
          <div class="form-row">
            <div class="form-group"><label>First Name</label><input type="text" placeholder="Jane" required/></div>
            <div class="form-group"><label>Last Name</label><input type="text" placeholder="Smith" required/></div>
          </div>
          <div class="form-group"><label>Email</label><input type="email" placeholder="jane@company.com" required/></div>
          <div class="form-group"><label>Phone</label><input type="tel" placeholder="${b.phone || '(555) 000-0000'}"/></div>
          <div class="form-group">
            <label>I'm interested in</label>
            <select>
              <option value="">Select a service...</option>
              ${w.services.map(s => `<option>${s.name}</option>`).join('')}
              <option>General inquiry</option>
            </select>
          </div>
          <div class="form-group"><label>Message</label><textarea placeholder="Tell us about your situation and what you're hoping to achieve..."></textarea></div>
          <button type="submit" class="form-submit">Send Message →</button>
        </form>
      </div>
    </div>
  </div>
</section>

${footer(b)}
${js}
</body></html>`;
}

export function buildProfessionalSite(d: SiteData): Record<string, string> {
  return {
    'index.html': buildIndex(d),
    'services.html': buildServices(d),
    'about.html': buildAbout(d),
    'contact.html': buildContact(d),
  };
}

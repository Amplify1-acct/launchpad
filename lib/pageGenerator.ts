/**
 * lib/pageGenerator.ts
 * Generates Services, About, Contact, and Blog Index pages
 * for customer websites. Called after the main site is generated.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Business {
  name: string;
  industry: string;
  description?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
  services?: string[];
  years_in_business?: string;
  differentiator?: string;
  key_stat?: string;
  key_stat_label?: string;
}

function sharedNav(bizName: string, phone: string): string {
  return `
  <nav style="position:fixed;top:0;width:100%;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid #f0f0f0;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;">
    <a href="/" style="font-size:16px;font-weight:900;text-decoration:none;color:#111;">${bizName}</a>
    <div style="display:flex;align-items:center;gap:24px;">
      <a href="/services" style="font-size:14px;color:#555;text-decoration:none;font-weight:500;">Services</a>
      <a href="/about" style="font-size:14px;color:#555;text-decoration:none;font-weight:500;">About</a>
      <a href="/blog" style="font-size:14px;color:#555;text-decoration:none;font-weight:500;">Blog</a>
      <a href="/contact" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">Contact Us</a>
    </div>
  </nav>`;
}

function sharedFooter(bizName: string, city: string, phone: string): string {
  return `
  <footer style="background:#111;color:rgba(255,255,255,0.6);padding:48px 24px;margin-top:80px;">
    <div style="max-width:960px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;">
      <div>
        <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:12px;">${bizName}</div>
        <div style="font-size:13px;line-height:1.8;">${city}<br/>${phone}</div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:12px;">Pages</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <a href="/" style="color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;">Home</a>
          <a href="/services" style="color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;">Services</a>
          <a href="/about" style="color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;">About</a>
          <a href="/blog" style="color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;">Blog</a>
          <a href="/contact" style="color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;">Contact</a>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:12px;">Contact</div>
        <div style="font-size:14px;line-height:1.8;">${phone}<br/>Serving ${city}</div>
      </div>
    </div>
    <div style="max-width:960px;margin:32px auto 0;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);font-size:12px;">
      © ${new Date().getFullYear()} ${bizName} · Powered by Exsisto
    </div>
  </footer>`;
}

function baseHTML(title: string, description: string, nav: string, content: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#111;background:#fff;padding-top:64px}
    @media(max-width:768px){
      nav div:not(:first-child){display:none!important}
      footer>div{grid-template-columns:1fr!important}
    }
  </style>
</head>
<body>
  ${nav}
  ${content}
  ${footer}
</body>
</html>`;
}

// ── Services Page ─────────────────────────────────────────────────────────────
export async function generateServicesPage(business: Business, tokens: Record<string, string>): Promise<string> {
  const services = business.services?.length ? business.services : 
    [tokens.service_1_name, tokens.service_2_name, tokens.service_3_name, 
     tokens.service_4_name, tokens.service_5_name, tokens.service_6_name].filter(Boolean);

  const serviceDescriptions: Record<string, string> = {
    [tokens.service_1_name]: tokens.service_1_description,
    [tokens.service_2_name]: tokens.service_2_description,
    [tokens.service_3_name]: tokens.service_3_description,
    [tokens.service_4_name]: tokens.service_4_description,
    [tokens.service_5_name]: tokens.service_5_description,
    [tokens.service_6_name]: tokens.service_6_description,
  };

  const nav = sharedNav(business.name, business.phone || "");
  const footer = sharedFooter(business.name, business.city || "", business.phone || "");

  const content = `
  <section style="background:linear-gradient(135deg,#0f0f1a,#1a1a2e);color:#fff;padding:80px 24px 96px;text-align:center;">
    <div style="max-width:640px;margin:0 auto;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-bottom:16px;">Our Services</div>
      <h1 style="font-size:clamp(32px,6vw,52px);font-weight:900;line-height:1.05;letter-spacing:-1px;margin-bottom:20px;">
        ${tokens.services_heading || "Professional Services"}
      </h1>
      <p style="font-size:17px;color:rgba(255,255,255,0.7);line-height:1.7;">
        Serving ${business.city || "your area"} with quality ${business.industry || "services"} since ${business.years_in_business ? `${new Date().getFullYear() - parseInt(business.years_in_business)} years ago` : "our founding"}.
      </p>
    </div>
  </section>

  <section style="max-width:960px;margin:0 auto;padding:80px 24px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      ${services.map((svc, i) => `
        <div style="border:1.5px solid #f0f0f0;border-radius:16px;padding:32px;transition:box-shadow 0.2s;">
          <div style="width:48px;height:48px;background:#f5f3ff;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px;">
            ${["🔧","⚡","🏠","🌿","✨","🛠️","🔑","📋","🚗","🔩"][i % 10]}
          </div>
          <h3 style="font-size:18px;font-weight:800;margin-bottom:10px;">${svc}</h3>
          <p style="font-size:14px;color:#666;line-height:1.7;">${serviceDescriptions[svc] || `Professional ${svc.toLowerCase()} services delivered with care and expertise.`}</p>
          <a href="/contact" style="display:inline-block;margin-top:16px;font-size:13px;font-weight:700;color:#4648d4;text-decoration:none;">Get a quote →</a>
        </div>
      `).join("")}
    </div>
  </section>

  <section style="background:#f9f9ff;padding:64px 24px;text-align:center;">
    <div style="max-width:560px;margin:0 auto;">
      <h2 style="font-size:clamp(24px,4vw,36px);font-weight:900;margin-bottom:16px;">Ready to get started?</h2>
      <p style="font-size:16px;color:#666;margin-bottom:32px;">Contact us today for a free estimate. We serve ${business.city || "your area"} and surrounding communities.</p>
      <a href="/contact" style="background:#111;color:#fff;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;display:inline-block;">Get Free Estimate →</a>
      ${business.phone ? `<div style="margin-top:16px;font-size:14px;color:#999;">or call <a href="tel:${business.phone.replace(/\D/g,'')}" style="color:#4648d4;font-weight:700;">${business.phone}</a></div>` : ""}
    </div>
  </section>`;

  return baseHTML(
    `Services | ${business.name}`,
    `Professional ${business.industry} services in ${business.city}. ${services.slice(0,3).join(", ")} and more.`,
    nav, content, footer
  );
}

// ── About Page ────────────────────────────────────────────────────────────────
export async function generateAboutPage(business: Business, tokens: Record<string, string>): Promise<string> {
  const nav = sharedNav(business.name, business.phone || "");
  const footer = sharedFooter(business.name, business.city || "", business.phone || "");

  const content = `
  <section style="background:linear-gradient(135deg,#0f0f1a,#1a1a2e);color:#fff;padding:80px 24px 96px;text-align:center;">
    <div style="max-width:640px;margin:0 auto;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-bottom:16px;">About Us</div>
      <h1 style="font-size:clamp(32px,6vw,52px);font-weight:900;line-height:1.05;letter-spacing:-1px;margin-bottom:20px;">
        ${tokens.about_headline || `About ${business.name}`}
      </h1>
      <p style="font-size:17px;color:rgba(255,255,255,0.7);line-height:1.7;">${tokens.about_headline_2 || ""}</p>
    </div>
  </section>

  <section style="max-width:880px;margin:0 auto;padding:80px 24px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
      <div>
        <h2 style="font-size:clamp(24px,4vw,36px);font-weight:900;margin-bottom:24px;line-height:1.1;">Our Story</h2>
        <p style="font-size:16px;color:#444;line-height:1.8;margin-bottom:16px;">${tokens.about_paragraph_1 || business.description || ""}</p>
        <p style="font-size:16px;color:#444;line-height:1.8;">${tokens.about_paragraph_2 || ""}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        ${[
          [tokens.stat_1_value || (business.years_in_business ? `${business.years_in_business}+` : "10+"), tokens.stat_1_label || "Years Experience"],
          [tokens.stat_2_value || "500+", tokens.stat_2_label || "Happy Clients"],
          [tokens.stat_3_value || "100%", tokens.stat_3_label || "Satisfaction"],
          [tokens.stat_4_value || "4.9★", tokens.stat_4_label || "Avg Rating"],
        ].map(([val, label]) => `
          <div style="background:#f9f9ff;border-radius:16px;padding:24px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#4648d4;">${val}</div>
            <div style="font-size:12px;color:#999;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section style="background:#f9f9ff;padding:64px 24px;">
    <div style="max-width:880px;margin:0 auto;">
      <h2 style="font-size:clamp(22px,4vw,32px);font-weight:900;margin-bottom:40px;text-align:center;">Why Choose Us</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;">
        ${[tokens.feature_1, tokens.feature_2, tokens.feature_3, tokens.feature_4].filter(Boolean).map(f => `
          <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #ede9f8;">
            <div style="font-size:20px;margin-bottom:12px;">✓</div>
            <div style="font-size:15px;font-weight:700;">${f}</div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  return baseHTML(
    `About | ${business.name}`,
    `Learn about ${business.name} — ${business.industry} serving ${business.city}. ${business.description || ""}`.slice(0, 160),
    nav, content, footer
  );
}

// ── Contact Page ──────────────────────────────────────────────────────────────
export async function generateContactPage(business: Business, tokens: Record<string, string>): Promise<string> {
  const nav = sharedNav(business.name, business.phone || "");
  const footer = sharedFooter(business.name, business.city || "", business.phone || "");

  const content = `
  <section style="background:linear-gradient(135deg,#0f0f1a,#1a1a2e);color:#fff;padding:80px 24px 96px;text-align:center;">
    <div style="max-width:640px;margin:0 auto;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-bottom:16px;">Contact Us</div>
      <h1 style="font-size:clamp(32px,6vw,52px);font-weight:900;line-height:1.05;letter-spacing:-1px;margin-bottom:20px;">
        ${tokens.contact_heading || "Get In Touch"}
      </h1>
      <p style="font-size:17px;color:rgba(255,255,255,0.7);line-height:1.7;">${tokens.contact_description || `We'd love to hear from you. Serving ${business.city || "your area"} and surrounding communities.`}</p>
    </div>
  </section>

  <section style="max-width:880px;margin:0 auto;padding:80px 24px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;">
      <div>
        <h2 style="font-size:24px;font-weight:800;margin-bottom:32px;">Send Us a Message</h2>
        <form style="display:flex;flex-direction:column;gap:16px;" onsubmit="handleSubmit(event)">
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Your Name *</label>
            <input name="name" required style="width:100%;padding:12px 14px;border:1.5px solid #e5e5e5;border-radius:8px;font-size:15px;font-family:inherit;" placeholder="John Smith"/>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Email *</label>
            <input name="email" type="email" required style="width:100%;padding:12px 14px;border:1.5px solid #e5e5e5;border-radius:8px;font-size:15px;font-family:inherit;" placeholder="john@example.com"/>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Phone</label>
            <input name="phone" type="tel" style="width:100%;padding:12px 14px;border:1.5px solid #e5e5e5;border-radius:8px;font-size:15px;font-family:inherit;" placeholder="(555) 555-0100"/>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Message *</label>
            <textarea name="message" required rows="5" style="width:100%;padding:12px 14px;border:1.5px solid #e5e5e5;border-radius:8px;font-size:15px;font-family:inherit;resize:vertical;" placeholder="Tell us about your project..."></textarea>
          </div>
          <button type="submit" style="background:#111;color:#fff;padding:14px 24px;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">
            Send Message →
          </button>
          <div id="form-success" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;color:#166534;font-size:14px;font-weight:600;">
            ✓ Message sent! We'll be in touch shortly.
          </div>
        </form>
      </div>
      <div>
        <h2 style="font-size:24px;font-weight:800;margin-bottom:32px;">Contact Info</h2>
        <div style="display:flex;flex-direction:column;gap:24px;">
          ${business.phone ? `
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;background:#f5f3ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📞</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:#999;margin-bottom:4px;">PHONE</div>
              <a href="tel:${business.phone.replace(/\D/g,'')}" style="font-size:18px;font-weight:700;color:#111;text-decoration:none;">${business.phone}</a>
            </div>
          </div>` : ""}
          ${business.email ? `
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;background:#f5f3ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">✉️</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:#999;margin-bottom:4px;">EMAIL</div>
              <a href="mailto:${business.email}" style="font-size:16px;font-weight:700;color:#111;text-decoration:none;">${business.email}</a>
            </div>
          </div>` : ""}
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;background:#f5f3ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📍</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:#999;margin-bottom:4px;">SERVICE AREA</div>
              <div style="font-size:16px;font-weight:700;">${business.city || ""}${business.state ? `, ${business.state}` : ""} and surrounding areas</div>
            </div>
          </div>
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;background:#f5f3ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🕐</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:#999;margin-bottom:4px;">HOURS</div>
              <div style="font-size:15px;line-height:1.7;">Mon–Fri: 8am–6pm<br/>Sat: 9am–4pm<br/>Sun: By appointment</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <script>
  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type=submit]');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    const data = Object.fromEntries(new FormData(form));
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({...data, business: '${business.name}', to: '${business.email || ""}'})
      });
    } catch(e) {}
    form.reset();
    document.getElementById('form-success').style.display = 'block';
    btn.textContent = 'Send Message →';
    btn.disabled = false;
  }
  </script>`;

  return baseHTML(
    `Contact | ${business.name}`,
    `Contact ${business.name} in ${business.city}. ${business.phone || ""} — Free estimates available.`,
    nav, content, footer
  );
}

// ── Blog Index Page ───────────────────────────────────────────────────────────
export async function generateBlogIndexPage(
  business: Business,
  posts: Array<{ title: string; slug: string; excerpt: string; featured_image_url: string; published_at: string }>
): Promise<string> {
  const nav = sharedNav(business.name, business.phone || "");
  const footer = sharedFooter(business.name, business.city || "", business.phone || "");

  const content = `
  <section style="background:linear-gradient(135deg,#0f0f1a,#1a1a2e);color:#fff;padding:80px 24px 96px;text-align:center;">
    <div style="max-width:640px;margin:0 auto;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-bottom:16px;">Blog</div>
      <h1 style="font-size:clamp(32px,6vw,52px);font-weight:900;line-height:1.05;letter-spacing:-1px;margin-bottom:20px;">
        Tips & Insights
      </h1>
      <p style="font-size:17px;color:rgba(255,255,255,0.7);line-height:1.7;">
        Expert advice from the team at ${business.name}.
      </p>
    </div>
  </section>

  <section style="max-width:880px;margin:0 auto;padding:80px 24px;">
    ${posts.length === 0 ? `
      <div style="text-align:center;padding:80px;color:#999;">
        <div style="font-size:48px;margin-bottom:16px;">📝</div>
        <p style="font-size:16px;">Blog posts coming soon. Check back shortly!</p>
      </div>
    ` : `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
        ${posts.map(post => `
          <a href="/blog/${post.slug}" style="text-decoration:none;color:inherit;">
            <article style="border:1.5px solid #f0f0f0;border-radius:16px;overflow:hidden;transition:box-shadow 0.2s;cursor:pointer;">
              ${post.featured_image_url ? `<img src="${post.featured_image_url}" alt="${post.title}" style="width:100%;height:200px;object-fit:cover;display:block;"/>` : `<div style="height:200px;background:linear-gradient(135deg,#f5f3ff,#ede9f8);"></div>`}
              <div style="padding:24px;">
                <div style="font-size:12px;color:#999;margin-bottom:8px;">${post.published_at ? new Date(post.published_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : ""}</div>
                <h3 style="font-size:18px;font-weight:800;line-height:1.3;margin-bottom:10px;">${post.title}</h3>
                <p style="font-size:14px;color:#666;line-height:1.6;">${post.excerpt || ""}</p>
                <div style="margin-top:16px;font-size:13px;font-weight:700;color:#4648d4;">Read more →</div>
              </div>
            </article>
          </a>
        `).join("")}
      </div>
    `}
  </section>`;

  return baseHTML(
    `Blog | ${business.name}`,
    `Tips, insights and news from ${business.name} — ${business.industry} in ${business.city}.`,
    nav, content, footer
  );
}

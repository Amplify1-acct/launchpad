const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "Exsisto <hello@exsisto.ai>";

async function send(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #fcf8ff; color: #1b1b25; }
  .wrapper { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 16px; border: 1px solid #ede9f8; overflow: hidden; }
  .header { padding: 28px 32px 24px; border-bottom: 1px solid #ede9f8; }
  .logo { font-size: 20px; font-weight: 800; color: #1b1b25; letter-spacing: -0.5px; }
  .logo span { color: #4648d4; }
  .body { padding: 32px; }
  h1 { font-size: 22px; font-weight: 800; color: #1b1b25; letter-spacing: -0.3px; margin-bottom: 10px; line-height: 1.3; }
  p { font-size: 14px; color: #6b6b8a; line-height: 1.7; margin-bottom: 16px; }
  .btn { display: inline-block; background: #4648d4; color: #ffffff !important; font-size: 14px; font-weight: 700; padding: 13px 28px; border-radius: 8px; text-decoration: none; margin: 8px 0 20px; }
  .btn-outline { display: inline-block; border: 1.5px solid #4648d4; color: #4648d4 !important; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 8px 0 20px; }
  .divider { height: 1px; background: #ede9f8; margin: 24px 0; }
  .highlight { background: #f5f2ff; border-radius: 10px; padding: 16px 20px; margin: 16px 0; }
  .highlight p { margin: 0; color: #1b1b25; font-size: 13px; }
  .stat { display: inline-block; text-align: center; margin-right: 24px; }
  .stat-value { font-size: 20px; font-weight: 800; color: #4648d4; }
  .stat-label { font-size: 11px; color: #9090a8; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer { padding: 20px 32px; border-top: 1px solid #ede9f8; }
  .footer p { font-size: 12px; color: #9090a8; margin: 0; }
  .footer a { color: #4648d4; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="logo">Ex<span>sisto</span></div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Exsisto · Your digital presence, handled · <a href="https://exsisto.ai">exsisto.ai</a></p>
      <p style="margin-top:6px;">Questions? Reply to this email or contact <a href="mailto:support@exsisto.ai">support@exsisto.ai</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── WELCOME EMAIL ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, businessName: string, plan: string) {
  const planFreq: Record<string, { blog: string; social: string }> = {
    starter: { blog: "2 blog posts", social: "8 social posts" },
    pro:     { blog: "4 blog posts", social: "16 social posts" },
    premium: { blog: "8 blog posts", social: "32 social posts" },
  };
  const freq = planFreq[plan] || planFreq.starter;

  const html = baseTemplate(`
    <h1>Welcome to Exsisto, ${businessName}! 🎉</h1>
    <p>We're building your digital presence right now. In the next few minutes you'll have a professional website, blog posts, and social media content — all ready for your review.</p>

    <div class="highlight">
      <p><strong>What's included in your ${plan} plan:</strong></p>
      <br/>
      <div class="stat">
        <div class="stat-value">${freq.blog}</div>
        <div class="stat-label">per month</div>
      </div>
      <div class="stat">
        <div class="stat-value">${freq.social}</div>
        <div class="stat-label">per month</div>
      </div>
    </div>

    <a href="https://exsisto.ai/dashboard" class="btn">Go to my dashboard →</a>

    <div class="divider"></div>
    <p style="font-size:13px;">Your 7-day free trial has started. No charge until your trial ends. Cancel anytime from your dashboard settings.</p>
  `);

  return send(to, `Welcome to Exsisto — we're building your site now`, html);
}

// ─── SITE READY EMAIL ─────────────────────────────────────────────────────────
export async function sendSiteReadyEmail(to: string, businessName: string, previewUrl: string) {
  const html = baseTemplate(`
    <h1>Your website is ready to review 🌐</h1>
    <p>We've built a custom website for <strong>${businessName}</strong>. Take a look and approve it to go live — it only takes a click.</p>

    <div class="highlight">
      <p>✦ Custom design tailored to your business</p>
      <p style="margin-top:6px;">✦ Your services, headlines, and copy — all written by AI</p>
      <p style="margin-top:6px;">✦ Mobile-friendly and SEO-optimized</p>
    </div>

    <a href="${previewUrl}" class="btn">Review my website →</a>
    <br/>
    <p style="font-size:12px;color:#9090a8;">Not happy with it? You can request changes directly from the review page and we'll rebuild it.</p>
  `);

  return send(to, `Your ${businessName} website is ready to review`, html);
}

// ─── SITE LIVE EMAIL ──────────────────────────────────────────────────────────
export async function sendSiteLiveEmail(to: string, businessName: string, siteUrl: string) {
  const html = baseTemplate(`
    <h1>You're live! 🚀</h1>
    <p><strong>${businessName}</strong> is now live on the web. Share it with your customers, add it to your business cards, and tell the world.</p>

    <div class="highlight">
      <p style="font-size:15px;font-weight:700;color:#4648d4;">${siteUrl.replace("https://", "")}</p>
    </div>

    <a href="${siteUrl}" class="btn">View my live site →</a>
    <a href="https://exsisto.ai/dashboard" class="btn-outline">Go to dashboard</a>

    <div class="divider"></div>
    <p style="font-size:13px;">Want to make changes? Head to your dashboard and click "Request changes" — we'll rebuild your site around your feedback.</p>
  `);

  return send(to, `${businessName} is now live on the web!`, html);
}

// ─── BLOG POSTS READY EMAIL ───────────────────────────────────────────────────
export async function sendBlogReadyEmail(to: string, businessName: string, postCount: number, titles: string[]) {
  const titleList = titles.slice(0, 3).map(t => `<p style="margin-top:6px;">✦ ${t}</p>`).join("");

  const html = baseTemplate(`
    <h1>${postCount} new blog post${postCount > 1 ? "s are" : " is"} ready ✍️</h1>
    <p>We've written ${postCount} SEO-optimized blog post${postCount > 1 ? "s" : ""} for <strong>${businessName}</strong>. Review and approve them to publish to your site.</p>

    <div class="highlight">
      ${titleList}
      ${titles.length > 3 ? `<p style="margin-top:6px;color:#9090a8;">+ ${titles.length - 3} more</p>` : ""}
    </div>

    <a href="https://exsisto.ai/dashboard/blog" class="btn">Review blog posts →</a>

    <div class="divider"></div>
    <p style="font-size:13px;">Don't like a post? You can reject it and we'll write a new one. Approved posts publish to your site automatically.</p>
  `);

  return send(to, `${postCount} new blog post${postCount > 1 ? "s" : ""} ready for ${businessName}`, html);
}

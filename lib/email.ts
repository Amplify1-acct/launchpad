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

// ─── ORDER CONFIRMATION EMAIL ─────────────────────────────────────────────────
export async function sendOrderConfirmationEmail(to: string, businessName: string, plan: string) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const html = baseTemplate(`
    <h1>Order received — we're on it! 🎉</h1>
    <p>Thanks for ordering, <strong>${businessName}</strong>! We've got your <strong>${planLabel}</strong> plan order and we're building your site right now.</p>

    <div class="highlight">
      <p>✦ Your custom AI-designed website is being built</p>
      <p style="margin-top:6px;">✦ We'll review it before sending it your way</p>
      <p style="margin-top:6px;">✦ You'll get your login link within 48 hours</p>
    </div>

    <div class="divider"></div>
    <p style="font-size:13px;">Questions? Reply to this email or write to <a href="mailto:support@exsisto.ai" style="color:#4648d4;">support@exsisto.ai</a></p>
  `);

  return send(to, `Order confirmed — building your ${businessName} website now`, html);
}

// ─── ACCOUNT SETUP / MAGIC LINK EMAIL ────────────────────────────────────────
export async function sendAccountSetupEmail(to: string, businessName: string, magicLink: string) {
  const html = baseTemplate(`
    <h1>Your Exsisto account is ready 🔑</h1>
    <p>Your website for <strong>${businessName}</strong> is live. Click the button below to access your dashboard — no password needed.</p>

    <div class="highlight">
      <p style="font-size:13px;"><strong>This link expires in 24 hours.</strong> Use it to set your password from the dashboard settings.</p>
    </div>

    <a href="${magicLink}" class="btn">Access my dashboard →</a>

    <div class="divider"></div>
    <p style="font-size:13px;">From your dashboard you can view your site, manage blog posts, social media, and request website changes.</p>
  `);

  return send(to, `Your Exsisto dashboard is ready — log in now`, html);
}

// ─── SITE LIVE + DNS EMAIL ────────────────────────────────────────────────────
export async function sendSiteLiveEmail(
  to: string,
  businessName: string,
  siteUrl: string,
  customDomain?: string,
  registrar?: string,
  dnsInstructions?: string
) {
  const dnsSection = customDomain ? `
    <div class="divider"></div>
    <h1 style="font-size:18px;">Connect your domain 🌐</h1>
    <p>You provided the domain <strong>${customDomain}</strong>. Here's how to point it to your new site:</p>
    ${dnsInstructions ? `<div class="highlight"><p style="white-space:pre-line;font-size:13px;">${dnsInstructions}</p></div>` : ""}
    <p style="font-size:13px;">Registered with <strong>${registrar || "your registrar"}</strong>? Log into your DNS settings and add a CNAME record pointing <code>${customDomain}</code> to <code>cname.vercel-dns.com</code>.</p>
  ` : "";

  const html = baseTemplate(`
    <h1>You're live! 🚀</h1>
    <p><strong>${businessName}</strong> is now published on the web. Your site is live at:</p>

    <div class="highlight">
      <p style="font-size:15px;font-weight:700;color:#4648d4;">${siteUrl.replace("https://", "")}</p>
    </div>

    <a href="${siteUrl}" class="btn">View my live site →</a>
    <a href="https://exsisto.ai/dashboard" class="btn-outline">Go to dashboard</a>

    ${dnsSection}

    <div class="divider"></div>
    <p style="font-size:13px;">Want to make changes? Head to your dashboard and use the website editor — we'll update your site within 24 hours.</p>
  `);

  return send(to, `${businessName} is now live!`, html);
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

// ─── WELCOME EMAIL (kept for backwards compat) ────────────────────────────────
export async function sendWelcomeEmail(to: string, businessName: string, plan: string) {
  return sendOrderConfirmationEmail(to, businessName, plan);
}

// ─── SITE READY EMAIL (kept for backwards compat) ─────────────────────────────
export async function sendSiteReadyEmail(to: string, businessName: string, previewUrl: string) {
  const html = baseTemplate(`
    <h1>Your website is ready to review 🌐</h1>
    <p>We've built a custom website for <strong>${businessName}</strong>. Log in to your dashboard to take a look.</p>
    <a href="${previewUrl}" class="btn">Review my website →</a>
  `);
  return send(to, `Your ${businessName} website is ready`, html);
}

// ─── ADMIN NEW ORDER NOTIFICATION ─────────────────────────────────────────────
export async function sendAdminNewOrderEmail(
  businessName: string,
  email: string,
  plan: string,
  industry: string,
  city: string,
  template: string,
  businessId: string
) {
  const adminEmail = process.env.ADMIN_EMAIL || "matt@amplifyforlawyers.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

  const html = baseTemplate(`
    <h1>New order: ${businessName} 📦</h1>

    <div class="highlight">
      <p><strong>Business:</strong> ${businessName}</p>
      <p style="margin-top:6px;"><strong>Customer:</strong> ${email}</p>
      <p style="margin-top:6px;"><strong>Plan:</strong> ${plan}</p>
      <p style="margin-top:6px;"><strong>Industry:</strong> ${industry}</p>
      <p style="margin-top:6px;"><strong>City:</strong> ${city}</p>
      <p style="margin-top:6px;"><strong>Template:</strong> ${template}</p>
    </div>

    <a href="${appUrl}/admin" class="btn">Go to admin dashboard →</a>

    <div class="divider"></div>
    <p style="font-size:12px;color:#9090a8;">Business ID: ${businessId}</p>
  `);

  return send(adminEmail, `New order: ${businessName} (${plan})`, html);
}

// ─── ADMIN BUILD STARTED NOTIFICATION ────────────────────────────────────────
export async function sendAdminBuildingEmail(businessName: string, plan: string, businessId: string) {
  const adminEmail = process.env.ADMIN_EMAIL || "matt@amplifyforlawyers.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
  const previewUrl = `${appUrl}/admin`;

  const imageCounts: Record<string, number> = { starter: 5, pro: 8, premium: 12 };
  const blogCounts: Record<string, number>  = { starter: 1, pro: 2, premium: 4 };
  const images = imageCounts[plan] || 5;
  const blogs  = blogCounts[plan]  || 1;

  const html = baseTemplate(`
    <h1>Building: ${businessName} 🏗️</h1>
    <p>The GitHub Actions workflow has been triggered. Your site is being built right now.</p>

    <div class="highlight">
      <p>✦ <strong>${images} Nano Banana images</strong> being generated</p>
      <p style="margin-top:6px;">✦ <strong>${blogs} blog post${blogs > 1 ? 's' : ''}</strong> being written</p>
      <p style="margin-top:6px;">✦ <strong>Full site copy</strong> being generated by Claude</p>
    </div>

    <p>This takes about 10–15 minutes. You'll get another email when it's ready for QA.</p>
    <a href="${previewUrl}" class="btn">Open Admin Dashboard →</a>
  `);

  return send(adminEmail, `Building: ${businessName} site`, html);
}

// ─── ADMIN QA READY NOTIFICATION ──────────────────────────────────────────────
export async function sendAdminQAReadyEmail(businessName: string, plan: string, previewUrl: string, businessId: string) {
  const adminEmail = process.env.ADMIN_EMAIL || "matt@amplifyforlawyers.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

  const html = baseTemplate(`
    <h1>Ready for QA: ${businessName} ✅</h1>
    <p>The site build is complete. Review everything below before approving.</p>

    <div class="highlight">
      <p>✦ Full site built and deployed to staging</p>
      <p style="margin-top:6px;">✦ Blog posts written and saved as drafts</p>
      <p style="margin-top:6px;">✦ Plan: <strong>${plan}</strong></p>
    </div>

    <a href="${previewUrl}" class="btn">Review Site in Admin →</a>

    <div class="divider"></div>
    <p style="font-size:13px;">From the admin dashboard you can preview the site, read each blog post, leave edit notes, and approve to push live — or request changes.</p>
    <p style="font-size:12px;color:#9090a8;margin-top:8px;">Business ID: ${businessId}</p>
  `);

  return send(adminEmail, `QA ready: ${businessName}`, html);
}

// ─── REGISTRAR-SPECIFIC DNS EMAIL ─────────────────────────────────────────────
const DNS_INSTRUCTIONS: Record<string, string> = {
  godaddy: `
    <p style="font-weight:700;margin-bottom:8px;">GoDaddy DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Go to <a href="https://dcc.godaddy.com" style="color:#4648d4;">dcc.godaddy.com</a> and sign in</li>
      <li>Click <strong>DNS</strong> next to your domain</li>
      <li>Find the existing <strong>A record</strong> for @ and delete it (or update it)</li>
      <li>Click <strong>Add New Record</strong></li>
      <li>Type: <strong>CNAME</strong> · Name: <strong>www</strong> · Value: <strong>cname.vercel-dns.com</strong></li>
      <li>For the root domain (@), add an <strong>A record</strong> pointing to <strong>76.76.21.21</strong></li>
      <li>Save changes — DNS propagates in 30 minutes to 48 hours</li>
    </ol>`,

  namecheap: `
    <p style="font-weight:700;margin-bottom:8px;">Namecheap DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Log in to <a href="https://namecheap.com" style="color:#4648d4;">namecheap.com</a></li>
      <li>Go to <strong>Domain List</strong> → click <strong>Manage</strong> next to your domain</li>
      <li>Click the <strong>Advanced DNS</strong> tab</li>
      <li>Add a <strong>CNAME Record</strong>: Host = <strong>www</strong>, Value = <strong>cname.vercel-dns.com</strong></li>
      <li>Add an <strong>A Record</strong>: Host = <strong>@</strong>, Value = <strong>76.76.21.21</strong></li>
      <li>Click the ✓ to save each record</li>
    </ol>`,

  squarespace: `
    <p style="font-weight:700;margin-bottom:8px;">Squarespace DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Log in to <a href="https://account.squarespace.com" style="color:#4648d4;">account.squarespace.com</a></li>
      <li>Click <strong>Domains</strong> in the left panel</li>
      <li>Click your domain name, then <strong>DNS Settings</strong></li>
      <li>Under Custom Records, add: Type <strong>CNAME</strong>, Host <strong>www</strong>, Value <strong>cname.vercel-dns.com</strong></li>
      <li>Add: Type <strong>A</strong>, Host <strong>@</strong>, Value <strong>76.76.21.21</strong></li>
      <li>Click Save — changes take up to 72 hours</li>
    </ol>`,

  cloudflare: `
    <p style="font-weight:700;margin-bottom:8px;">Cloudflare DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Log in to <a href="https://dash.cloudflare.com" style="color:#4648d4;">dash.cloudflare.com</a></li>
      <li>Click your domain, then <strong>DNS</strong> in the left sidebar</li>
      <li>Click <strong>Add Record</strong></li>
      <li>Type: <strong>CNAME</strong>, Name: <strong>www</strong>, Target: <strong>cname.vercel-dns.com</strong>, Proxy: <strong>OFF (grey cloud)</strong></li>
      <li>Add Type: <strong>A</strong>, Name: <strong>@</strong>, IPv4: <strong>76.76.21.21</strong>, Proxy: <strong>OFF</strong></li>
      <li>Save — DNS updates quickly on Cloudflare (usually under 5 minutes)</li>
    </ol>
    <p style="font-size:12px;color:#9090a8;margin-top:8px;">⚠️ Important: make sure the Cloudflare proxy is OFF (grey cloud icon) for both records — otherwise SSL won't work correctly.</p>`,

  wix: `
    <p style="font-weight:700;margin-bottom:8px;">Wix DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Log in to <a href="https://manage.wix.com" style="color:#4648d4;">manage.wix.com</a></li>
      <li>Go to <strong>Domains</strong> → click your domain → <strong>Advanced</strong> → <strong>Manage DNS Records</strong></li>
      <li>Click <strong>Add Record</strong> under CNAME</li>
      <li>Host: <strong>www</strong>, Points to: <strong>cname.vercel-dns.com</strong></li>
      <li>Under A Records, edit the <strong>@</strong> record to point to <strong>76.76.21.21</strong></li>
      <li>Save — allow up to 48 hours for propagation</li>
    </ol>`,

  google: `
    <p style="font-weight:700;margin-bottom:8px;">Google Domains / Squarespace DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Go to <a href="https://domains.squarespace.com" style="color:#4648d4;">domains.squarespace.com</a> (Google Domains migrated here)</li>
      <li>Select your domain → <strong>DNS</strong></li>
      <li>Add Custom Record: Type <strong>CNAME</strong>, Host <strong>www</strong>, Data <strong>cname.vercel-dns.com</strong></li>
      <li>Add Custom Record: Type <strong>A</strong>, Host <strong>@</strong>, Data <strong>76.76.21.21</strong></li>
      <li>Save changes — propagation takes 1–48 hours</li>
    </ol>`,

  bluehost: `
    <p style="font-weight:700;margin-bottom:8px;">Bluehost DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Log in to <a href="https://my.bluehost.com" style="color:#4648d4;">my.bluehost.com</a></li>
      <li>Go to <strong>Domains</strong> → click your domain → <strong>DNS</strong></li>
      <li>Scroll to <strong>CNAME Records</strong> → Add: Host <strong>www</strong>, Points to <strong>cname.vercel-dns.com</strong></li>
      <li>Scroll to <strong>A Records</strong> → Edit the <strong>@</strong> record to <strong>76.76.21.21</strong></li>
      <li>Save all changes</li>
    </ol>`,

  networksolutions: `
    <p style="font-weight:700;margin-bottom:8px;">Network Solutions DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Log in to <a href="https://networksolutions.com" style="color:#4648d4;">networksolutions.com</a></li>
      <li>Go to <strong>Account Manager</strong> → <strong>Manage Domain Names</strong></li>
      <li>Select your domain → <strong>Change Where Domain Points</strong> → <strong>Advanced DNS</strong></li>
      <li>Add CNAME: Alias <strong>www</strong>, Host <strong>cname.vercel-dns.com</strong></li>
      <li>Edit A Record for <strong>@</strong> to point to <strong>76.76.21.21</strong></li>
      <li>Save and allow up to 48 hours</li>
    </ol>`,

  ionos: `
    <p style="font-weight:700;margin-bottom:8px;">IONOS DNS Setup</p>
    <ol style="padding-left:20px;font-size:13px;line-height:1.8;">
      <li>Log in to <a href="https://my.ionos.com" style="color:#4648d4;">my.ionos.com</a></li>
      <li>Go to <strong>Domains & SSL</strong> → click the menu next to your domain → <strong>DNS</strong></li>
      <li>Click <strong>Add Record</strong> → CNAME: Host <strong>www</strong>, Points to <strong>cname.vercel-dns.com</strong></li>
      <li>Add A Record: Host <strong>@</strong>, Points to <strong>76.76.21.21</strong></li>
      <li>Save — DNS propagates within a few hours</li>
    </ol>`,

  other: `
    <p style="font-weight:700;margin-bottom:8px;">DNS Setup Instructions</p>
    <p style="font-size:13px;margin-bottom:12px;">Log into your domain registrar's DNS settings and add these two records:</p>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr style="background:#f5f2ff;">
        <td style="padding:8px;font-weight:700;">Type</td>
        <td style="padding:8px;font-weight:700;">Host/Name</td>
        <td style="padding:8px;font-weight:700;">Value/Points To</td>
      </tr>
      <tr>
        <td style="padding:8px;border-top:1px solid #ede9f8;">CNAME</td>
        <td style="padding:8px;border-top:1px solid #ede9f8;">www</td>
        <td style="padding:8px;border-top:1px solid #ede9f8;">cname.vercel-dns.com</td>
      </tr>
      <tr>
        <td style="padding:8px;border-top:1px solid #ede9f8;">A</td>
        <td style="padding:8px;border-top:1px solid #ede9f8;">@ (root)</td>
        <td style="padding:8px;border-top:1px solid #ede9f8;">76.76.21.21</td>
      </tr>
    </table>
    <p style="font-size:12px;color:#9090a8;margin-top:12px;">Not sure how? Reply to this email with your domain registrar name and we'll send you the exact steps.</p>`,
};

export function getDnsInstructions(registrarKey: string): string {
  return DNS_INSTRUCTIONS[registrarKey] || DNS_INSTRUCTIONS.other;
}

export async function sendRegistrarDnsEmail(
  to: string,
  businessName: string,
  customDomain: string,
  siteUrl: string,
  registrar: string,
  registrarKey: string
) {
  const instructions = getDnsInstructions(registrarKey);

  const html = baseTemplate(`
    <h1>Connect your domain 🌐</h1>
    <p>Your <strong>${businessName}</strong> website is live! One last step — connect your domain <strong>${customDomain}</strong> to your new site.</p>

    <div class="highlight">
      <p>Your site is already live at: <a href="${siteUrl}" style="color:#4648d4;">${siteUrl.replace('https://','')}</a></p>
      <p style="margin-top:6px;">Connecting <strong>${customDomain}</strong> takes about 5 minutes to set up and then up to 48 hours to fully propagate.</p>
    </div>

    <div class="divider"></div>

    <div style="background:#f9f8ff;border-radius:10px;padding:20px 24px;margin:16px 0;">
      ${instructions}
    </div>

    <div class="divider"></div>

    <p style="font-size:13px;"><strong>Once DNS propagates</strong>, your site will be live at <strong>${customDomain}</strong> and we'll redirect <strong>www.${customDomain}</strong> automatically.</p>
    <p style="font-size:13px;margin-top:10px;">Questions? Reply to this email or contact <a href="mailto:support@exsisto.ai" style="color:#4648d4;">support@exsisto.ai</a> — we're happy to help.</p>

    <a href="${siteUrl}" class="btn" style="margin-top:16px;">View my site →</a>
  `);

  return send(to, `Connect ${customDomain} to your new site`, html);
}

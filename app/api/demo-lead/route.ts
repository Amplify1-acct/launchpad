import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { biz, city, bizType, email, style } = await request.json();
  if (!email || !biz) return NextResponse.json({ ok: false });

  // Save lead to Supabase
  await supabase.from("demo_leads").insert({
    biz_name: biz,
    city,
    biz_type: bizType,
    email,
    style,
    source: "mobile_demo",
    created_at: new Date().toISOString(),
  }).then(() => {}).catch(() => {});

  // Send "your demo is being built" email via Resend
  const demoUrl = `https://www.exsisto.ai/api/preview-demo?style=${encodeURIComponent(style)}&biz=${encodeURIComponent(biz)}&type=${encodeURIComponent(bizType)}&city=${encodeURIComponent(city)}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4648d4 0%,#6366f1 100%);padding:40px 40px 32px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Ex<span style="color:#a5b4fc;">sisto</span></div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:0.05em;text-transform:uppercase;">Your demo site is ready</div>
    </div>
    <div style="padding:40px;">
      <h1 style="font-size:24px;font-weight:800;color:#0d0d14;margin:0 0 12px;">Here is your ${biz} demo ✨</h1>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 28px;">
        We built a demo website for <strong>${biz}</strong> in ${city} — complete with AI-written copy, professional images, and a design matched to your business type.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${demoUrl}" style="display:inline-block;background:#4648d4;color:#fff;font-size:16px;font-weight:700;padding:16px 36px;border-radius:12px;text-decoration:none;box-shadow:0 4px 16px rgba(70,72,212,0.3);">View Your Demo Site &rarr;</a>
        <div style="font-size:12px;color:#9090a8;margin-top:10px;">Best viewed on desktop</div>
      </div>
      <div style="background:#0d0d14;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px;">Ready to go live?</div>
        <div style="font-size:13px;color:#9090a8;margin-bottom:16px;line-height:1.6;">Get your real site with a custom domain, weekly blog posts, local SEO, and everything managed for you. Starting at $99/mo.</div>
        <a href="https://www.exsisto.ai/order" style="display:inline-block;background:#fff;color:#4648d4;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Get My Site Live &rarr;</a>
      </div>
      <p style="font-size:12px;color:#9090a8;text-align:center;margin:0;">Questions? <a href="mailto:support@exsisto.ai" style="color:#4648d4;">support@exsisto.ai</a></p>
    </div>
    <div style="background:#f8f9ff;padding:20px 40px;text-align:center;border-top:1px solid #e2e4f7;">
      <div style="font-size:12px;color:#9090a8;">&copy; 2026 Exsisto &middot; HS Advertising, LLC</div>
    </div>
  </div>
</body>
</html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Exsisto <hello@exsisto.ai>",
        to: [email],
        subject: `Your ${biz} demo site is ready ✨`,
        html,
      }),
    });
  } catch (err) {
    console.error("Lead email failed:", err);
  }

  return NextResponse.json({ ok: true });
}

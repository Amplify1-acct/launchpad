import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "Exsisto <hello@exsisto.ai>";

async function sendEmail(to: string, subject: string, html: string) {
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
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message, business_id, business: businessName } = body;

    if (!business_id && !businessName) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Look up the business owner's email via business_id or subdomain
    let ownerEmail: string | null = null;
    let bizName: string = businessName || "Your Business";
    let bizPhone: string | null = null;

    if (business_id) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("name, phone, customer_id")
        .eq("id", business_id)
        .single();

      if (biz) {
        bizName = biz.name;
        bizPhone = biz.phone;
        const { data: customer } = await supabase
          .from("customers")
          .select("email")
          .eq("id", biz.customer_id)
          .single();
        ownerEmail = customer?.email || null;
      }
    }

    if (!ownerEmail) {
      console.error("No owner email found for contact form submission", { business_id, businessName });
      // Still return success to the visitor — don't expose internal errors
      return NextResponse.json({ success: true });
    }

    // ── Email to business owner ───────────────────────────────────────────
    const ownerHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; background: #fcf8ff; color: #1b1b25; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 20px; }
  .card { background: #fff; border-radius: 16px; border: 1px solid #ede9f8; overflow: hidden; }
  .header { padding: 20px 28px 18px; border-bottom: 1px solid #ede9f8; display: flex; align-items: center; justify-content: space-between; }
  .logo { font-size: 18px; font-weight: 800; color: #1b1b25; letter-spacing: -0.5px; }
  .logo span { color: #4648d4; }
  .badge { background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px; }
  .body { padding: 28px; }
  h1 { font-size: 20px; font-weight: 800; color: #1b1b25; margin-bottom: 6px; letter-spacing: -0.3px; }
  .sub { font-size: 14px; color: #6b6b8a; margin-bottom: 24px; }
  .field { margin-bottom: 16px; }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9090a8; margin-bottom: 4px; }
  .value { font-size: 15px; font-weight: 600; color: #1b1b25; }
  .message-box { background: #f5f2ff; border-radius: 10px; padding: 16px 18px; margin-top: 4px; }
  .message-box p { font-size: 14px; color: #3b3b55; line-height: 1.7; margin: 0; white-space: pre-wrap; }
  .actions { margin-top: 24px; display: flex; gap: 10px; }
  .btn { display: inline-block; padding: 12px 22px; background: #4648d4; color: #fff !important; font-size: 13px; font-weight: 700; border-radius: 8px; text-decoration: none; }
  .btn-outline { display: inline-block; padding: 11px 22px; border: 1.5px solid #4648d4; color: #4648d4 !important; font-size: 13px; font-weight: 600; border-radius: 8px; text-decoration: none; }
  .footer { padding: 16px 28px; border-top: 1px solid #ede9f8; font-size: 12px; color: #9090a8; }
  .footer a { color: #4648d4; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="logo">Ex<span>sisto</span></div>
      <div class="badge">New Lead</div>
    </div>
    <div class="body">
      <h1>New message for ${bizName}</h1>
      <p class="sub">Someone filled out your contact form. Reply fast — leads go cold quickly.</p>

      <div class="field">
        <div class="label">Name</div>
        <div class="value">${name || "—"}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${email}" style="color:#4648d4;">${email || "—"}</a></div>
      </div>
      ${phone ? `<div class="field">
        <div class="label">Phone</div>
        <div class="value"><a href="tel:${phone}" style="color:#4648d4;">${phone}</a></div>
      </div>` : ""}
      <div class="field">
        <div class="label">Message</div>
        <div class="message-box"><p>${message || "No message provided."}</p></div>
      </div>

      <div class="actions">
        <a href="mailto:${email}?subject=Re: Your inquiry" class="btn">Reply to ${name || "them"} →</a>
        ${phone ? `<a href="tel:${phone}" class="btn-outline">Call now</a>` : ""}
      </div>
    </div>
    <div class="footer">
      Sent via your <a href="https://exsisto.ai/dashboard">Exsisto dashboard</a> · <a href="https://exsisto.ai">exsisto.ai</a>
    </div>
  </div>
</div>
</body>
</html>`;

    await sendEmail(
      ownerEmail,
      `New lead: ${name || "Someone"} contacted ${bizName}`,
      ownerHtml
    );

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Contact form error:", err);
    // Return success anyway — don't break the visitor's experience
    return NextResponse.json({ success: true });
  }
}

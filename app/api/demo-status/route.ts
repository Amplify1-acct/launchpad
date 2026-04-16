import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

// GET /api/demo-status?slug=xxx  — browser polls this
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const { data, error } = await supabase
    .from("demo_builds")
    .select("slug, status, images, created_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: data.slug,
    status: data.status,
    images: data.images || {},
  });
}

// POST /api/demo-status  — webhook called by GitHub Actions when images are ready
export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== "exsisto-internal-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, status, images, category_slug, category_label } = body;
  if (!slug || !status) {
    return NextResponse.json({ error: "Missing slug or status" }, { status: 400 });
  }

  const updateData: any = { status, images, updated_at: new Date().toISOString() };
  if (category_slug) updateData.category_slug = category_slug;
  if (category_label) updateData.category_label = category_label;

  const { error } = await supabase
    .from("demo_builds")
    .update(updateData)
    .eq("slug", slug);

  if (error) {
    console.error("demo-status update error:", error);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  // If status is ready, send notification email
  if (status === "ready") {
    const { data: build } = await supabase
      .from("demo_builds")
      .select("email, biz_name, city, state, style")
      .eq("slug", slug)
      .single();

    if (build?.email) {
      await sendReadyEmail(build.email, build.biz_name, build.city, build.state, slug);
    }
  }

  return NextResponse.json({ ok: true, slug, status });
}

async function sendReadyEmail(
  to: string,
  bizName: string,
  city: string,
  state: string,
  slug: string
) {
  const demoUrl = `https://www.exsisto.ai/api/preview-demo-custom?slug=${slug}`;
  const orderUrl = `https://www.exsisto.ai/order`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4648d4 0%,#6366f1 100%);padding:40px 40px 32px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Ex<span style="color:#a5b4fc;">sisto</span></div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:0.05em;text-transform:uppercase;">Your demo is ready</div>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h1 style="font-size:24px;font-weight:800;color:#0d0d14;margin:0 0 12px;line-height:1.2;">
        Your ${bizName} website is built ✨
      </h1>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
        We built a full website for <strong>${bizName}</strong> in ${city}, ${state} — complete with AI-written copy, custom images, and a design matched to your business.
      </p>

      <!-- What we built -->
      <div style="background:#f8f9ff;border:1px solid #e2e4f7;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <div style="font-size:12px;font-weight:700;color:#6b6b80;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;">What we built for you</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#0d0d14;">
            <span style="color:#4648d4;font-size:16px;">&#10003;</span> AI-written homepage copy specific to your business
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#0d0d14;">
            <span style="color:#4648d4;font-size:16px;">&#10003;</span> Custom AI-generated images for your industry
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#0d0d14;">
            <span style="color:#4648d4;font-size:16px;">&#10003;</span> Service pages, about section, and blog posts
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#0d0d14;">
            <span style="color:#4648d4;font-size:16px;">&#10003;</span> SEO-optimized content and schema markup
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${demoUrl}" style="display:inline-block;background:#4648d4;color:#fff;font-size:16px;font-weight:700;padding:16px 36px;border-radius:12px;text-decoration:none;box-shadow:0 4px 16px rgba(70,72,212,0.3);">
          View Your Demo Site &rarr;
        </a>
        <div style="font-size:12px;color:#9090a8;margin-top:10px;">Link is valid for 7 days</div>
      </div>

      <!-- Sign up pitch -->
      <div style="background:#0d0d14;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px;">Ready to go live?</div>
        <div style="font-size:13px;color:#9090a8;margin-bottom:16px;line-height:1.6;">
          Your real site includes a custom domain, weekly blog posts, local SEO, and everything managed for you. Starting at $99/mo.
        </div>
        <a href="${orderUrl}" style="display:inline-block;background:#fff;color:#4648d4;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
          Get My Site Live &rarr;
        </a>
      </div>

      <p style="font-size:12px;color:#9090a8;text-align:center;margin:0;">
        Questions? Reply to this email or contact <a href="mailto:support@exsisto.ai" style="color:#4648d4;">support@exsisto.ai</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9ff;padding:20px 40px;text-align:center;border-top:1px solid #e2e4f7;">
      <div style="font-size:12px;color:#9090a8;">
        &copy; 2026 Exsisto &middot; HS Advertising, LLC &middot; <a href="https://www.exsisto.ai/privacy" style="color:#9090a8;">Privacy</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Exsisto <hello@exsisto.ai>",
        to: [to],
        subject: `Your ${bizName} demo site is ready ✨`,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
    } else {
      console.log("Demo ready email sent to", to);
    }
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

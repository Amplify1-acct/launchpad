import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // optional

function vercelHeaders() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function vercelUrl(path: string) {
  const base = `https://api.vercel.com${path}`;
  return VERCEL_TEAM_ID ? `${base}?teamId=${VERCEL_TEAM_ID}` : base;
}

// Clean domain input: strip https://, www., trailing slashes
function cleanDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const { domain: rawDomain, business_id } = await request.json();

    if (!rawDomain || !business_id) {
      return NextResponse.json({ error: "domain and business_id required" }, { status: 400 });
    }

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ error: "Vercel not configured" }, { status: 500 });
    }

    const domain = cleanDomain(rawDomain);

    // Basic domain validation
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    // Add domain to Vercel project
    const vercelRes = await fetch(vercelUrl(`/v10/projects/${VERCEL_PROJECT_ID}/domains`), {
      method: "POST",
      headers: vercelHeaders(),
      body: JSON.stringify({ name: domain }),
    });

    const vercelData = await vercelRes.json();

    // 409 = already added to this project (fine), other errors are real
    if (!vercelRes.ok && vercelRes.status !== 409) {
      console.error("Vercel domain error:", vercelData);
      return NextResponse.json({
        error: vercelData.error?.message || "Failed to add domain to Vercel",
      }, { status: 400 });
    }

    // Save to Supabase
    await supabase
      .from("businesses")
      .update({
        custom_domain: domain,
        domain_status: "pending",
        website_url: `https://${domain}`,
      })
      .eq("id", business_id);

    // Get the DNS verification details from Vercel
    const checkRes = await fetch(
      vercelUrl(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`),
      { headers: vercelHeaders() }
    );
    const checkData = await checkRes.json();

    return NextResponse.json({
      success: true,
      domain,
      verification: checkData.verification || [],
      cname: {
        type: "CNAME",
        name: domain.includes(".") ? "@" : domain,
        value: "cname.vercel-dns.com",
      },
    });

  } catch (err: any) {
    console.error("custom-domain error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: check verification status for a domain
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const business_id = searchParams.get("business_id");

  if (!domain || !business_id) {
    return NextResponse.json({ error: "domain and business_id required" }, { status: 400 });
  }

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({ error: "Vercel not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      vercelUrl(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`),
      { headers: vercelHeaders() }
    );
    const data = await res.json();

    const verified = data.verified === true;

    // Update status in Supabase if verified
    if (verified) {
      const supabase = createAdminClient();
      await supabase
        .from("businesses")
        .update({ domain_status: "active" })
        .eq("id", business_id);
    }

    return NextResponse.json({
      verified,
      status: verified ? "active" : "pending",
      domain,
      verification: data.verification || [],
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: remove custom domain
export async function DELETE(request: Request) {
  try {
    const { domain, business_id } = await request.json();
    if (!domain || !business_id) {
      return NextResponse.json({ error: "domain and business_id required" }, { status: 400 });
    }

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ error: "Vercel not configured" }, { status: 500 });
    }

    // Remove from Vercel
    await fetch(vercelUrl(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`), {
      method: "DELETE",
      headers: vercelHeaders(),
    });

    // Reset in Supabase — revert to subdomain URL
    const supabase = createAdminClient();
    const { data: biz } = await supabase
      .from("businesses")
      .select("subdomain")
      .eq("id", business_id)
      .single();

    await supabase
      .from("businesses")
      .update({
        custom_domain: null,
        domain_status: "none",
        website_url: biz?.subdomain ? `https://${biz.subdomain}.exsisto.ai` : null,
      })
      .eq("id", business_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

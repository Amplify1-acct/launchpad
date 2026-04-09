import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import {
  sendWelcomeEmail,
  sendSiteReadyEmail,
  sendSiteLiveEmail,
  sendBlogReadyEmail,
  sendOrderConfirmationEmail,
  sendAccountSetupEmail,
  sendAdminNewOrderEmail,
} from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, business_id, to, data } = body;

  if (!type) {
    return NextResponse.json({ error: "type required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (type) {

      case "order_confirmation": {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, customer_id")
          .eq("id", business_id)
          .single();
        const { data: cust } = await supabase
          .from("customers")
          .select("email, plan")
          .eq("id", biz?.customer_id)
          .single();
        if (cust?.email && biz?.name) {
          await sendOrderConfirmationEmail(cust.email, biz.name, cust.plan || "starter");
        }
        break;
      }

      case "account_setup": {
        // Generate a magic link for the customer
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, customer_id")
          .eq("id", business_id)
          .single();
        const { data: cust } = await supabase
          .from("customers")
          .select("email, user_id")
          .eq("id", biz?.customer_id)
          .single();

        if (cust?.email && biz?.name && cust?.user_id) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
          const { data: linkData } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: cust.email,
            options: {
              redirectTo: `${appUrl}/dashboard`,
            },
          });

          const magicLink = linkData?.properties?.action_link ||
                            `${appUrl}/login?email=${encodeURIComponent(cust.email)}`;

          await sendAccountSetupEmail(cust.email, biz.name, magicLink);
        }
        break;
      }

      case "admin_new_order": {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, industry, city, customer_id")
          .eq("id", business_id)
          .single();
        const { data: cust } = await supabase
          .from("customers")
          .select("email, plan")
          .eq("id", biz?.customer_id)
          .single();
        const { data: website } = await supabase
          .from("websites")
          .select("template_id")
          .eq("business_id", business_id)
          .single();

        if (biz && cust) {
          await sendAdminNewOrderEmail(
            biz.name,
            cust.email,
            cust.plan || "starter",
            biz.industry || "other",
            biz.city || "",
            website?.template_id || "skeleton-clean",
            business_id,
          );
        }
        break;
      }

      case "welcome": {
        await sendWelcomeEmail(to, data.businessName, data.plan);
        break;
      }

      case "site_ready": {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, customer_id")
          .eq("id", business_id)
          .single();
        const { data: cust } = await supabase
          .from("customers")
          .select("email")
          .eq("id", biz?.customer_id)
          .single();
        if (cust?.email && biz?.name) {
          await sendSiteReadyEmail(cust.email, biz.name, "https://exsisto.ai/dashboard/preview");
        }
        break;
      }

      case "site_live": {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, subdomain, website_url, customer_id, custom_domain")
          .eq("id", business_id)
          .single();
        const { data: cust } = await supabase
          .from("customers")
          .select("email")
          .eq("id", biz?.customer_id)
          .single();

        if (cust?.email && biz?.name) {
          const siteUrl = biz.website_url || `https://${biz.subdomain}.exsisto.ai`;

          // If customer has a custom domain, look up registrar
          let registrar: string | undefined;
          let dnsInstructions: string | undefined;

          if (biz.custom_domain) {
            try {
              const whoisRes = await fetch(
                `https://www.exsisto.ai/api/whois?domain=${encodeURIComponent(biz.custom_domain)}`
              );
              const whoisData = await whoisRes.json();
              registrar = whoisData.registrar;
              dnsInstructions = buildDnsInstructions(biz.custom_domain, registrar, siteUrl);
            } catch {
              // WHOIS failed — use generic instructions
              dnsInstructions = buildDnsInstructions(biz.custom_domain, undefined, siteUrl);
            }
          }

          await sendSiteLiveEmail(
            cust.email,
            biz.name,
            siteUrl,
            biz.custom_domain || undefined,
            registrar,
            dnsInstructions,
          );
        }
        break;
      }

      case "blog_ready": {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, customer_id")
          .eq("id", business_id)
          .single();
        const { data: cust } = await supabase
          .from("customers")
          .select("email")
          .eq("id", biz?.customer_id)
          .single();
        const { data: posts } = await supabase
          .from("blog_posts")
          .select("title")
          .eq("business_id", business_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(10);
        if (cust?.email && biz?.name && posts?.length) {
          await sendBlogReadyEmail(cust.email, biz.name, posts.length, posts.map((p: any) => p.title));
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, type });
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DNS INSTRUCTIONS BUILDER ─────────────────────────────────────────────────
function buildDnsInstructions(domain: string, registrar: string | undefined, siteUrl: string): string {
  const r = (registrar || "").toLowerCase();

  const cname = `CNAME  ${domain}  →  cname.vercel-dns.com`;

  if (r.includes("godaddy")) {
    return `GoDaddy instructions:
1. Log in at godaddy.com → My Products → DNS
2. Find your domain "${domain}" and click "Manage DNS"
3. Click "Add" → Type: CNAME
4. Name: @ (or www)  →  Value: cname.vercel-dns.com
5. Click Save. DNS updates in 10-30 minutes.`;
  }
  if (r.includes("namecheap")) {
    return `Namecheap instructions:
1. Log in at namecheap.com → Domain List → Manage
2. Go to "Advanced DNS" tab
3. Add a new CNAME Record:
   Host: @   Value: cname.vercel-dns.com   TTL: Auto
4. Click the checkmark to save. DNS updates in 10-30 minutes.`;
  }
  if (r.includes("squarespace") || r.includes("google")) {
    return `Google Domains / Squarespace instructions:
1. Go to domains.squarespace.com → select your domain
2. Click "DNS" → "Custom Records"
3. Add: Type CNAME  Host: @  Data: cname.vercel-dns.com
4. Save. DNS updates in 10-30 minutes.`;
  }
  if (r.includes("cloudflare")) {
    return `Cloudflare instructions:
1. Log in at cloudflare.com → select your domain
2. Go to DNS → Records
3. Add record: Type CNAME  Name: @  Target: cname.vercel-dns.com  Proxy: DNS only (grey cloud)
4. Save. DNS updates in a few minutes.`;
  }

  // Generic fallback
  return `To connect ${domain} to your new site:
1. Log in to your domain registrar (where you bought "${domain}")
2. Find "DNS Settings" or "DNS Management"
3. Add a CNAME record:
   ${cname}
4. Save and wait 10-30 minutes for DNS to propagate.

Need help? Reply to this email and we'll walk you through it.`;
}

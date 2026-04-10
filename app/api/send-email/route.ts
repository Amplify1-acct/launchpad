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
  sendAdminBuildingEmail,
  sendAdminQAReadyEmail,
  sendRegistrarDnsEmail,
} from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, business_id, to, data } = body;

  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const supabase = createAdminClient();

  try {
    switch (type) {

      case "order_confirmation": {
        const { data: biz } = await supabase.from("businesses").select("name, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email, plan").eq("id", biz?.customer_id).single();
        if (cust?.email && biz?.name) await sendOrderConfirmationEmail(cust.email, biz.name, cust.plan || "starter");
        break;
      }

      case "admin_building": {
        const { data: biz } = await supabase.from("businesses").select("name, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("plan").eq("id", biz?.customer_id).single();
        if (biz?.name) await sendAdminBuildingEmail(biz.name, cust?.plan || "starter", business_id);
        break;
      }

      case "admin_qa_ready": {
        const { data: biz } = await supabase.from("businesses").select("name, subdomain, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("plan").eq("id", biz?.customer_id).single();
        const previewUrl = `${APP_URL}/admin`;
        if (biz?.name) await sendAdminQAReadyEmail(biz.name, cust?.plan || "starter", previewUrl, business_id);
        break;
      }

      case "account_setup": {
        const { data: biz } = await supabase.from("businesses").select("name, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email, user_id").eq("id", biz?.customer_id).single();
        if (cust?.email && biz?.name && cust?.user_id) {
          const { data: linkData } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: cust.email,
            options: { redirectTo: `${APP_URL}/dashboard` },
          });
          const magicLink = linkData?.properties?.action_link || `${APP_URL}/login?email=${encodeURIComponent(cust.email)}`;
          await sendAccountSetupEmail(cust.email, biz.name, magicLink);
        }
        break;
      }

      case "admin_new_order": {
        const { data: biz } = await supabase.from("businesses").select("name, industry, city, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email, plan").eq("id", biz?.customer_id).single();
        const { data: website } = await supabase.from("websites").select("template_id").eq("business_id", business_id).single();
        if (biz && cust) {
          await sendAdminNewOrderEmail(biz.name, cust.email, cust.plan || "starter", biz.industry || "other", biz.city || "", website?.template_id || "skeleton-clean", business_id);
        }
        break;
      }

      case "site_live": {
        const { data: biz } = await supabase.from("businesses").select("name, subdomain, website_url, customer_id, custom_domain").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email").eq("id", biz?.customer_id).single();
        if (!cust?.email || !biz?.name) break;

        const siteUrl = biz.website_url || `https://${biz.subdomain}.exsisto.ai`;
        const customDomain = biz.custom_domain;

        if (customDomain) {
          // Look up registrar and send DNS-specific email
          let registrarKey = "other";
          let registrarName = "your registrar";
          try {
            const whoisRes = await fetch(`${APP_URL}/api/whois?domain=${encodeURIComponent(customDomain)}`);
            const whoisData = await whoisRes.json() as { registrarKey?: string; registrar?: string };
            registrarKey  = whoisData.registrarKey  || "other";
            registrarName = whoisData.registrar      || "your registrar";
          } catch {}
          await sendRegistrarDnsEmail(cust.email, biz.name, customDomain, siteUrl, registrarName, registrarKey);
        } else {
          await sendSiteLiveEmail(cust.email, biz.name, siteUrl);
        }
        break;
      }

      case "blog_ready": {
        const { data: biz } = await supabase.from("businesses").select("name, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email").eq("id", biz?.customer_id).single();
        const { data: posts } = await supabase.from("blog_posts").select("title").eq("business_id", business_id).eq("post_status", "draft").order("created_at", { ascending: false }).limit(8);
        const titles = (posts || []).map((p: any) => p.title);
        if (cust?.email && biz?.name && titles.length > 0) {
          await sendBlogReadyEmail(cust.email, biz.name, titles.length, titles);
        }
        break;
      }

      case "welcome":
        await sendWelcomeEmail(to, data.businessName, data.plan);
        break;

      case "site_ready": {
        const { data: biz } = await supabase.from("businesses").select("name, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email").eq("id", biz?.customer_id).single();
        if (cust?.email && biz?.name) {
          await sendSiteReadyEmail(cust.email, biz.name, `${APP_URL}/dashboard/preview`);
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

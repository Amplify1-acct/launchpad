import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import {
  sendWelcomeEmail,
  sendSiteReadyEmail,
  sendSiteLiveEmail,
  sendBlogReadyEmail,
} from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, business_id, to, data } = body;

  if (!type) {
    return NextResponse.json({ error: "type required" }, { status: 400 });
  }

  try {
    switch (type) {
      case "welcome": {
        await sendWelcomeEmail(to, data.businessName, data.plan);
        break;
      }

      case "site_ready": {
        const supabase = createAdminClient();
        const { data: biz } = await supabase.from("businesses").select("name, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email").eq("id", biz?.customer_id).single();
        if (cust?.email && biz?.name) {
          await sendSiteReadyEmail(cust.email, biz.name, "https://exsisto.ai/dashboard/preview");
        }
        break;
      }

      case "site_live": {
        const supabase = createAdminClient();
        const { data: biz } = await supabase.from("businesses").select("name, subdomain, website_url, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email").eq("id", biz?.customer_id).single();
        if (cust?.email && biz?.name) {
          const siteUrl = biz.website_url || `https://${biz.subdomain}.exsisto.ai`;
          await sendSiteLiveEmail(cust.email, biz.name, siteUrl);
        }
        break;
      }

      case "blog_ready": {
        const supabase = createAdminClient();
        const { data: biz } = await supabase.from("businesses").select("name, customer_id").eq("id", business_id).single();
        const { data: cust } = await supabase.from("customers").select("email").eq("id", biz?.customer_id).single();
        const { data: posts } = await supabase.from("blog_posts").select("title").eq("business_id", business_id).eq("status", "pending").order("created_at", { ascending: false }).limit(10);
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

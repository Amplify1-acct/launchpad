import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const GBP_CLIENT_ID = process.env.GOOGLE_GBP_CLIENT_ID!;
const GBP_CLIENT_SECRET = process.env.GOOGLE_GBP_CLIENT_SECRET!;

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GBP_CLIENT_ID,
      client_secret: GBP_CLIENT_SECRET,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function POST(request: Request) {
  try {
    const { business_id, blog_post_id } = await request.json();
    if (!business_id || !blog_post_id) {
      return NextResponse.json({ error: "business_id and blog_post_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get business with GBP tokens
    const { data: biz } = await supabase
      .from("businesses")
      .select("gbp_refresh_token, gbp_location_id, name, plan")
      .eq("id", business_id)
      .single();

    if (!biz?.gbp_refresh_token || !biz?.gbp_location_id) {
      return NextResponse.json({ error: "GBP not connected" }, { status: 400 });
    }

    if (biz.plan !== "premium") {
      return NextResponse.json({ error: "GBP posting requires Premium plan" }, { status: 403 });
    }

    // Get blog post
    const { data: post } = await supabase
      .from("blog_posts")
      .select("title, excerpt, slug, featured_image_url")
      .eq("id", blog_post_id)
      .single();

    if (!post) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });

    // Get fresh access token
    const accessToken = await getAccessToken(biz.gbp_refresh_token);
    if (!accessToken) return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });

    // Get site domain for the post URL
    const { data: website } = await supabase
      .from("websites")
      .select("vercel_url")
      .eq("business_id", business_id)
      .single();

    const domain = website?.vercel_url || `${business_id}.exsisto.ai`;
    const postUrl = `https://${domain}/blog/${post.slug}`;

    // Post to GBP as a "What\'s New" update
    const gbpPost: any = {
      localPostType: "STANDARD",
      summary: `${post.title}\n\n${post.excerpt || ""}`.slice(0, 1500),
      callToAction: {
        actionType: "LEARN_MORE",
        url: postUrl,
      },
      topicType: "STANDARD",
    };

    // Add photo if available
    if (post.featured_image_url) {
      gbpPost.media = [{
        mediaFormat: "PHOTO",
        sourceUrl: post.featured_image_url,
      }];
    }

    const postRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${biz.gbp_location_id}/localPosts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gbpPost),
      }
    );

    const postData = await postRes.json();

    if (!postRes.ok) {
      console.error("GBP post failed:", postData);
      return NextResponse.json({ error: "GBP post failed", details: postData }, { status: 500 });
    }

    return NextResponse.json({ success: true, gbpPostName: postData.name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { postToFacebook, postToInstagram, postToGoogleBusiness, postToTikTok } from "@/lib/socialPosting";

const CRON_SECRET = process.env.CRON_SECRET || "exsisto-cron-2026";
export const maxDuration = 120;

export async function POST(request: Request) {
  // Verify cron secret
  const secret = request.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Find all posts due to be published
  const { data: duePosts, error } = await supabase
    .from("social_posts")
    .select(`
      id, business_id, platform, caption, image_url, status,
      social_connections!connection_id (
        id, access_token, refresh_token, platform_page_id, platform_user_id
      )
    `)
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .limit(50);

  if (error) {
    console.error("Cron error fetching posts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!duePosts?.length) {
    return NextResponse.json({ published: 0, message: "No posts due" });
  }

  let published = 0;
  let failed = 0;

  for (const post of duePosts) {
    const connection = (post.social_connections as any)?.[0];
    if (!connection) {
      await supabase.from("social_posts").update({
        status: "failed",
        error_message: "No social connection found",
        updated_at: now,
      }).eq("id", post.id);
      failed++;
      continue;
    }

    let result: { success: boolean; post_id?: string; error?: string };

    switch (post.platform) {
      case "facebook":
        result = await postToFacebook(connection, post);
        break;
      case "instagram":
        result = await postToInstagram(connection, post);
        break;
      case "google_business":
        result = await postToGoogleBusiness(connection, post);
        break;
      case "tiktok":
        result = await postToTikTok(connection, post);
        break;
      default:
        result = { success: false, error: `Unknown platform: ${post.platform}` };
    }

    if (result.success) {
      await supabase.from("social_posts").update({
        status: "posted",
        posted_at: now,
        platform_post_id: result.post_id,
        updated_at: now,
      }).eq("id", post.id);
      published++;
      console.log(`✓ Posted to ${post.platform}: ${post.id}`);
    } else {
      await supabase.from("social_posts").update({
        status: "failed",
        error_message: result.error,
        updated_at: now,
      }).eq("id", post.id);
      failed++;
      console.error(`✗ Failed ${post.platform}: ${result.error}`);
    }
  }

  return NextResponse.json({ published, failed, total: duePosts.length });
}

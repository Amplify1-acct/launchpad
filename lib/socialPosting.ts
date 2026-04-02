/**
 * lib/socialPosting.ts
 * Handles posting to Facebook, Instagram, Google Business, and TikTok
 * Called by the cron job or manual post trigger
 */

interface SocialConnection {
  id: string;
  platform: string;
  access_token: string;
  refresh_token?: string;
  platform_page_id?: string;
  platform_user_id?: string;
}

interface SocialPost {
  id: string;
  platform: string;
  caption: string;
  image_url?: string;
}

// ── Facebook ──────────────────────────────────────────────────────────────────
export async function postToFacebook(
  connection: SocialConnection,
  post: SocialPost
): Promise<{ success: boolean; post_id?: string; error?: string }> {
  const pageId = connection.platform_page_id;
  const token = connection.access_token;

  if (!pageId) return { success: false, error: "No Facebook Page ID" };

  try {
    let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const body: Record<string, string> = {
      message: post.caption,
      access_token: token,
    };

    // If there's an image, post as photo
    if (post.image_url) {
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      body.url = post.image_url;
      body.caption = post.caption;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.error) return { success: false, error: data.error.message };
    return { success: true, post_id: data.id || data.post_id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Instagram ─────────────────────────────────────────────────────────────────
export async function postToInstagram(
  connection: SocialConnection,
  post: SocialPost
): Promise<{ success: boolean; post_id?: string; error?: string }> {
  const igUserId = connection.platform_page_id;
  const token = connection.access_token;

  if (!igUserId) return { success: false, error: "No Instagram User ID" };
  if (!post.image_url) return { success: false, error: "Instagram requires an image" };

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: post.image_url,
          caption: post.caption,
          access_token: token,
        }),
      }
    );
    const container = await containerRes.json();
    if (container.error) return { success: false, error: container.error.message };

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: token,
        }),
      }
    );
    const published = await publishRes.json();
    if (published.error) return { success: false, error: published.error.message };

    return { success: true, post_id: published.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Google Business Profile ───────────────────────────────────────────────────
export async function postToGoogleBusiness(
  connection: SocialConnection,
  post: SocialPost
): Promise<{ success: boolean; post_id?: string; error?: string }> {
  const accountName = connection.platform_page_id; // e.g. "accounts/123456789"
  const token = connection.access_token;

  if (!accountName) return { success: false, error: "No Google Business account" };

  try {
    // Get locations under this account
    const locRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${accountName}/locations`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const locData = await locRes.json();
    const location = locData.locations?.[0];

    if (!location) return { success: false, error: "No Google Business location found" };

    // Create a local post
    const postRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${location.name}/localPosts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languageCode: "en-US",
          summary: post.caption,
          topicType: "STANDARD",
          ...(post.image_url ? {
            media: [{ mediaFormat: "PHOTO", sourceUrl: post.image_url }]
          } : {}),
        }),
      }
    );
    const postData = await postRes.json();
    if (postData.error) return { success: false, error: postData.error.message };

    return { success: true, post_id: postData.name };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── TikTok ────────────────────────────────────────────────────────────────────
export async function postToTikTok(
  connection: SocialConnection,
  post: SocialPost
): Promise<{ success: boolean; post_id?: string; error?: string }> {
  // TikTok requires video content — for image posts we skip
  // TikTok photo posting via Content Posting API
  const token = connection.access_token;

  if (!post.image_url) return { success: false, error: "TikTok post requires media" };

  try {
    // Initialize photo post
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: post.caption.slice(0, 150),
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: [post.image_url],
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      }),
    });
    const initData = await initRes.json();
    if (initData.error?.code !== "ok") {
      return { success: false, error: initData.error?.message || "TikTok post failed" };
    }

    return { success: true, post_id: initData.data?.publish_id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

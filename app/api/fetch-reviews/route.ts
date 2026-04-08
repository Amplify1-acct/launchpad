import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const maxDuration = 30;

// Search for a business and fetch its Google reviews using Places API (New)
async function findBusinessReviews(name: string, city: string, state: string): Promise<{
  placeId: string | null;
  placeName: string | null;
  rating: number | null;
  totalRatings: number | null;
  mapsUrl: string | null;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    time: number;
    initials: string;
  }>;
}> {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const query = `${name} ${city} ${state}`.trim();

  // Step 1: Text search using Places API (New)
  const searchRes = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
      cache: "no-store",
    }
  );
  const searchData = await searchRes.json();

  if (!searchData.places?.length) {
    return { placeId: null, placeName: null, rating: null, totalRatings: null, mapsUrl: null, reviews: [] };
  }

  const place = searchData.places[0];
  const placeId = place.id;
  const mapsUrl = place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  const rating = place.rating || null;
  const totalRatings = place.userRatingCount || null;
  const placeName = place.displayName?.text || name;

  // Step 2: Fetch reviews using Places API (New)
  const detailsRes = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "reviews",
      },
      cache: "no-store",
    }
  );
  const detailsData = await detailsRes.json();

  const reviews = (detailsData.reviews || [])
    .filter((r: any) => r.rating >= 4 && r.text?.text?.length > 30)
    .slice(0, 5)
    .map((r: any) => ({
      author: r.authorAttribution?.displayName || "Google User",
      rating: r.rating,
      text: r.text?.text || "",
      time: r.publishTime ? new Date(r.publishTime).getTime() / 1000 : Date.now() / 1000,
      initials: (r.authorAttribution?.displayName || "GU")
        .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
    }));

  return { placeId, placeName, rating, totalRatings, mapsUrl, reviews };
}

// POST: fetch and store reviews for a business
export async function POST(request: Request) {
  try {
    const { business_id, force = false } = await request.json();
    if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

    const supabase = createAdminClient();

    // Check plan — Google Reviews is Premium only
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("customer_id",
        (await supabase.from("businesses").select("customer_id").eq("id", business_id).single()).data?.customer_id
      )
      .single();

    const plan = sub?.plan || "starter";
    if (plan !== "premium") {
      return NextResponse.json({
        error: "Google Reviews is a Premium feature",
        plan,
        upgrade: true,
      }, { status: 403 });
    }

    // Get business details
    const { data: biz } = await supabase
      .from("businesses")
      .select("name, city, state, google_place_id, google_maps_url")
      .eq("id", business_id)
      .single();

    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Skip if already have reviews and not forcing refresh
    if (!force && biz.google_place_id) {
      const { data: existing } = await supabase
        .from("google_reviews")
        .select("id")
        .eq("business_id", business_id)
        .limit(1);
      if (existing?.length) {
        return NextResponse.json({ success: true, cached: true, message: "Reviews already fetched" });
      }
    }

    // Fetch from Google
    const result = await findBusinessReviews(biz.name, biz.city || "", biz.state || "");

    // Save place info to business record
    await supabase.from("businesses").update({
      google_place_id: result.placeId,
      google_maps_url: result.mapsUrl,
      google_rating: result.rating,
      google_rating_count: result.totalRatings,
    }).eq("id", business_id);

    // Clear old reviews and save new ones
    await supabase.from("google_reviews").delete().eq("business_id", business_id);

    if (result.reviews.length > 0) {
      await supabase.from("google_reviews").insert(
        result.reviews.map((r, i) => ({
          business_id,
          author_name: r.author,
          rating: r.rating,
          text: r.text,
          review_time: new Date(r.time * 1000).toISOString(),
          initials: r.initials,
          sort_order: i,
        }))
      );
    }

    // Rebuild the reviews section of the site HTML
    const { data: website } = await supabase
      .from("websites")
      .select("custom_html, status")
      .eq("business_id", business_id)
      .single();

    if (website?.custom_html) {
      const updatedHtml = rebuildReviewsSection(website.custom_html, result);
      await supabase.from("websites").update({ custom_html: updatedHtml }).eq("business_id", business_id);
    }

    return NextResponse.json({
      success: true,
      found: !!result.placeId,
      reviewCount: result.reviews.length,
      rating: result.rating,
      totalRatings: result.totalRatings,
      mapsUrl: result.mapsUrl,
    });

  } catch (err: any) {
    console.error("fetch-reviews error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Rebuild the reviews/testimonials section in existing HTML
function rebuildReviewsSection(html: string, data: {
  placeId: string | null;
  rating: number | null;
  totalRatings: number | null;
  mapsUrl: string | null;
  reviews: Array<{ author: string; rating: number; text: string; initials: string }>;
}): string {
  const { reviews, rating, totalRatings, mapsUrl, placeId } = data;

  if (reviews.length === 0) {
    // No reviews found — show a CTA to collect reviews
    const emptySection = buildEmptyReviewsSection(mapsUrl);
    return replaceReviewsSection(html, emptySection);
  }

  // Build real reviews HTML
  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
  
  const reviewCards = reviews.slice(0, 3).map(r => `
      <div class="review-card">
        <div class="review-stars" style="color:#f59e0b;font-size:16px;margin-bottom:10px">${stars(r.rating)}</div>
        <p class="review-text" style="font-size:14px;line-height:1.7;color:#374151;margin-bottom:14px;font-style:italic">"${r.text.replace(/"/g, "&quot;").slice(0, 280)}${r.text.length > 280 ? "…" : ""}"</p>
        <div class="reviewer" style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:#4648d4;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${r.initials}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#111">${r.author}</div>
            <div style="font-size:11px;color:#9ca3af;display:flex;align-items:center;gap:4px">
              <img src="https://www.google.com/favicon.ico" width="12" height="12" alt="Google"/> Google Review
            </div>
          </div>
        </div>
      </div>`).join("");

  const ratingBadge = rating ? `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:32px;font-weight:800;color:#111">${rating.toFixed(1)}</span>
      <div>
        <div style="color:#f59e0b;font-size:18px">${stars(Math.round(rating))}</div>
        <div style="font-size:12px;color:#6b7280">${totalRatings ? totalRatings.toLocaleString() + " Google reviews" : "Google reviews"}</div>
      </div>
    </div>` : "";

  const moreLink = mapsUrl ? `
    <div style="text-align:center;margin-top:32px">
      <a href="${mapsUrl}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;border:1.5px solid #e5e7eb;border-radius:100px;font-size:13px;font-weight:600;color:#374151;text-decoration:none">
        <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="Google"/> See all reviews on Google
      </a>
    </div>` : "";

  const newSection = `<section class="reviews" style="padding:80px 20px;background:#f9fafb">
  <div style="max-width:1100px;margin:0 auto">
    <div style="margin-bottom:40px">
      ${ratingBadge}
      <h2 style="font-size:clamp(28px,5vw,40px);font-weight:800;color:#111;line-height:1.15">What Our Customers Say</h2>
    </div>
    <div class="reviews-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">
      ${reviewCards}
    </div>
    ${moreLink}
  </div>
</section>`;

  return replaceReviewsSection(html, newSection);
}

function buildEmptyReviewsSection(mapsUrl: string | null): string {
  const reviewLink = mapsUrl || "#";
  return `<section class="reviews" style="padding:80px 20px;background:#f9fafb">
  <div style="max-width:700px;margin:0 auto;text-align:center">
    <div style="font-size:40px;margin-bottom:16px">⭐</div>
    <h2 style="font-size:28px;font-weight:800;color:#111;margin-bottom:12px">Happy with our service?</h2>
    <p style="font-size:16px;color:#6b7280;margin-bottom:28px;line-height:1.6">Reviews help other customers find us and help us keep improving. If you enjoyed your experience, we'd love to hear from you.</p>
    <a href="${reviewLink}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:8px;background:#4648d4;color:#fff;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">
      <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="Google"/> Leave us a Google Review
    </a>
  </div>
</section>`;
}

function replaceReviewsSection(html: string, newSection: string): string {
  // Try to find and replace the existing reviews section
  // Look for common patterns Stitch uses for reviews sections
  const patterns = [
    /<section[^>]*class="[^"]*review[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    /<section[^>]*id="[^"]*review[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class="[^"]*reviews[^"]*"[^>]*>[\s\S]*?(?=<section|<footer|<div class="contact|<div id="contact)/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.test(html)) {
      return html.replace(pattern, newSection);
    }
  }

  // If no reviews section found, inject before footer
  return html.replace(/<footer/i, `${newSection}
<footer`);
}

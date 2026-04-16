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
    status: data.status,        // pending | ready | failed
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

  return NextResponse.json({ ok: true, slug, status });
}

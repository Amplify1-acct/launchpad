import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// PATCH /api/social-posts — update a post (approve, edit caption, reschedule)
export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, caption, status, scheduled_for } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify ownership via RLS — the policy handles this
  const updates: Record<string, string> = {};
  if (caption !== undefined) updates.caption = caption;
  if (status !== undefined) updates.status = status;
  if (scheduled_for !== undefined) updates.scheduled_for = scheduled_for;

  const { data, error } = await supabase
    .from("social_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, post: data });
}

// DELETE /api/social-posts?id=xxx — delete a post
export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("social_posts")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

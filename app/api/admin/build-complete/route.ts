import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL  || "https://www.exsisto.ai";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id, success, error } = await request.json();
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();

  if (!success) {
    await supabase.from("websites").update({ status: "error" }).eq("business_id", business_id);
    return NextResponse.json({ ok: true });
  }

  // Mark as admin_review
  await supabase
    .from("websites")
    .update({ status: "admin_review" })
    .eq("business_id", business_id);

  // Send QA ready email to Matt
  fetch(`${APP_URL}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "admin_qa_ready", business_id }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL  || "https://www.exsisto.ai";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { business_id, success } = body;
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const newStatus = success ? "ready_for_review" : "error";

  const { error } = await supabase
    .from("websites")
    .update({ status: newStatus })
    .eq("business_id", business_id);

  if (error) {
    console.error("build-complete error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (success) {
    fetch(`${APP_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "admin_qa_ready", business_id }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: newStatus });
}

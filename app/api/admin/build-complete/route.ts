import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL  || "https://www.exsisto.ai";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id, success } = await request.json();
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const newStatus = success ? "admin_review" : "error";

  const { data, error } = await supabase
    .from("websites")
    .update({ status: newStatus })
    .eq("business_id", business_id)
    .select("id, status");

  if (error) {
    console.error("build-complete update error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.log("build-complete:", business_id, "→", newStatus, "rows:", data?.length);

  if (success) {
    fetch(`${APP_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "admin_qa_ready", business_id }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: newStatus, rows: data?.length });
}

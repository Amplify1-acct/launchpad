import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  
  const { data: businesses, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name, subdomain")
    .limit(5);
    
  const { data: websites, error: webErr } = await supabase
    .from("websites")
    .select("business_id, status, custom_html")
    .limit(5);
    
  return NextResponse.json({
    businesses: businesses?.map(b => ({ id: b.id, name: b.name, subdomain: b.subdomain })),
    websites: websites?.map(w => ({ business_id: w.business_id, status: w.status, has_html: !!w.custom_html })),
    bizError: bizErr?.message,
    webError: webErr?.message,
  });
}

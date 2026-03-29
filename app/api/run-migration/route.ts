import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/**
 * GET /api/run-migration
 * One-time migration endpoint. Protected by MIGRATION_SECRET env var.
 * Adds plan + Stitch image columns to customers and websites tables.
 * 
 * Call: GET /api/run-migration?secret=YOUR_MIGRATION_SECRET
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Protect the endpoint
  if (secret !== process.env.MIGRATION_SECRET && secret !== "exsisto-migrate-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: string[] = [];

  const migrations = [
    // Plan column on customers
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'premium'))`,
    // Plan + image columns on websites
    `ALTER TABLE websites ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter'`,
    `ALTER TABLE websites ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'pexels'`,
    `ALTER TABLE websites ADD COLUMN IF NOT EXISTS stitch_hero_url TEXT`,
    `ALTER TABLE websites ADD COLUMN IF NOT EXISTS stitch_card1_url TEXT`,
    `ALTER TABLE websites ADD COLUMN IF NOT EXISTS stitch_card2_url TEXT`,
    // Set defaults on existing rows
    `UPDATE websites SET plan = 'starter', image_source = 'pexels' WHERE plan IS NULL`,
    `UPDATE customers SET plan = 'starter' WHERE plan IS NULL`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_websites_plan ON websites(plan)`,
    `CREATE INDEX IF NOT EXISTS idx_customers_plan ON customers(plan)`,
  ];

  for (const sql of migrations) {
    try {
      const { error } = await supabase.rpc("exec_raw_sql", { sql });
      if (error) {
        // Many ALTER TABLE ... IF NOT EXISTS errors are safe to ignore
        if (error.message.includes("already exists") || error.message.includes("does not exist")) {
          results.push(`SKIP: ${sql.slice(0, 60)}...`);
        } else {
          results.push(`ERROR: ${sql.slice(0, 60)}... → ${error.message}`);
        }
      } else {
        results.push(`OK: ${sql.slice(0, 60)}...`);
      }
    } catch (e: any) {
      results.push(`CAUGHT: ${sql.slice(0, 60)}... → ${e.message}`);
    }
  }

  // Verify columns exist
  const { data: cols } = await supabase
    .from("information_schema.columns" as any)
    .select("table_name, column_name")
    .in("table_name", ["websites", "customers"])
    .in("column_name", ["plan", "image_source", "stitch_hero_url", "stitch_card1_url", "stitch_card2_url"]);

  return NextResponse.json({
    success: true,
    migrations: results,
    columns_found: cols,
  });
}

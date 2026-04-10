import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN_WORKFLOW || process.env.GITHUB_TOKEN || "";
const GITHUB_REPO  = "Amplify1-acct/launchpad";

export const maxDuration = 60;

async function ghGet(path: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=main`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
  return res.json();
}

async function ghPut(path: string, content: string, sha: string, message: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: { Authorization: `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message, sha, branch: "main",
        content: Buffer.from(content).toString("base64"),
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub PUT ${path}: ${res.status}`);
}

async function listFiles(dir: string): Promise<Array<{ path: string; name: string; type: string }>> {
  try {
    const items = await ghGet(dir) as Array<{ path: string; name: string; type: string }>;
    return items;
  } catch { return []; }
}

async function copyTree(srcDir: string, dstDir: string, commitMsg: string) {
  const items = await listFiles(srcDir);
  for (const item of items) {
    if (item.type === "file") {
      // Get source file
      const srcData = await ghGet(item.path) as { content: string; sha: string };
      const fileContent = Buffer.from(srcData.content, "base64").toString("utf8");

      // Check if destination exists to get its SHA
      const dstPath = item.path.replace(srcDir, dstDir);
      let dstSha = "";
      try {
        const dstData = await ghGet(dstPath) as { sha: string };
        dstSha = dstData.sha;
      } catch { /* file doesn't exist yet, that's fine */ }

      await ghPut(dstPath, fileContent, dstSha, commitMsg);
    } else if (item.type === "dir" && !item.name.startsWith("_")) {
      await copyTree(item.path, item.path.replace(srcDir, dstDir), commitMsg);
    }
  }
}

// GET — list available backups for a site
export async function GET(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");
  if (!subdomain) return NextResponse.json({ error: "subdomain required" }, { status: 400 });

  const backupDir = `public/sites/${subdomain}/_backups`;
  const items = await listFiles(backupDir);

  const backups = items
    .filter(i => i.type === "dir")
    .map(i => ({
      name: i.name,
      path: i.path,
      // Format: 2026-04-10T14-32-05 → readable
      label: i.name.replace(/T(\d{2})-(\d{2})-(\d{2})/, " at $1:$2:$3").replace(/-/g, "/").replace("//", "-"),
    }))
    .reverse(); // newest first

  return NextResponse.json({ backups });
}

// POST — restore a specific backup
export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { business_id, backup_name } = await request.json();
  if (!business_id || !backup_name) {
    return NextResponse.json({ error: "business_id and backup_name required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: business } = await supabase.from("businesses").select("subdomain").eq("id", business_id).single();
  if (!business?.subdomain) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const subdomain   = business.subdomain;
  const backupPath  = `public/sites/${subdomain}/_backups/${backup_name}`;
  const livePath    = `public/sites/${subdomain}`;
  const commitMsg   = `♻️ Restore ${subdomain} from backup ${backup_name}`;

  try {
    // First, back up the current live site before restoring
    const now       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const prePath   = `public/sites/${subdomain}/_backups/pre-restore-${now}`;
    await copyTree(livePath, prePath, `📦 Pre-restore backup: ${subdomain}`);

    // Now copy backup → live
    await copyTree(backupPath, livePath, commitMsg);

    return NextResponse.json({ success: true, restored: backup_name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

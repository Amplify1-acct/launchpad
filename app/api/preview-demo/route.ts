import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Map template style to demo site folder + original strings to replace
const DEMO_MAP: Record<string, { folder: string; bizName: string; city: string; state: string }> = {
  bold:  { folder: "mattys-automotive",      bizName: "Matty's Automotive",    city: "Springfield",  state: "NJ" },
  warm:  { folder: "greenscape-landscaping",  bizName: "GreenScape Landscaping", city: "Westfield",   state: "NJ" },
  clean: { folder: "procomfort-hvac",         bizName: "ProComfort HVAC",       city: "Scotch Plains", state: "NJ" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const style     = searchParams.get("style") || "bold";
  const bizName   = (searchParams.get("biz") || "").trim();
  const cityState = (searchParams.get("city") || "").trim();

  const demo = DEMO_MAP[style] || DEMO_MAP.bold;

  try {
    const htmlPath = join(process.cwd(), "public", "sites", demo.folder, "index.html");
    let html = readFileSync(htmlPath, "utf-8");

    if (bizName) {
      html = html.split(demo.bizName).join(bizName);
    }

    if (cityState) {
      const parts    = cityState.split(",").map((s: string) => s.trim());
      const newCity  = parts[0] || cityState;
      const newState = parts[1] || demo.state;
      html = html.split(demo.city).join(newCity);
      html = html.split(` ${demo.state}`).join(` ${newState}`);
      html = html.split(`,${demo.state}`).join(`,${newState}`);
    }

    const displayBiz = bizName || demo.bizName;
    const displayLoc = cityState || `${demo.city}, ${demo.state}`;

    const banner = `
<div id="exsisto-preview-bar" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#4648d4;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;font-family:system-ui,sans-serif;font-size:14px;box-shadow:0 2px 12px rgba(0,0,0,0.2);">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="font-size:18px;">✨</span>
    <span>Previewing <strong>${displayBiz}</strong> in ${displayLoc}</span>
    <span style="background:rgba(255,255,255,0.15);border-radius:4px;padding:2px 8px;font-size:12px;">Preview Mode</span>
  </div>
  <a href="/order" style="background:#fff;color:#4648d4;font-weight:700;font-size:13px;border-radius:8px;padding:8px 18px;text-decoration:none;white-space:nowrap;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Get Started →</a>
</div>
<style>body { padding-top: 52px !important; }</style>`;

    html = html.replace(/<body([^>]*)>/, `<body$1>${banner}`);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err: any) {
    console.error("preview-demo error:", err);
    return NextResponse.json({ error: "Demo not found" }, { status: 404 });
  }
}

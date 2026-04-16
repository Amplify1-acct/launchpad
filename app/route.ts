import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const html = readFileSync(
      join(process.cwd(), "public/homepage-v4-light-indigo.html"),
      "utf-8"
    );
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Site coming soon", { status: 200 });
  }
}

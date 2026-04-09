import { NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", ADMIN_SECRET, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return response;
}

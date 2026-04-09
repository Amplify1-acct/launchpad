import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) return NextResponse.json({ error: "GCP_SERVICE_ACCOUNT_JSON not set" });

  try {
    const key = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    const b64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString("base64")
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const header = { alg: "RS256", typ: "JWT" };
    const payload = { iss: key.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: key.token_uri, iat: now, exp: now + 3600 };
    const unsigned = `${b64url(header)}.${b64url(payload)}`;
    const { createSign } = await import("crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(unsigned);
    const signature = sign.sign(key.private_key, "base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const jwt = `${unsigned}.${signature}`;

    const tokenRes = await fetch(key.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) return NextResponse.json({ step: "auth", error: tokenData });

    const token = tokenData.access_token;
    const PROJECT_ID = "gen-lang-client-0553736847";
    const STITCH_BASE = "https://stitch.googleapis.com/v1";

    // Try creating a project
    const projRes = await fetch(`${STITCH_BASE}/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT_ID },
      body: JSON.stringify({ title: "Stitch Auth Test" }),
    });
    const projText = await projRes.text();
    let projData: any;
    try { projData = JSON.parse(projText); } catch { projData = { raw: projText }; }

    return NextResponse.json({
      auth: "OK",
      project_status: projRes.status,
      project_response: projData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

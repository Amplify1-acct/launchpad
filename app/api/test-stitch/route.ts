import { NextResponse } from "next/server";

export async function GET() {
  // Check if GCP_SERVICE_ACCOUNT_JSON is set
  const gcpJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!gcpJson) {
    return NextResponse.json({ error: "GCP_SERVICE_ACCOUNT_JSON not set", hasKey: false });
  }
  
  try {
    const key = JSON.parse(gcpJson);
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: key.token_uri,
      iat: now,
      exp: now + 3600,
    };
    
    const b64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString("base64")
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    
    const unsigned = `${b64url(header)}.${b64url(payload)}`;
    const { createSign } = await import("crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(unsigned);
    const signature = sign.sign(key.private_key, "base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const jwt = `${unsigned}.${signature}`;
    
    const res = await fetch(key.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    
    const data = await res.json();
    if (data.access_token) {
      return NextResponse.json({ 
        success: true, 
        client_email: key.client_email,
        has_token: true 
      });
    } else {
      return NextResponse.json({ 
        error: "Auth failed", 
        details: data,
        client_email: key.client_email 
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message, hasKey: true });
  }
}

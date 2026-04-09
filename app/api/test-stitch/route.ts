import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) return NextResponse.json({ error: "no GCP key" });

  try {
    const key = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    const b64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString("base64")
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const unsigned = `${b64url({ alg:"RS256", typ:"JWT" })}.${b64url({ iss:key.client_email, scope:"https://www.googleapis.com/auth/cloud-platform", aud:key.token_uri, iat:now, exp:now+3600 })}`;
    const { createSign } = await import("crypto");
    const s = createSign("RSA-SHA256"); s.update(unsigned);
    const jwt = `${unsigned}.${s.sign(key.private_key,"base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}`;
    const td = await (await fetch(key.token_uri,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})})).json() as any;
    const token = td.access_token;
    const PID = "gen-lang-client-0553736847";
    const BASE = "https://stitch.googleapis.com/v1";

    // Create project
    const proj = await (await fetch(`${BASE}/projects`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json","x-goog-user-project":PID},body:JSON.stringify({title:"Test"})})).json() as any;
    const projectId = proj.name?.split("/").pop();

    // Try different model IDs and endpoint variants
    const attempts = [
      { model_id: "GEMINI_3_PRO", endpoint: `${BASE}/projects/${projectId}/screens:generate` },
      { model_id: "GEMINI_2_0_FLASH", endpoint: `${BASE}/projects/${projectId}/screens:generate` },
      { model_id: "GEMINI_3_1_PRO", endpoint: `${BASE}/projects/${projectId}/screens:generate` },
    ];

    const results: any[] = [];
    const prompt = "Simple homepage for a law firm. Navy and gold. Hero, services, contact.";

    for (const attempt of attempts) {
      const res = await fetch(attempt.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PID },
        body: JSON.stringify({ prompt, device_type: "DESKTOP", model_id: attempt.model_id })
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
      results.push({ model_id: attempt.model_id, status: res.status, has_screens: !!(data.outputComponents?.[0]?.design?.screens?.length), error: data.error?.message || data.raw || null });
      if (res.status === 200 && data.outputComponents?.[0]?.design?.screens?.length) break;
    }

    return NextResponse.json({ project_id: projectId, results });
  } catch(err:any) {
    return NextResponse.json({ error: err.message });
  }
}

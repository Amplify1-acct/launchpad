import { NextResponse } from "next/server";

async function getToken() {
  const key = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON!);
  const now = Math.floor(Date.now() / 1000);
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const unsigned = `${b64url({ alg:"RS256", typ:"JWT" })}.${b64url({ iss:key.client_email, scope:"https://www.googleapis.com/auth/cloud-platform", aud:key.token_uri, iat:now, exp:now+3600 })}`;
  const { createSign } = await import("crypto");
  const s = createSign("RSA-SHA256"); s.update(unsigned);
  const jwt = `${unsigned}.${s.sign(key.private_key,"base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}`;
  const td = await (await fetch(key.token_uri,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})})).json() as any;
  return td.access_token;
}

export async function GET() {
  try {
    const token = await getToken();
    const PID = "gen-lang-client-0553736847";
    
    // Try v1beta endpoint instead of v1
    const bases = [
      "https://stitch.googleapis.com/v1",
      "https://stitch.googleapis.com/v1beta",
      "https://stitchdesign.googleapis.com/v1",
    ];

    const results: any[] = [];
    
    // First create a project with v1 (we know this works)
    const proj = await (await fetch(`https://stitch.googleapis.com/v1/projects`,{
      method:"POST",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json","x-goog-user-project":PID},
      body:JSON.stringify({title:"Endpoint Test"})
    })).json() as any;
    const projectId = proj.name?.split("/").pop();

    // Try different endpoint patterns for screen generation
    const endpoints = [
      `https://stitch.googleapis.com/v1/projects/${projectId}/screens:generate`,
      `https://stitch.googleapis.com/v1beta/projects/${projectId}/screens:generate`,
      `https://stitch.googleapis.com/v1/projects/${projectId}:generateScreen`,
      `https://stitch.googleapis.com/v1/projects/${projectId}/screens`,
    ];

    const prompt = "Simple blue homepage. Hero section with headline and button.";

    for (const endpoint of endpoints) {
      const method = endpoint.endsWith("/screens") ? "POST" : "POST";
      const body = endpoint.includes("generateScreen")
        ? JSON.stringify({ prompt, deviceType: "DESKTOP" })
        : JSON.stringify({ prompt, device_type: "DESKTOP", model_id: "GEMINI_3_PRO" });
      
      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PID },
        body
      });
      const text = await res.text();
      results.push({ 
        endpoint: endpoint.replace(`/projects/${projectId}`, "/projects/PROJECT"), 
        status: res.status,
        response_preview: text.slice(0, 200)
      });
    }

    return NextResponse.json({ project_id: projectId, results });
  } catch(err:any) {
    return NextResponse.json({ error: err.message });
  }
}

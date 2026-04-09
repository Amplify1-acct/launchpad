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
    const proj = await (await fetch(`${BASE}/projects`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json","x-goog-user-project":PID},body:JSON.stringify({title:"Test Law Site"})})).json() as any;
    const projectId = proj.name?.split("/").pop();
    if (!projectId) return NextResponse.json({ step:"create_project", error: proj });

    // Generate screen
    const prompt = `Design a homepage for "Sunrise Law Group", a personal injury and family law firm in Austin, TX. Bold professional design with dark navy and gold accents. Include nav, hero, services (Personal Injury, Family Law, Car Accidents), stats, about, reviews, footer.`;
    const genRes = await fetch(`${BASE}/projects/${projectId}/screens:generate`,{
      method:"POST",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json","x-goog-user-project":PID},
      body:JSON.stringify({prompt, device_type:"DESKTOP", model_id:"GEMINI_3_PRO"})
    });
    const genText = await genRes.text();
    let genData: any;
    try { genData = JSON.parse(genText); } catch { genData = { raw: genText.slice(0,500) }; }

    return NextResponse.json({
      project_id: projectId,
      generate_status: genRes.status,
      has_components: !!(genData.outputComponents?.length),
      components_count: genData.outputComponents?.length || 0,
      error: genData.error || null,
      first_screen: genData.outputComponents?.[0]?.design?.screens?.[0]?.id || null,
      html_url: genData.outputComponents?.[0]?.design?.screens?.[0]?.htmlCode?.downloadUrl || null,
    });
  } catch(err:any) {
    return NextResponse.json({ error: err.message });
  }
}

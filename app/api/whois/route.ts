import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });

  try {
    // Use RDAP (Registration Data Access Protocol) — free, no API key needed
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    const tld = clean.split(".").slice(-1)[0];

    // RDAP bootstrap to find the right server
    const bootstrapRes = await fetch("https://data.iana.org/rdap/dns.json", { 
      next: { revalidate: 86400 } 
    });
    const bootstrap = await bootstrapRes.json();
    
    let rdapServer = "https://rdap.org/domain/";
    for (const [tlds, urls] of bootstrap.services) {
      if (tlds.includes(tld) && urls.length > 0) {
        rdapServer = urls[0];
        break;
      }
    }

    const rdapRes = await fetch(`${rdapServer}${clean}`, {
      headers: { Accept: "application/json" },
    });

    if (!rdapRes.ok) {
      return NextResponse.json({ registrar: null, error: "Domain not found or lookup failed" });
    }

    const data = await rdapRes.json();

    // Extract registrar name
    let registrar = null;
    if (data.entities) {
      for (const entity of data.entities) {
        if (entity.roles?.includes("registrar")) {
          registrar = entity.vcardArray?.[1]?.find((v: any[]) => v[0] === "fn")?.[3]
            || entity.publicIds?.[0]?.identifier
            || null;
          break;
        }
      }
    }

    // Map registrar name to our known registrars
    const knownRegistrars: Record<string, string> = {
      "godaddy": "godaddy",
      "namecheap": "namecheap",
      "squarespace": "squarespace",
      "google": "google",
      "cloudflare": "cloudflare",
      "bluehost": "bluehost",
      "wix": "wix",
      "network solutions": "networksolutions",
      "hostgator": "hostgator",
      "ionos": "ionos",
    };

    let matched = "other";
    if (registrar) {
      const lower = registrar.toLowerCase();
      for (const [key, val] of Object.entries(knownRegistrars)) {
        if (lower.includes(key)) { matched = val; break; }
      }
    }

    return NextResponse.json({ 
      registrar: registrar || "Unknown",
      registrarKey: matched,
      domain: clean,
    });

  } catch (err: any) {
    return NextResponse.json({ registrar: null, error: err.message });
  }
}

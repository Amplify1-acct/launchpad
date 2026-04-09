import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return NextResponse.json({ status: "MISSING", fix: "Add GCP_SERVICE_ACCOUNT_JSON to Vercel env vars" });
  }

  // Try to fix common issues: literal newlines in private_key
  let fixed = raw;
  // If raw contains literal newlines inside the JSON string values, sanitize
  try {
    JSON.parse(raw);
    return NextResponse.json({ status: "VALID", length: raw.length, message: "JSON parses fine - check Stitch API itself" });
  } catch (e1: any) {
    // Try fixing: replace literal newlines that aren't part of JSON structure
    try {
      // The private_key field contains \n in the PEM - if pasted raw, it has actual newlines
      // Replace actual newlines within string values
      fixed = raw
        .replace(/\\n/g, "|||NEWLINE|||")   // protect escaped ones
        .replace(/\n/g, "\\n")               // escape real newlines
        .replace(/\|\|\|NEWLINE\|\|\|/g, "\\n"); // restore
      const parsed = JSON.parse(fixed);
      return NextResponse.json({ 
        status: "FIXABLE", 
        original_length: raw.length,
        fixed_length: fixed.length,
        client_email: parsed.client_email,
        fix: "The JSON has literal newlines. In Vercel, paste the JSON as a single line with \\n in the private_key, or use the fixed version below.",
        fixed_preview: fixed.slice(0, 200) + "..."
      });
    } catch (e2: any) {
      return NextResponse.json({ 
        status: "BROKEN", 
        parse_error: e1.message,
        length: raw.length,
        first_300: raw.slice(0, 300),
        fix: "GCP_SERVICE_ACCOUNT_JSON cannot be parsed. Re-paste the service account JSON from Google Cloud Console."
      });
    }
  }
}

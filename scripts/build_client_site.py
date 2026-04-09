#!/usr/bin/env python3
"""
Build Client Site — Exsisto.ai
Runs inside GitHub Actions to:
  1. Seed a new business (or reuse existing business_id)
  2. Generate custom hero images via Nano Banana (Gemini API)
  3. Upload images to Supabase Storage
  4. Call generate-site (Claude + Stitch)
  5. Deploy (set subdomain live)
"""
import os, json, time, base64, urllib.request, urllib.error

GEMINI_API_KEY  = os.environ.get("GEMINI_API_KEY", "")
SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY    = os.environ.get("SUPABASE_SERVICE_KEY", "")
SITE_URL        = "https://www.exsisto.ai"
INTERNAL_SECRET = "exsisto-internal-2026"
ADMIN_SECRET    = "exsisto-admin-2026"

business_name = os.environ.get("BUSINESS_NAME", "")
industry      = os.environ.get("INDUSTRY", "other")
city          = os.environ.get("CITY", "")
state         = os.environ.get("STATE", "")
phone         = os.environ.get("PHONE", "")
description   = os.environ.get("DESCRIPTION", "")
services      = os.environ.get("SERVICES", "")
plan          = os.environ.get("PLAN", "pro")
business_id   = os.environ.get("BUSINESS_ID", "").strip()

# ── Helpers ───────────────────────────────────────────────────────────────────

def post_json(url, data, headers=None):
    body = json.dumps(data).encode()
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=body, method="POST", headers=h)
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)

def supabase_patch(table, match_col, match_val, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match_col}=eq.{match_val}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="PATCH", headers={
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=representation",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

# ── Step 1: Seed or reuse business ───────────────────────────────────────────

if not business_id:
    print(f"Creating new business: {business_name}")
    result = post_json(f"{SITE_URL}/api/admin/seed", {
        "name": business_name, "industry": industry,
        "city": city, "state": state, "phone": phone,
        "description": description, "services": services, "plan": plan,
    }, {"x-admin-secret": ADMIN_SECRET})
    business_id = result["business_id"]
    print(f"Created business_id: {business_id}")
else:
    print(f"Using existing business_id: {business_id}")

# ── Step 2: Generate Nano Banana hero images ──────────────────────────────────

print(f"\nGenerating hero images via Nano Banana...")

GEMINI_MODEL    = "gemini-2.0-flash-preview-image-generation"
GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)
STORAGE_BUCKET = "customer-images"

industry_contexts = {
    "law":         "professional law office interior, attorneys working, sense of justice and trust, polished environment",
    "dental":      "bright modern dental office, friendly dental team, clean professional environment, welcoming smile",
    "auto":        "auto repair shop with skilled technician working on a car, professional garage environment",
    "plumbing":    "professional plumber working confidently on pipes, modern tools, residential or commercial setting",
    "hvac":        "HVAC technician servicing equipment, residential or commercial setting, clean professional work",
    "gym":         "modern gym interior with premium fitness equipment, energetic people working out",
    "salon":       "upscale hair salon interior, stylish chairs and mirrors, beauty professional at work",
    "restaurant":  "inviting restaurant interior with beautiful plated food, warm lighting and ambiance",
    "bakery":      "artisan bakery with beautiful pastries cakes and breads, warm welcoming atmosphere",
    "landscaping": "lush professional landscaping, beautifully manicured lawn and garden, outdoor living space",
    "realestate":  "beautiful home exterior with perfect curb appeal, welcoming suburban neighborhood",
    "pet":         "happy pets being lovingly groomed or cared for, warm and friendly pet care environment",
    "other":       "professional small business setting, confident team at work, clean modern environment",
}
context = industry_contexts.get(industry, industry_contexts["other"])

hero_prompt = (
    f"photorealistic photograph only, professional quality, no text, no logos, no watermarks, "
    f"no UI elements, no illustrations. {context}. Wide landscape format, vibrant professional lighting. "
    f"This is a hero banner image for a {business_name} website."
)
card1_prompt = (
    f"photorealistic photograph only, professional quality, no text, no logos, no watermarks. "
    f"{context}. Detail close-up shot, warm and inviting. Square format. "
    f"Supporting image for a {business_name} website."
)

def gemini_image(prompt_text):
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {"responseModalities": ["image", "text"]},
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        GEMINI_ENDPOINT, data=body, method="POST",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        data = json.load(r)
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for p in parts:
        if p.get("inlineData", {}).get("mimeType", "").startswith("image"):
            return base64.b64decode(p["inlineData"]["data"])
    raise ValueError("No image in Gemini response")

def upload_to_supabase(image_bytes, path):
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}"
    req = urllib.request.Request(url, data=image_bytes, method="POST", headers={
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        r.read()
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"

hero_url = card1_url = None
if GEMINI_API_KEY:
    try:
        print("  Generating hero image...")
        hero_bytes = gemini_image(hero_prompt)
        hero_url = upload_to_supabase(hero_bytes, f"{business_id}/hero.png")
        print(f"  Hero ready: {hero_url}")
        time.sleep(3)

        print("  Generating card image...")
        card_bytes = gemini_image(card1_prompt)
        card1_url = upload_to_supabase(card_bytes, f"{business_id}/card1.png")
        print(f"  Card1 ready: {card1_url}")
    except Exception as e:
        print(f"  Image generation failed: {e} — will use library fallback")
else:
    print("  No GEMINI_API_KEY — using library images")

# ── Step 3: Store images in websites table ────────────────────────────────────

if hero_url:
    print(f"\nStoring images in Supabase...")
    try:
        supabase_patch("websites", "business_id", business_id, {
            "hero_image_url": hero_url,
            "card1_image_url": card1_url,
            "image_source": "nano-banana",
        })
        print("  Images stored")
    except Exception as e:
        print(f"  Could not store images: {e}")

# ── Step 4: Generate site ─────────────────────────────────────────────────────

print(f"\nGenerating site via Stitch + Claude...")
result = post_json(f"{SITE_URL}/api/generate-site", {
    "business_id": business_id,
}, {"x-internal-secret": INTERNAL_SECRET})
print(f"  Site generated — template: {result.get('template')}, tokens: {result.get('tokens_generated')}")

# ── Step 5: Deploy ────────────────────────────────────────────────────────────

print(f"\nDeploying site...")
deploy = post_json(f"{SITE_URL}/api/deploy-site", {
    "business_id": business_id,
}, {"x-internal-secret": INTERNAL_SECRET})
site_url = deploy.get("url", "")
print(f"  LIVE: {site_url}")

print(f"\n{'='*50}")
print(f"BUILD COMPLETE")
print(f"  Business:    {business_name}")
print(f"  Business ID: {business_id}")
print(f"  Plan:        {plan}")
print(f"  Site URL:    {site_url}")
print(f"  Images:      {'Nano Banana custom' if hero_url else 'library fallback'}")
print(f"{'='*50}")

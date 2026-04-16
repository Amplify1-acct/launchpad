#!/usr/bin/env python3
"""
generate_custom_demo.py
Generates 4 AI images for a custom demo request,
uploads to Supabase Storage under custom-demos/{slug}/,
saves successfully generated images to the industry library,
then calls the webhook to mark status=ready.
"""

import json, base64, urllib.request, urllib.error, time, os, re

GEMINI_KEY      = os.environ["GEMINI_API_KEY"]
SUPABASE_URL    = os.environ["SUPABASE_URL"]
SUPABASE_KEY    = os.environ["SUPABASE_SERVICE_KEY"]
WEBHOOK_URL     = os.environ.get("WEBHOOK_URL", "https://www.exsisto.ai/api/demo-status")
INTERNAL_SECRET = os.environ.get("INTERNAL_SECRET", "exsisto-internal-2026")
MODEL           = "gemini-3.1-flash-image-preview"
BUCKET          = "industry-images"

SLUG       = os.environ["DEMO_SLUG"]
BIZ_NAME   = os.environ.get("BIZ_NAME", "")
CITY       = os.environ.get("CITY", "")
BASE_PROMPT = os.environ.get("BASE_PROMPT", "")

# ── Industry detection ────────────────────────────────────────────────────────

INDUSTRY_PATTERNS = [
    (r"plumb|pipe|drain|sewer|water.?heater",                          "plumbing"),
    (r"hvac|heat|air.?cond|furnace|cool|boiler|duct",                  "hvac"),
    (r"landscap|lawn|garden|tree|turf|mow|sprinkler|irrigation",       "landscaping"),
    (r"dent|teeth|orthodon|oral|hygien",                               "dental"),
    (r"roof|gutter|shingle",                                           "roofing"),
    (r"electr|wir|panel|outlet|generator",                             "electrical"),
    (r"clean|maid|janitorial|pressure.?wash|carpet|window.?wash",      "cleaning"),
    (r"paint|stain|coating|drywall|plaster",                           "painting"),
    (r"remodel|bathroom|kitchen|basement|renovation|tile|flooring|cabinet|handyman", "remodeling"),
    (r"gym|fitness|crossfit|personal.?train|yoga|pilates|workout",     "gym"),
    (r"pet|dog|cat|veterinar|groomin|animal|kennel|boarding",          "pet"),
    (r"restaurant|food|cafe|pizza|burger|diner|sushi|catering|baker|bakery|pastry|donut|coffee.?shop|sandwich", "restaurant"),
    (r"moving|mover|storage|haul|junk",                                "moving"),
    (r"auto|car|truck|vehicle|mechanic|tire|brake|oil.?change|transmission", "automotive"),
    (r"salon|spa|barber|hair|nail|beauty|wax|facial",                  "salon"),
    (r"law|attorney|legal|lawyer|firm",                                "legal"),
    (r"real.?estate|realtor|property|homes.?for.?sale",                "realestate"),
    (r"flower|florist|bouquet|arrangement|floral",                     "floral"),
    (r"trad|invest|stock|crypto|financ|bot|algorithm",                 "finance"),
    (r"photo|portrait|wedding.?photo|event.?photo",                    "photography"),
    (r"tutoring|education|coach|lesson|teach|school|learning",        "education"),
]

def detect_industry(biz_name: str, description: str) -> str:
    text = f"{biz_name} {description}".lower()
    for pattern, industry in INDUSTRY_PATTERNS:
        if re.search(pattern, text):
            return industry
    return "other"

# ── Get next available slot in industry library ───────────────────────────────

def get_next_slot(industry: str) -> str:
    """Find the next available imgN slot in the industry library."""
    # List existing files in this industry folder
    url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}"
    payload = json.dumps({"prefix": f"{industry}/", "limit": 200}).encode()
    req = urllib.request.Request(
        url, data=payload, method="POST",
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            files = json.load(r)
        # Extract slot numbers from filenames like img3.png, img7.png
        nums = []
        for f in files:
            name = f.get("name", "")
            m = re.match(r"img(\d+)\.(png|jpg)", name)
            if m:
                nums.append(int(m.group(1)))
        next_num = max(nums) + 1 if nums else 8  # start at img8 (1-7 are standard)
        return f"img{next_num}"
    except Exception as e:
        print(f"  Could not list library files: {e} — defaulting to img8")
        return "img8"

# ── Gemini image generation ───────────────────────────────────────────────────

def make_prompts(biz_name: str, city: str, base: str) -> dict:
    ctx = f"{biz_name} in {city}. {base[:200]}"
    return {
        "hero": (
            f"Photorealistic hero image for {ctx}. "
            "Wide cinematic shot, professional commercial photography, "
            "natural lighting, vibrant colors, inviting atmosphere. "
            "No text, no signs, no logos, no watermarks."
        ),
        "about": (
            f"Photorealistic about-section image for {ctx}. "
            "Owner or team at work, warm and trustworthy feel, "
            "natural environment for this type of business, "
            "candid professional portrait style. "
            "No text, no signs, no logos."
        ),
        "img3": (
            f"Photorealistic gallery image for {ctx}. "
            "Shows the work or product or environment of this business, "
            "high quality result or finished work on display. "
            "No text, no signs, no logos."
        ),
        "img4": (
            f"Photorealistic second gallery image for {ctx}. "
            "Different angle or aspect of the business — tools, space, product, or process. "
            "Professional quality, natural light. "
            "No text, no signs, no logos."
        ),
    }

def generate_image(prompt: str):
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{MODEL}:generateContent?key={GEMINI_KEY}"
    )
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["image", "text"]},
    }).encode()

    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url, data=body, method="POST",
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            for part in data["candidates"][0]["content"]["parts"]:
                if "inlineData" in part:
                    mime = part["inlineData"]["mimeType"]
                    img_bytes = base64.b64decode(part["inlineData"]["data"])
                    return img_bytes, mime
            raise ValueError("No image in Gemini response")
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
            if attempt < 2:
                time.sleep(15)
            else:
                raise

# ── Supabase Storage upload ───────────────────────────────────────────────────

def upload(img_bytes: bytes, mime: str, path: str) -> str:
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    req = urllib.request.Request(
        url, data=img_bytes, method="POST",
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": mime,
            "x-upsert": "true",
        }
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        r.read()
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"

# ── Webhook ───────────────────────────────────────────────────────────────────

def mark_ready(slug: str, image_urls: dict):
    payload = json.dumps({
        "slug": slug,
        "status": "ready",
        "images": image_urls,
    }).encode()
    req = urllib.request.Request(
        WEBHOOK_URL, data=payload, method="POST",
        headers={
            "Content-Type": "application/json",
            "x-internal-secret": INTERNAL_SECRET,
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.load(r)
            print(f"  Webhook OK: {result}")
    except Exception as e:
        print(f"  Webhook error (non-fatal): {e}")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"\n AI Custom Demo Image Generator")
    print(f"   Slug:     {SLUG}")
    print(f"   Business: {BIZ_NAME} in {CITY}")

    # Detect industry for library categorization
    industry = detect_industry(BIZ_NAME, BASE_PROMPT)
    print(f"   Industry: {industry}\n")

    prompts = make_prompts(BIZ_NAME, CITY, BASE_PROMPT)
    image_urls = {}
    library_saved = []

    # Track next slot per industry across multiple images
    # (get once, increment locally)
    try:
        next_slot_num = int(get_next_slot(industry).replace("img", ""))
    except Exception:
        next_slot_num = 8

    for slot, prompt in prompts.items():
        print(f"\n  [{slot}]")
        print(f"  Prompt: {prompt[:100]}...")
        try:
            print(f"  Generating...")
            img_bytes, mime = generate_image(prompt)
            print(f"  Generated: {len(img_bytes)//1024}KB ({mime})")
            ext = "png" if "png" in mime else "jpg"

            # 1. Upload to custom-demos/{slug}/ for this demo
            demo_path = f"custom-demos/{SLUG}/{slot}.{ext}"
            demo_url = upload(img_bytes, mime, demo_path)
            image_urls[slot] = demo_url
            print(f"  Demo URL: {demo_url}")

            # 2. Also save to industry library as next available slot
            lib_slot = f"img{next_slot_num}"
            lib_path = f"{industry}/{lib_slot}.{ext}"
            lib_url = upload(img_bytes, mime, lib_path)
            library_saved.append(f"{industry}/{lib_slot}")
            next_slot_num += 1
            print(f"  Library: {lib_url}")

            time.sleep(3)

        except Exception as e:
            print(f"  Failed {slot}: {e}")
            image_urls[slot] = None  # placeholder — skip library save

    print(f"\n  Calling webhook to mark ready...")
    mark_ready(SLUG, image_urls)

    generated = len([v for v in image_urls.values() if v])
    print(f"\nDone! {generated}/4 images generated.")
    print(f"Library additions: {', '.join(library_saved) if library_saved else 'none'}\n")

if __name__ == "__main__":
    main()

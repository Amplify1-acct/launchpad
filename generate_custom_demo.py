#!/usr/bin/env python3
"""
generate_custom_demo.py
Generates 4 Nano Banana images for a custom demo request,
uploads to Supabase Storage under custom-demos/{slug}/,
then calls the webhook to mark status=ready.

Called by GitHub Actions with inputs:
  DEMO_SLUG, IMAGE_PROMPT_HERO, IMAGE_PROMPT_ABOUT,
  IMAGE_PROMPT_GALLERY, BIZ_NAME, CITY, WEBHOOK_URL
"""

import json, base64, urllib.request, urllib.error, time, os, sys

GEMINI_KEY   = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
WEBHOOK_URL  = os.environ.get("WEBHOOK_URL", "https://www.exsisto.ai/api/demo-status")
INTERNAL_SECRET = os.environ.get("INTERNAL_SECRET", "exsisto-internal-2026")
MODEL        = "gemini-2.0-flash-preview-image-generation"
BUCKET       = "industry-images"

SLUG           = os.environ["DEMO_SLUG"]
BIZ_NAME       = os.environ.get("BIZ_NAME", "")
CITY           = os.environ.get("CITY", "")
BASE_PROMPT    = os.environ.get("BASE_PROMPT", "")  # description snippet for context

# ── Build slot-specific prompts from base description ────────────────────────

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

# ── Gemini image generation ──────────────────────────────────────────────────

def generate_image(prompt: str) -> tuple:
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

# ── Supabase Storage upload ──────────────────────────────────────────────────

def upload_to_supabase(img_bytes: bytes, mime: str, slug: str, slot: str) -> str:
    ext = "png" if "png" in mime else "jpg"
    path = f"custom-demos/{slug}/{slot}.{ext}"
    url  = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"

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

# ── Webhook — mark demo ready ────────────────────────────────────────────────

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

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f"\n🍌 Custom Demo Image Generator")
    print(f"   Slug: {SLUG}")
    print(f"   Business: {BIZ_NAME} in {CITY}\n")

    prompts = make_prompts(BIZ_NAME, CITY, BASE_PROMPT)
    image_urls = {}

    for slot, prompt in prompts.items():
        print(f"\n  [{slot}]")
        print(f"  Prompt: {prompt[:100]}...")
        try:
            print(f"  🍌 Generating...")
            img_bytes, mime = generate_image(prompt)
            print(f"  ✅ Generated: {len(img_bytes)//1024}KB ({mime})")

            print(f"  ☁️  Uploading to Supabase...")
            url = upload_to_supabase(img_bytes, mime, SLUG, slot)
            image_urls[slot] = url
            print(f"  ✅ {url}")

            time.sleep(3)  # be nice to Gemini rate limits
        except Exception as e:
            print(f"  ❌ Failed {slot}: {e}")
            # Use fallback placeholder — don't block the demo
            image_urls[slot] = None

    print(f"\n  📡 Calling webhook to mark ready...")
    mark_ready(SLUG, image_urls)
    print(f"\n🎉 Done! {len([v for v in image_urls.values() if v])} images generated.\n")

if __name__ == "__main__":
    main()

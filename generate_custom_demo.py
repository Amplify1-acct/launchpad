#!/usr/bin/env python3
"""
generate_custom_demo.py
Generates 4 AI images for a custom "Other" demo request.

For each submission:
1. Uses Claude to determine a clean category name from the description
2. Checks if that category already exists in the library
3. If yes — reuses existing images (no generation needed)
4. If no — generates 4 new images, saves to new category folder
5. Calls webhook to mark demo ready with image URLs
"""

import json, base64, urllib.request, urllib.error, time, os, re

GEMINI_KEY      = os.environ["GEMINI_API_KEY"]
ANTHROPIC_KEY   = os.environ["ANTHROPIC_API_KEY"]
SUPABASE_URL    = os.environ["SUPABASE_URL"]
SUPABASE_KEY    = os.environ["SUPABASE_SERVICE_KEY"]
WEBHOOK_URL     = os.environ.get("WEBHOOK_URL", "https://www.exsisto.ai/api/demo-status")
INTERNAL_SECRET = os.environ.get("INTERNAL_SECRET", "exsisto-internal-2026")
MODEL           = "gemini-3.1-flash-image-preview"
BUCKET          = "industry-images"

SLUG        = os.environ["DEMO_SLUG"]
BIZ_NAME    = os.environ.get("BIZ_NAME", "")
CITY        = os.environ.get("CITY", "")
BASE_PROMPT = os.environ.get("BASE_PROMPT", "")

# ── Step 1: Use Claude to get a clean category slug + label ──────────────────

def detect_category(biz_name: str, description: str) -> tuple:
    """
    Returns (slug, label) e.g. ("ai-agents", "AI Agents")
    Uses Claude to name the category intelligently.
    """
    url = "https://api.anthropic.com/v1/messages"
    body = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 100,
        "messages": [{
            "role": "user",
            "content": (
                f"A small business submitted this for a website demo:\n"
                f"Business name: {biz_name}\n"
                f"Description: {description[:300]}\n\n"
                f"Give me a short category name for this type of business "
                f"(like 'AI Agents', 'Escape Room', 'Wedding Photography', 'Food Truck').\n"
                f"Return ONLY a JSON object, no markdown:\n"
                f"{{\"slug\": \"kebab-case-max-3-words\", \"label\": \"Title Case Name\"}}"
            )
        }]
    }).encode()

    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
        text = data["content"][0]["text"].strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        slug = re.sub(r"[^a-z0-9-]", "", result["slug"].lower().replace(" ", "-"))
        label = result["label"]
        print(f"  Category detected: {label} ({slug})")
        return slug, label
    except Exception as e:
        print(f"  Category detection failed: {e} — using 'other'")
        fallback = biz_name.lower().replace(" ", "-")[:20]
        return fallback, biz_name

# ── Step 2: Check if category already has images in library ─────────────────

def get_library_images(category_slug: str) -> dict:
    """
    Returns dict of existing images in custom-categories/{category_slug}/
    e.g. {"hero": "https://...", "img3": "https://..."}
    Returns empty dict if category doesn't exist yet.
    """
    url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}"
    payload = json.dumps({
        "prefix": f"custom-categories/{category_slug}/",
        "limit": 100
    }).encode()
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
        images = {}
        for f in files:
            name = f.get("name", "")
            if name:
                slot = name.rsplit(".", 1)[0]  # strip extension
                pub_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/custom-categories/{category_slug}/{name}"
                images[slot] = pub_url
        return images
    except Exception as e:
        print(f"  Library check failed: {e}")
        return {}

# ── Step 3: Build image prompts ──────────────────────────────────────────────

def make_prompts(category_label: str, biz_name: str, city: str, base: str) -> dict:
    ctx = f"{category_label} business. {base[:200]}"
    return {
        "hero": (
            f"Photorealistic hero image for a {ctx}. "
            "Wide cinematic shot, professional commercial photography, "
            "natural lighting, vibrant colors, inviting atmosphere. "
            "No text, no signs, no logos, no watermarks."
        ),
        "about": (
            f"Photorealistic about-section image for a {ctx}. "
            "Owner or team at work, warm and trustworthy feel, "
            "natural environment for this type of business. "
            "No text, no signs, no logos."
        ),
        "img3": (
            f"Photorealistic gallery image for a {ctx}. "
            "Shows the work, product, or environment of this type of business, "
            "high quality result or finished work on display. "
            "No text, no signs, no logos."
        ),
        "img4": (
            f"Photorealistic second gallery image for a {ctx}. "
            "Different angle or aspect — tools, space, product, or process. "
            "Professional quality, natural light. "
            "No text, no signs, no logos."
        ),
    }

# ── Step 4: Generate + upload ────────────────────────────────────────────────

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

# ── Step 5: Webhook ──────────────────────────────────────────────────────────

def mark_ready(slug: str, image_urls: dict, category_slug: str, category_label: str):
    payload = json.dumps({
        "slug": slug,
        "status": "ready",
        "images": image_urls,
        "category_slug": category_slug,
        "category_label": category_label,
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
    print(f"\nAI Custom Demo Image Generator")
    print(f"  Slug:     {SLUG}")
    print(f"  Business: {BIZ_NAME} in {CITY}\n")

    # 1. Detect category (used for library archiving + copy context, not reuse)
    category_slug, category_label = detect_category(BIZ_NAME, BASE_PROMPT)

    # 2. Always generate fresh images per demo — do NOT reuse library images
    #    because every "Other" business deserves photos specific to their description.
    #    The library archive under custom-categories/ still gets written for future
    #    analysis / training, but we never short-circuit on it.
    prompts = make_prompts(category_label, BIZ_NAME, CITY, BASE_PROMPT)
    image_urls = {}

    for slot, prompt in prompts.items():
        print(f"\n  [{slot}]")
        print(f"  Prompt: {prompt[:100]}...")
        try:
            print(f"  Generating...")
            img_bytes, mime = generate_image(prompt)
            print(f"  Generated: {len(img_bytes)//1024}KB ({mime})")
            ext = "png" if "png" in mime else "jpg"

            # Upload to demo-specific path — this is the URL the user's demo uses
            demo_url = upload(img_bytes, mime, f"custom-demos/{SLUG}/{slot}.{ext}")
            image_urls[slot] = demo_url
            print(f"  Demo: {demo_url}")

            # Also archive to category library (for reference; NOT reused at render time)
            try:
                lib_url = upload(img_bytes, mime, f"custom-categories/{category_slug}/{slot}.{ext}")
                print(f"  Library [{category_label}/{slot}]: {lib_url}")
            except Exception as e:
                print(f"  Library archive skipped ({slot}): {e}")

            time.sleep(3)

        except Exception as e:
            print(f"  Failed {slot}: {e}")
            image_urls[slot] = None  # skip — don't include failed slots

    # 3. Mark ready
    print(f"\n  Calling webhook...")
    mark_ready(SLUG, image_urls, category_slug, category_label)

    generated = len([v for v in image_urls.values() if v])
    print(f"\nDone! {generated}/4 images generated for this demo. Category: '{category_label}' ({category_slug})\n")

if __name__ == "__main__":
    main()

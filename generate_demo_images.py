#!/usr/bin/env python3
"""
generate_demo_images.py
Generates Nano Banana (Gemini) images for the three demo sites,
uploads them to Supabase Storage, and patches the HTML files with real URLs.

Run via GitHub Actions: workflow_dispatch
Requires env vars: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
"""

import json, base64, urllib.request, urllib.error, time, os, subprocess, sys

GEMINI_KEY    = os.environ["GEMINI_API_KEY"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]
MODEL         = "gemini-3.1-flash-image-preview"
BUCKET        = "industry-images"

# ── Image prompts for each demo ────────────────────────────────────────────

DEMOS = {
    "dental": {
        "html_path": "public/demos/dental.html",
        "slots": [
            {
                "name": "hero",
                "prompt": "Photorealistic modern dental office reception area, clean white walls, bright natural light flooding in, welcoming comfortable chairs, professional calm atmosphere, high-end medical interior, no text no signs no letters no people",
                "width": 1200, "height": 800,
            },
            {
                "name": "about",
                "prompt": "Photorealistic smiling female dentist in white coat and scrubs, warm natural light, clean clinical background, confident professional portrait, looking at camera, friendly approachable expression, no text no letters",
                "width": 900, "height": 800,
            },
            {
                "name": "gallery1",
                "prompt": "Photorealistic close-up of a person with a perfect bright white smile, shallow depth of field, warm studio lighting, professional dental photography, no text no letters",
                "width": 700, "height": 600,
            },
            {
                "name": "gallery2",
                "prompt": "Photorealistic dental treatment room with modern chair and equipment, bright overhead clinical lighting, spotless clean surfaces, state of the art technology, no people, no text no letters",
                "width": 600, "height": 500,
            },
            {
                "name": "gallery3",
                "prompt": "Photorealistic dental team of three professionals in scrubs smiling together in a bright office hallway, diverse team, professional and friendly, no text no letters",
                "width": 600, "height": 500,
            },
        ]
    },
    "auto": {
        "html_path": "public/demos/auto.html",
        "slots": [
            {
                "name": "hero",
                "prompt": "Photorealistic exterior of a modern auto repair shop at golden hour, clean building facade, cars parked in front, dramatic sky, professional commercial photography, no text no signs no letters no logos",
                "width": 1600, "height": 900,
            },
            {
                "name": "about",
                "prompt": "Photorealistic interior of a professional auto repair shop showing organized service bays with a vehicle on a lift, clean epoxy floor, bright overhead lighting, tools organized on walls, no people, no text no letters",
                "width": 900, "height": 700,
            },
            {
                "name": "gallery1",
                "prompt": "Photorealistic wide shot of a modern automotive service center exterior, multiple service bays visible, clean professional facility, daytime, no text no signs no letters",
                "width": 1000, "height": 500,
            },
            {
                "name": "gallery2",
                "prompt": "Photorealistic close-up of a mechanic's hands using professional tools to work on a car engine, detailed engine components visible, clean uniform, no text no letters",
                "width": 600, "height": 500,
            },
            {
                "name": "gallery3",
                "prompt": "Photorealistic new modern car on a lift in a professional auto shop, clean service bay, bright lighting, no people, no text no letters",
                "width": 600, "height": 500,
            },
            {
                "name": "gallery4",
                "prompt": "Photorealistic wide shot of multiple cars lined up in a clean auto shop parking lot, well maintained vehicles, professional setting, no text no letters",
                "width": 1000, "height": 400,
            },
        ]
    },
    "law": {
        "html_path": "public/demos/law.html",
        "slots": [
            {
                "name": "hero",
                "prompt": "Photorealistic elegant law office interior, dark wood bookshelves filled with law books, large mahogany desk, leather chairs, dramatic window light, prestigious and authoritative atmosphere, no people, no text no letters",
                "width": 1200, "height": 900,
            },
            {
                "name": "about",
                "prompt": "Photorealistic confident male attorney in a tailored dark suit at a polished desk, professional office background with bookshelves, natural window light, commanding presence, no text no letters",
                "width": 900, "height": 800,
            },
        ]
    },
}

# ── Gemini image generation ────────────────────────────────────────────────

def generate_image(prompt: str) -> tuple[bytes, str]:
    """Call Gemini API, return (image_bytes, mime_type)."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_KEY}"
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["image", "text"]},
    }).encode()

    req = urllib.request.Request(url, data=body, method="POST",
          headers={"Content-Type": "application/json"})

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            parts = data["candidates"][0]["content"]["parts"]
            for part in parts:
                if "inlineData" in part:
                    mime = part["inlineData"]["mimeType"]
                    img_bytes = base64.b64decode(part["inlineData"]["data"])
                    return img_bytes, mime
            raise ValueError("No image in response")
        except urllib.error.HTTPError as e:
            body_text = e.read().decode()
            print(f"    Gemini error {e.code}: {body_text[:200]}")
            if attempt < 2:
                print(f"    Retrying in 15s...")
                time.sleep(15)
            else:
                raise
        except Exception as e:
            if attempt < 2:
                print(f"    Error: {e} — retrying in 10s...")
                time.sleep(10)
            else:
                raise

# ── Supabase Storage upload ─────────────────────────────────────────────────

def upload_to_supabase(img_bytes: bytes, mime: str, demo: str, slot_name: str) -> str:
    """Upload image bytes to Supabase Storage, return public URL."""
    ext = "png" if "png" in mime else "jpg"
    path = f"demo-sites/{demo}/{slot_name}.{ext}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"

    req = urllib.request.Request(upload_url, data=img_bytes, method="POST",
          headers={
              "Authorization": f"Bearer {SUPABASE_KEY}",
              "Content-Type": mime,
              "x-upsert": "true",
          })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            r.read()
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise Exception(f"Supabase upload failed {e.code}: {err}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
    return public_url

# ── HTML patching ──────────────────────────────────────────────────────────

def patch_html(html_path: str, slot_name: str, new_url: str, demo: str):
    """Replace Unsplash URL or placeholder for this slot with the Supabase URL."""
    with open(html_path, "r") as f:
        html = f.read()

    original = html

    # Map slot names to the Unsplash photo IDs currently in the files
    UNSPLASH_MAP = {
        "dental": {
            "hero":    "photo-1598256989800",
            "about":   "photo-1559839734",
            "gallery1": "photo-1606811841689",
            "gallery2": "photo-1629909613654",
            "gallery3": "photo-1498842812179",
            "gallery4": "photo-1579684385127",
            "gallery5": "photo-1609840114035",
        },
        "auto": {
            "hero":    "photo-1619642751034",
            "about":   "photo-1625047509168",
            "gallery1": "photo-1492144534655",
            "gallery2": "photo-1530046339160",
            "gallery3": "photo-1619642751034",   # reused
            "gallery4": "photo-1568605117036",
        },
        "law": {
            "hero":  "photo-1589829545856",
            "about": "photo-1556157382",
        },
    }

    photo_id = UNSPLASH_MAP.get(demo, {}).get(slot_name)

    if photo_id:
        # Replace any URL containing this photo ID
        import re
        pattern = rf'https://images\.unsplash\.com/{photo_id}[^"\']*'
        html = re.sub(pattern, new_url, html)

    if html == original:
        print(f"    ⚠️  No match found for {demo}/{slot_name} — check photo ID mapping")
    else:
        with open(html_path, "w") as f:
            f.write(html)
        print(f"    ✅ Patched {slot_name} in {html_path}")

# ── Git push ───────────────────────────────────────────────────────────────

def git_push(message: str):
    subprocess.run(["git", "config", "user.name", "Exsisto Bot"], check=True)
    subprocess.run(["git", "config", "user.email", "bot@exsisto.ai"], check=True)
    subprocess.run(["git", "add", "public/demos/"], check=True)
    result = subprocess.run(["git", "diff", "--staged", "--quiet"])
    if result.returncode == 0:
        print("No changes to commit.")
        return
    subprocess.run(["git", "commit", "-m", message], check=True)
    subprocess.run(["git", "push"], check=True)
    print("✅ Changes pushed to GitHub")

# ── Main ───────────────────────────────────────────────────────────────────

def main():
    # Allow targeting specific demos: python generate_demo_images.py dental auto
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(DEMOS.keys())
    print(f"\n🍌 Nano Banana Demo Image Generator")
    print(f"   Targets: {', '.join(targets)}\n")

    for demo_name in targets:
        if demo_name not in DEMOS:
            print(f"⚠️  Unknown demo: {demo_name}, skipping")
            continue

        demo = DEMOS[demo_name]
        html_path = demo["html_path"]
        print(f"\n{'='*50}")
        print(f"  Demo: {demo_name.upper()} ({html_path})")
        print(f"{'='*50}")

        for slot in demo["slots"]:
            slot_name = slot["name"]
            prompt = slot["prompt"]
            print(f"\n  [{slot_name}]")
            print(f"  Prompt: {prompt[:80]}...")

            try:
                # 1. Generate
                print(f"  🍌 Generating...")
                img_bytes, mime = generate_image(prompt)
                print(f"  ✅ Generated: {len(img_bytes)//1024}KB ({mime})")

                # 2. Upload
                print(f"  ☁️  Uploading to Supabase...")
                public_url = upload_to_supabase(img_bytes, mime, demo_name, slot_name)
                print(f"  ✅ URL: {public_url}")

                # 3. Patch HTML
                patch_html(html_path, slot_name, public_url, demo_name)

                # Small delay between generations
                time.sleep(2)

            except Exception as e:
                print(f"  ❌ Failed on {demo_name}/{slot_name}: {e}")
                print(f"  Continuing with next slot...")
                continue

    # Push all changes at once
    print(f"\n{'='*50}")
    print("  Pushing patched HTML files to GitHub...")
    git_push("🍌 Replace Unsplash placeholders with Nano Banana images in demo sites")
    print("\n🎉 Done! Demo sites now use real AI-generated images.\n")

if __name__ == "__main__":
    main()

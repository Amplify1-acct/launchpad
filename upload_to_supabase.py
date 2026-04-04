#!/usr/bin/env python3
"""
Upload Nano Banana images from GitHub to Supabase Storage (industry-images bucket)
Randomizes which image is served per slot by naming them hero_1.png, hero_2.png etc.
"""

import json, base64, urllib.request, urllib.error, os, sys, time

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ.get("GITHUB_REPOSITORY", "Amplify1-acct/launchpad")
BUCKET = "industry-images"

# Map industry → slots (hero, card1, card2 etc.)
# Each industry now has 5 images numbered 01-05
INDUSTRIES = [
    "auto", "dental", "gym", "hvac", "law",
    "pet", "plumbing", "realestate", "restaurant",
    "salon", "landscaping", "bakery"
]

SLOT_NAMES = ["hero", "card1", "card2", "card3", "card4"]


def download_from_github(industry: str, img_num: int) -> bytes | None:
    """Download image bytes from GitHub raw URL"""
    # Try jpg first, then png
    for ext in ["jpg", "png"]:
        url = f"https://raw.githubusercontent.com/{REPO}/main/public/images/{industry}/{industry}_{img_num:02d}.{ext}"
        req = urllib.request.Request(url, headers={
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/octet-stream"
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status == 200:
                    data = r.read()
                    print(f"    ↓ Downloaded {industry}_{img_num:02d}.{ext} ({len(data)//1024}KB)")
                    return data, ext
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
        except Exception as e:
            print(f"    ⚠️ Download error: {e}")
    return None, None


def upload_to_supabase(image_bytes: bytes, path: str, ext: str) -> bool:
    """Upload image to Supabase Storage"""
    mime = "image/jpeg" if ext == "jpg" else "image/png"
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    req = urllib.request.Request(url, data=image_bytes, method="POST", headers={
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": mime,
        "x-upsert": "true"
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"    ❌ Upload failed {path}: {e.code} — {body[:100]}")
        return False


def main():
    target = sys.argv[1:] if len(sys.argv) > 1 else INDUSTRIES
    print(f"📤 Supabase Image Uploader")
    print(f"Bucket: {BUCKET}")
    print(f"Industries: {', '.join(target)}")
    print("=" * 60)

    total_uploaded = 0

    for industry in target:
        print(f"\n🏭 [{industry.upper()}]")

        for img_num in range(1, 6):  # images 01-05
            img_bytes, ext = download_from_github(industry, img_num)
            if not img_bytes:
                print(f"    ⏭️  No image {img_num:02d} found, skipping")
                continue

            # Map image number to slot name
            slot = SLOT_NAMES[img_num - 1] if img_num <= len(SLOT_NAMES) else f"extra_{img_num}"

            # Upload with numbered path so we keep all variants
            # Primary slot path (what the app currently uses)
            primary_path = f"{industry}/{slot}.png"
            # Also upload numbered variant for future random selection
            numbered_path = f"{industry}/{slot}_{img_num}.png"

            success1 = upload_to_supabase(img_bytes, primary_path, ext)
            success2 = upload_to_supabase(img_bytes, numbered_path, ext)

            if success1 or success2:
                total_uploaded += 1
                print(f"    ✅ {industry}/{slot} (+ numbered variant)")
            
            time.sleep(0.5)  # small pause between uploads

    print(f"\n✅ Done! Uploaded {total_uploaded} images to Supabase Storage.")
    print(f"App will now use new images for all new site builds.")


if __name__ == "__main__":
    main()

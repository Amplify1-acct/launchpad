#!/usr/bin/env python3
"""
Upload Nano Banana images from GitHub to Supabase Storage (industry-images bucket).
Detects existing variants and appends new ones — never overwrites.
Naming: hero.png, hero_1.png, hero_2.png, hero_3.png ...
"""

import json, base64, urllib.request, urllib.error, os, sys, time, re

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ.get("GITHUB_REPOSITORY", "Amplify1-acct/launchpad")
BUCKET = "industry-images"

INDUSTRIES = [
    "auto", "dental", "gym", "hvac", "law",
    "pet", "plumbing", "realestate", "restaurant",
    "salon", "landscaping", "bakery"
]

SLOT_NAMES = ["hero", "card1", "card2", "card3", "card4"]


def list_existing(industry: str) -> list:
    """List all files currently in Supabase for this industry"""
    url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}"
    req = urllib.request.Request(url,
        data=json.dumps({"prefix": f"{industry}/", "limit": 100}).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            files = json.loads(r.read())
            return [f["name"] for f in files if f.get("name")]
    except Exception as e:
        print(f"    ⚠️ Could not list existing files: {e}")
        return []


def next_variant_number(existing: list, slot: str) -> int:
    """
    Find the next available variant number for a slot.
    hero.png = variant 0, hero_1.png = 1, hero_2.png = 2, etc.
    Returns the next unused number.
    """
    used = set()
    for name in existing:
        # Match hero.png (variant 0)
        if name == f"{slot}.png":
            used.add(0)
        # Match hero_N.png
        m = re.match(rf"^{re.escape(slot)}_(\d+)\.png$", name)
        if m:
            used.add(int(m.group(1)))
    # Find next unused
    n = 0
    while n in used:
        n += 1
    return n


def download_from_github(industry: str, img_num: int):
    """Download image bytes from GitHub"""
    for ext in ["jpg", "png"]:
        url = f"https://raw.githubusercontent.com/{REPO}/main/public/images/{industry}/{industry}_{img_num:02d}.{ext}"
        req = urllib.request.Request(url, headers={
            "Authorization": f"token {GITHUB_TOKEN}",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status == 200:
                    data = r.read()
                    print(f"    ↓ {industry}_{img_num:02d}.{ext} ({len(data)//1024}KB)")
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
    print(f"📤 Supabase Image Uploader (append mode)")
    print(f"Bucket: {BUCKET}")
    print(f"Industries: {', '.join(target)}")
    print("=" * 60)

    total_uploaded = 0
    variant_summary = {}

    for industry in target:
        print(f"\n🏭 [{industry.upper()}]")

        # Get existing files in Supabase for this industry
        existing = list_existing(industry)
        print(f"    Existing files: {sorted(existing)}")

        for img_num in range(1, 6):  # images 01-05
            img_bytes, ext = download_from_github(industry, img_num)
            if not img_bytes:
                print(f"    ⏭️  No image {img_num:02d} found")
                continue

            slot = SLOT_NAMES[img_num - 1] if img_num <= len(SLOT_NAMES) else f"card{img_num}"
            variant_num = next_variant_number(existing, slot)

            # Build filename
            if variant_num == 0:
                filename = f"{slot}.png"
            else:
                filename = f"{slot}_{variant_num}.png"

            path = f"{industry}/{filename}"
            success = upload_to_supabase(img_bytes, path, ext)

            if success:
                existing.append(filename)  # track locally
                total_uploaded += 1
                print(f"    ✅ Uploaded as: {path}")
                # Track max variant for summary
                if industry not in variant_summary:
                    variant_summary[industry] = {}
                variant_summary[industry][slot] = variant_num + 1  # total count

            time.sleep(0.5)

    print(f"\n✅ Done! Uploaded {total_uploaded} images.")
    print(f"\n📊 Variant counts per slot (update SLOT_VARIANT_COUNT to these values):")
    if variant_summary:
        # Find max variant count across all industries
        slot_max = {}
        for industry, slots in variant_summary.items():
            for slot, count in slots.items():
                slot_max[slot] = max(slot_max.get(slot, 1), count)
        for slot in SLOT_NAMES:
            print(f"  {slot}: {slot_max.get(slot, '(unchanged)')}")
    else:
        print("  No new images uploaded")


if __name__ == "__main__":
    main()

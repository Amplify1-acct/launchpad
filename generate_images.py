#!/usr/bin/env python3
"""
Nano Banana 2.0 Image Library Generator
Uses gemini-3.1-flash-image-preview, saves files via git (not GitHub API)
"""

import json, base64, urllib.request, urllib.error, time, os, sys, subprocess

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
MODEL = "gemini-3.1-flash-image-preview"

INDUSTRIES = {
    "auto": [
        "Photorealistic exterior of a modern auto repair shop with cars parked outside, bright daylight, clean professional setting, no text no signs no letters",
        "Photorealistic mechanic in uniform working on a car engine in a well-lit garage, professional setting, no text no letters",
        "Photorealistic gleaming car on a lift in a well-lit auto shop, professional garage environment, no text no letters",
        "Photorealistic automotive technician in uniform smiling next to a repaired vehicle, natural light, no text no letters",
        "Photorealistic wide shot of a modern car service bay with multiple vehicles, overhead lighting, no text no letters",
    ],
    "dental": [
        "Photorealistic modern dental office reception area, clean white walls, comfortable chairs, natural light, no text no letters",
        "Photorealistic dental treatment room with modern equipment, bright clinical lighting, spotless surfaces, no text no letters",
        "Photorealistic person with a bright confident smile, warm natural lighting, professional portrait, no text no letters",
        "Photorealistic smiling female dentist in scrubs, clean clinical background, professional headshot, no text no letters",
        "Photorealistic modern dental office exterior, welcoming entrance, blue sky, no text no signs no letters",
    ],
    "gym": [
        "Photorealistic modern gym interior with treadmills and weight equipment, bright lighting, no people, no text no letters",
        "Photorealistic person lifting weights in a well-lit gym, focus and determination, action shot, no text no letters",
        "Photorealistic group fitness class with instructor in a bright studio, energetic atmosphere, no text no letters",
        "Photorealistic close-up of dumbbells on a rack, clean polished metal, professional product shot, no text no letters",
        "Photorealistic exterior of a modern fitness center building, large windows, daytime, no text no signs no letters",
    ],
    "hvac": [
        "Photorealistic HVAC technician in uniform on a rooftop servicing an AC unit, clear blue sky, no text no letters",
        "Photorealistic modern HVAC unit on the side of a house, clean landscaping, suburban, no text no letters",
        "Photorealistic home interior with a modern thermostat on the wall, comfortable living room, no text no letters",
        "Photorealistic HVAC technician inspecting ductwork in a home, professional uniform, no text no letters",
        "Photorealistic technician installing HVAC components, professional setting, clean work environment, no text no letters",
    ],
    "law": [
        "Photorealistic elegant law office interior with bookshelves full of law books, leather chairs, warm lighting, no text no letters",
        "Photorealistic confident attorney in a suit at a mahogany desk, professional office, no text no letters",
        "Photorealistic exterior of a professional law firm building, classical architecture, blue sky, no text no signs no letters",
        "Photorealistic gavel on a wooden surface with scales of justice in soft focus background, no text no letters",
        "Photorealistic two attorneys reviewing documents at a conference table, professional attire, bright office, no text no letters",
    ],
    "pet": [
        "Photorealistic happy golden retriever being groomed at a professional pet salon, clean white grooming table, no text no letters",
        "Photorealistic veterinarian in white coat gently examining a cat, clean clinic background, no text no letters",
        "Photorealistic modern pet store interior with colorful displays of pet supplies, clean and organized, no text no letters",
        "Photorealistic dog trainer working with a German Shepherd in a bright outdoor training area, sunny day, no text no letters",
        "Photorealistic puppy and kitten together on a soft white background, adorable portrait, no text no letters",
    ],
    "plumbing": [
        "Photorealistic plumber in uniform working under a kitchen sink, tools laid out neatly, professional, no text no letters",
        "Photorealistic new chrome plumbing fixtures being installed, clean bathroom background, no text no letters",
        "Photorealistic plumbing service truck parked outside a suburban home, daytime, no text no logos no letters",
        "Photorealistic plumber inspecting a water heater in a utility room, professional uniform, no text no letters",
        "Photorealistic modern bathroom with pristine fixtures, interior design quality photo, no text no letters",
    ],
    "realestate": [
        "Photorealistic beautiful suburban home exterior at golden hour, manicured lawn, real estate listing quality, no text no letters",
        "Photorealistic modern open concept living room, staging quality, bright natural light, no people, no text no letters",
        "Photorealistic real estate agent in professional attire standing in front of a sold home, smiling, no text no letters",
        "Photorealistic aerial view of a residential neighborhood with tree-lined streets, clear sunny day, no text no letters",
        "Photorealistic luxury kitchen with marble countertops and stainless appliances, professional staging, no text no letters",
    ],
    "restaurant": [
        "Photorealistic upscale restaurant interior with candlelit tables, warm ambiance, empty dining room, no text no letters",
        "Photorealistic chef in white uniform plating a gourmet dish in a professional kitchen, no text no letters",
        "Photorealistic beautifully presented gourmet meal on a white plate, food photography quality, no text no letters",
        "Photorealistic restaurant exterior at night with warm glowing windows, welcoming entrance, no text no signs no letters",
        "Photorealistic busy restaurant dining room with guests enjoying meals, warm lighting, no text no letters",
    ],
    "salon": [
        "Photorealistic modern hair salon interior with styling chairs and mirrors, clean and bright, no people, no text no letters",
        "Photorealistic hairstylist cutting a client's hair, professional salon setting, warm lighting, no text no letters",
        "Photorealistic hair coloring process in a salon, vibrant colors, professional technique, no text no letters",
        "Photorealistic woman with a stunning fresh blowout hairstyle, portrait style, soft studio lighting, no text no letters",
        "Photorealistic nail technician doing a manicure, close-up of hands, clean salon setting, no text no letters",
    ],
    "landscaping": [
        "Photorealistic professional landscaper mowing a perfectly manicured lawn, sunny suburban neighborhood, no text no letters",
        "Photorealistic beautifully landscaped backyard garden with flowers and trimmed hedges, golden hour, no text no letters",
        "Photorealistic landscaping crew planting flowers at a commercial property, professional uniforms, no text no letters",
        "Photorealistic hands planting flowers in rich dark soil, gardening gloves, natural light, no text no letters",
        "Photorealistic stunning front yard with professional landscaping, curb appeal, blue sky, no text no letters",
    ],
    "bakery": [
        "Photorealistic bakery display case filled with artisan breads and pastries, warm lighting, no text no letters",
        "Photorealistic baker in white apron removing fresh bread from oven, steam rising, no text no letters",
        "Photorealistic assorted freshly baked pastries and croissants, food photography quality, no text no letters",
        "Photorealistic cozy bakery interior with rustic wooden shelves and baked goods, warm atmosphere, no text no letters",
        "Photorealistic baker decorating a wedding cake in a professional kitchen, no text no letters",
    ],
}


def gemini_generate_image(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["image", "text"]}
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        result = json.loads(resp.read())
    for part in result["candidates"][0]["content"]["parts"]:
        if part.get("inlineData"):
            return part["inlineData"]["data"], part["inlineData"]["mimeType"]
    raise ValueError("No image in response")


def git_setup():
    subprocess.run(["git", "config", "user.email", "nanobanana@exsisto.ai"], check=True)
    subprocess.run(["git", "config", "user.name", "Nano Banana 2.0"], check=True)


def git_commit_push(message):
    subprocess.run(["git", "add", "-A"], check=True)
    result = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if result.stdout.strip():
        subprocess.run(["git", "commit", "-m", message], check=True)
        subprocess.run(["git", "push"], check=True)
        print(f"  📤 Committed & pushed")
    else:
        print(f"  ℹ️  Nothing to commit")


def get_manifest():
    path = "public/images/manifest.json"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {}


def save_manifest(manifest):
    path = "public/images/manifest.json"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2)


def main():
    target = sys.argv[1:] if len(sys.argv) > 1 else list(INDUSTRIES.keys())
    print(f"🍌 Nano Banana 2.0 — Exsisto Image Generator")
    print(f"Model: {MODEL}")
    print(f"Industries: {', '.join(target)}")
    print("=" * 60)

    git_setup()
    manifest = get_manifest()
    total = 0

    for industry in target:
        if industry not in INDUSTRIES:
            print(f"⚠️  Unknown industry: {industry}, skipping")
            continue

        prompts = INDUSTRIES[industry]
        print(f"\n📸 [{industry.upper()}] — {len(prompts)} images")
        urls = []

        for i, prompt in enumerate(prompts):
            print(f"  {i+1}/{len(prompts)}: generating...")
            try:
                img_b64, mime_type = gemini_generate_image(prompt)
                ext = "jpg" if "jpeg" in mime_type else mime_type.split("/")[-1]
                img_path = f"public/images/{industry}/{industry}_{i+1:02d}.{ext}"
                os.makedirs(os.path.dirname(img_path), exist_ok=True)
                with open(img_path, "wb") as f:
                    f.write(base64.b64decode(img_b64))
                raw_url = f"https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/{img_path}"
                urls.append(raw_url)
                total += 1
                print(f"  ✅ Saved: {img_path}")
                time.sleep(3)
            except Exception as e:
                print(f"  ❌ Failed image {i+1}: {e}")
                time.sleep(5)

        manifest[industry] = urls
        save_manifest(manifest)
        git_commit_push(f"🍌 Add {industry} images ({len(urls)}/{len(prompts)})")

    print(f"\n✅ Complete! Generated {total} images across {len(target)} industries.")


if __name__ == "__main__":
    main()

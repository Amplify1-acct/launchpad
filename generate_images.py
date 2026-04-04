#!/usr/bin/env python3
"""
Nano Banana 2.0 Image Library Generator
Runs in GitHub Actions - generates photorealistic industry images via Gemini
and commits them directly to the repo.
"""

import json
import base64
import urllib.request
import urllib.error
import time
import os
import sys

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ.get("GITHUB_REPOSITORY", "Amplify1-acct/launchpad")
BRANCH = "main"
MODEL = "gemini-2.0-flash-preview-image-generation"

INDUSTRIES = {
    "auto": [
        "Photorealistic exterior of a modern auto repair shop with cars parked outside, bright daylight, clean professional setting, no text no signs no letters",
        "Photorealistic mechanic in uniform working on a car engine in a well-lit garage, professional setting, no text",
        "Photorealistic gleaming car on a lift in a well-lit auto shop, professional garage environment, no text",
        "Photorealistic automotive technician in uniform smiling next to a repaired vehicle, natural light, no text",
        "Photorealistic wide shot of a modern car service bay with multiple vehicles, overhead lighting, no text",
    ],
    "dental": [
        "Photorealistic modern dental office reception area, clean white walls, comfortable chairs, natural light, no text",
        "Photorealistic dental treatment room with modern equipment, bright clinical lighting, spotless surfaces, no text",
        "Photorealistic person with a bright confident smile, warm natural lighting, professional portrait, no text",
        "Photorealistic smiling female dentist in scrubs, clean clinical background, professional headshot, no text",
        "Photorealistic modern dental office exterior, welcoming entrance, blue sky, no text no signs",
    ],
    "gym": [
        "Photorealistic modern gym interior with treadmills and weight equipment, bright lighting, no people, no text",
        "Photorealistic person lifting weights in a well-lit gym, focus and determination, action shot, no text",
        "Photorealistic group fitness class with instructor in a bright studio, energetic atmosphere, no text",
        "Photorealistic close-up of dumbbells on a rack, clean polished metal, professional product shot, no text",
        "Photorealistic exterior of a modern fitness center building, large windows, daytime, no text no signs",
    ],
    "hvac": [
        "Photorealistic HVAC technician in uniform on a rooftop servicing an AC unit, clear blue sky, no text",
        "Photorealistic modern HVAC unit on the side of a house, clean landscaping, suburban, no text",
        "Photorealistic home interior with a modern thermostat on the wall, comfortable living room, no text",
        "Photorealistic HVAC technician inspecting ductwork in a home, professional uniform, no text",
        "Photorealistic technician installing HVAC components, professional setting, clean work environment, no text",
    ],
    "law": [
        "Photorealistic elegant law office interior with bookshelves full of law books, leather chairs, warm lighting, no text",
        "Photorealistic confident attorney in a suit at a mahogany desk, professional office, no text",
        "Photorealistic exterior of a professional law firm building, classical architecture, blue sky, no text no signs",
        "Photorealistic gavel on a wooden surface with scales of justice in soft focus background, no text",
        "Photorealistic two attorneys reviewing documents at a conference table, professional attire, bright office, no text",
    ],
    "pet": [
        "Photorealistic happy golden retriever being groomed at a professional pet salon, clean white grooming table, no text",
        "Photorealistic veterinarian in white coat gently examining a cat, clean clinic background, no text",
        "Photorealistic modern pet store interior with colorful displays of pet supplies, clean and organized, no text",
        "Photorealistic dog trainer working with a German Shepherd in a bright outdoor training area, sunny day, no text",
        "Photorealistic puppy and kitten together on a soft white background, adorable portrait, no text",
    ],
    "plumbing": [
        "Photorealistic plumber in uniform working under a kitchen sink, tools laid out neatly, professional, no text",
        "Photorealistic new chrome plumbing fixtures being installed, clean bathroom background, no text",
        "Photorealistic plumbing service truck parked outside a suburban home, daytime, no text no logos",
        "Photorealistic plumber inspecting a water heater in a utility room, professional uniform, no text",
        "Photorealistic modern bathroom with pristine fixtures, interior design quality photo, no text",
    ],
    "realestate": [
        "Photorealistic beautiful suburban home exterior at golden hour, manicured lawn, real estate listing quality, no text",
        "Photorealistic modern open concept living room, staging quality, bright natural light, no people, no text",
        "Photorealistic real estate agent in professional attire standing in front of a sold home, smiling, no text",
        "Photorealistic aerial view of a residential neighborhood with tree-lined streets, clear sunny day, no text",
        "Photorealistic luxury kitchen with marble countertops and stainless appliances, professional staging, no text",
    ],
    "restaurant": [
        "Photorealistic upscale restaurant interior with candlelit tables, warm ambiance, empty dining room, no text",
        "Photorealistic chef in white uniform plating a gourmet dish in a professional kitchen, no text",
        "Photorealistic beautifully presented gourmet meal on a white plate, food photography quality, no text",
        "Photorealistic restaurant exterior at night with warm glowing windows, welcoming entrance, no text no signs",
        "Photorealistic busy restaurant dining room with guests enjoying meals, warm lighting, no text",
    ],
    "salon": [
        "Photorealistic modern hair salon interior with styling chairs and mirrors, clean and bright, no people, no text",
        "Photorealistic hairstylist cutting a client's hair, professional salon setting, warm lighting, no text",
        "Photorealistic hair coloring process in a salon, vibrant colors, professional technique, no text",
        "Photorealistic woman with a stunning fresh blowout hairstyle, portrait style, soft studio lighting, no text",
        "Photorealistic nail technician doing a manicure, close-up of hands, clean salon setting, no text",
    ],
    "landscaping": [
        "Photorealistic professional landscaper mowing a perfectly manicured lawn, sunny suburban neighborhood, no text",
        "Photorealistic beautifully landscaped backyard garden with flowers and trimmed hedges, golden hour, no text",
        "Photorealistic landscaping crew planting flowers at a commercial property, professional uniforms, no text",
        "Photorealistic hands planting flowers in rich dark soil, gardening gloves, natural light, no text",
        "Photorealistic stunning front yard with professional landscaping, curb appeal, blue sky, no text",
    ],
    "bakery": [
        "Photorealistic bakery display case filled with artisan breads and pastries, warm lighting, no text",
        "Photorealistic baker in white apron removing fresh bread from oven, steam rising, no text",
        "Photorealistic assorted freshly baked pastries and croissants, food photography quality, no text",
        "Photorealistic cozy bakery interior with rustic wooden shelves and baked goods, warm atmosphere, no text",
        "Photorealistic baker decorating a wedding cake in a professional kitchen, no text",
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


def github_get_file(path):
    url = f"https://api.github.com/repos/{REPO}/contents/{path}?ref={BRANCH}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            content = base64.b64decode(data["content"].replace("\n","")).decode("utf-8")
            return content, data["sha"]
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None, None
        raise


def github_put_file(path, content_bytes, message, sha=None):
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    payload = {
        "message": message,
        "content": base64.b64encode(content_bytes).decode(),
        "branch": BRANCH
    }
    if sha:
        payload["sha"] = sha
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="PUT", headers={
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def get_manifest():
    content, sha = github_get_file("public/images/manifest.json")
    if content:
        return json.loads(content), sha
    return {}, None


def save_manifest(manifest, sha):
    content = json.dumps(manifest, indent=2).encode()
    result = github_put_file(
        "public/images/manifest.json",
        content,
        "🍌 Update image manifest [Nano Banana]",
        sha
    )
    return result


def main():
    target = sys.argv[1:] if len(sys.argv) > 1 else list(INDUSTRIES.keys())
    print(f"🍌 Nano Banana 2.0 — Exsisto Image Generator")
    print(f"Model: {MODEL}")
    print(f"Industries: {', '.join(target)}")
    print("=" * 60)

    manifest, manifest_sha = get_manifest()
    print(f"Manifest loaded. Industries already in manifest: {list(manifest.keys())}")

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
                img_bytes = base64.b64decode(img_b64)
                _, existing_sha = github_get_file(img_path)
                github_put_file(img_path, img_bytes, f"🍌 Add {industry} image {i+1}", existing_sha)
                raw_url = f"https://raw.githubusercontent.com/{REPO}/{BRANCH}/{img_path}"
                urls.append(raw_url)
                total += 1
                print(f"  ✅ {img_path}")
                time.sleep(3)
            except Exception as e:
                print(f"  ❌ Failed image {i+1}: {e}")
                time.sleep(5)

        manifest[industry] = urls
        result = save_manifest(manifest, manifest_sha)
        # refresh SHA
        _, manifest_sha = github_get_file("public/images/manifest.json")
        print(f"  💾 Manifest saved for {industry} ({len(urls)}/{len(prompts)} images)")

    print(f"\n✅ Complete! Generated {total} images across {len(target)} industries.")


if __name__ == "__main__":
    main()

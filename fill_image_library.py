#!/usr/bin/env python3
"""
Fill the Exsisto industry image library.
Generates about.png + img3-img7.png for each industry using Nano Banana,
uploads to Supabase at industry-images/{industry}/{slot}.png
Skips slots that already exist.
"""
import base64, urllib.request, urllib.error, json, time, os, sys

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]
BUCKET         = "industry-images"
MODEL          = "gemini-3.1-flash-image-preview"

# Slots to fill (hero already exists for all industries)
SLOTS = ["about", "img3", "img4", "img5", "img6", "img7"]

PROMPTS = {
    "automotive": [
        "Photorealistic mechanic in uniform smiling at camera in a clean auto shop, professional portrait, no text no letters",
        "Photorealistic car engine bay being serviced, clean professional garage, tools visible, no text no letters",
        "Photorealistic car on a hydraulic lift in a bright modern auto shop, no text no letters",
        "Photorealistic close-up of hands working on brake system, professional setting, no text no letters",
        "Photorealistic exterior of a modern auto repair shop daytime, clean signage area, no text no letters",
        "Photorealistic row of cars parked outside a professional auto service center, suburban setting, no text no letters",
    ],
    "plumbing": [
        "Photorealistic plumber in uniform smiling at camera, clean white background, professional portrait, no text no letters",
        "Photorealistic plumber fixing pipes under a kitchen sink, professional uniform, no text no letters",
        "Photorealistic new water heater installation in a clean utility room, professional work, no text no letters",
        "Photorealistic plumber using pipe wrench on copper pipes, professional close-up, no text no letters",
        "Photorealistic clean modern bathroom with new fixtures installed, bright natural light, no text no letters",
        "Photorealistic plumbing van parked outside a suburban house, sunny day, no text no letters",
    ],
    "hvac": [
        "Photorealistic HVAC technician in uniform smiling at camera, rooftop background, professional portrait, no text no letters",
        "Photorealistic technician installing an indoor HVAC unit, clean modern home interior, no text no letters",
        "Photorealistic modern thermostat on a clean white wall in a bright living room, no text no letters",
        "Photorealistic HVAC technician inspecting ductwork, professional uniform, no text no letters",
        "Photorealistic clean modern home interior with visible HVAC vents, comfortable and bright, no text no letters",
        "Photorealistic HVAC service van parked outside a suburban home, sunny day, no text no letters",
    ],
    "landscaping": [
        "Photorealistic landscaper in uniform smiling at camera, green lawn background, professional portrait, no text no letters",
        "Photorealistic worker operating a professional lawn mower on a lush green lawn, no text no letters",
        "Photorealistic beautifully landscaped front yard with flowers and shrubs, suburban home, no text no letters",
        "Photorealistic gardener planting flowers in a garden bed, close-up professional work, no text no letters",
        "Photorealistic stone pathway through a professionally landscaped garden, no text no letters",
        "Photorealistic landscaping truck and trailer parked outside a house with green lawn, no text no letters",
    ],
    "dental": [
        "Photorealistic friendly dentist in scrubs smiling at camera, clean clinical background, professional portrait, no text no letters",
        "Photorealistic dental hygienist working with patient, modern dental chair, professional setting, no text no letters",
        "Photorealistic bright clean dental treatment room, modern equipment, white walls, no text no letters",
        "Photorealistic person with a beautiful bright smile, warm natural lighting, no text no letters",
        "Photorealistic modern dental office waiting room, comfortable chairs, natural light, no text no letters",
        "Photorealistic dental office exterior, welcoming entrance, blue sky, no text no signs no letters",
    ],
    "roofing": [
        "Photorealistic roofer in safety gear smiling at camera, blue sky background, professional portrait, no text no letters",
        "Photorealistic roofer installing new shingles on a roof, bright sunny day, no text no letters",
        "Photorealistic newly completed roof on a suburban home, clean and professional, no text no letters",
        "Photorealistic close-up of professional shingle installation, quality workmanship, no text no letters",
        "Photorealistic roofing crew working on a residential roof, sunny day, no text no letters",
        "Photorealistic roofing company truck parked outside a house, suburban setting, no text no letters",
    ],
    "electrical": [
        "Photorealistic electrician in uniform smiling at camera, professional portrait, no text no letters",
        "Photorealistic electrician working on a breaker panel, professional uniform, safety gear, no text no letters",
        "Photorealistic clean new electrical panel installation, organized wiring, no text no letters",
        "Photorealistic electrician installing an outlet in a modern home, professional close-up, no text no letters",
        "Photorealistic bright modern kitchen with new lighting fixtures, no text no letters",
        "Photorealistic electrical service van parked outside a suburban home, sunny day, no text no letters",
    ],
    "cleaning": [
        "Photorealistic professional cleaner in uniform smiling at camera, clean home background, no text no letters",
        "Photorealistic cleaning professional wiping down a kitchen counter, supplies visible, no text no letters",
        "Photorealistic sparkling clean modern bathroom, gleaming surfaces, bright lighting, no text no letters",
        "Photorealistic cleaning team working in a bright open living room, professional uniforms, no text no letters",
        "Photorealistic spotless clean kitchen after professional cleaning, bright natural light, no text no letters",
        "Photorealistic professional cleaning company van parked outside a house, sunny day, no text no letters",
    ],
    "painting": [
        "Photorealistic painter in uniform smiling at camera, paint supplies in background, professional portrait, no text no letters",
        "Photorealistic professional painter applying paint to a wall with a roller, clean technique, no text no letters",
        "Photorealistic freshly painted bright living room, clean walls, modern home interior, no text no letters",
        "Photorealistic painter cutting in around trim with a brush, close-up professional work, no text no letters",
        "Photorealistic beautifully painted home exterior, crisp clean lines, sunny day, no text no letters",
        "Photorealistic painting company truck with ladders outside a house, suburban setting, no text no letters",
    ],
    "restaurant": [
        "Photorealistic friendly chef in uniform smiling at camera, professional kitchen background, no text no letters",
        "Photorealistic beautifully plated food dish on a clean white plate, restaurant setting, no text no letters",
        "Photorealistic warm inviting restaurant interior, ambient lighting, set tables, no text no letters",
        "Photorealistic chef cooking in a professional kitchen, action shot, no text no letters",
        "Photorealistic fresh ingredients on a wooden cutting board, professional food photography, no text no letters",
        "Photorealistic restaurant exterior at dusk, warm lights glowing, inviting atmosphere, no text no signs no letters",
    ],
    "moving": [
        "Photorealistic moving crew in uniform smiling at camera, moving truck in background, professional portrait, no text no letters",
        "Photorealistic professional movers carefully carrying boxes into a home, no text no letters",
        "Photorealistic movers loading furniture into a large moving truck, sunny day, no text no letters",
        "Photorealistic carefully packed moving boxes stacked neatly, professional packing, no text no letters",
        "Photorealistic movers carrying a couch through a doorway, professional technique, no text no letters",
        "Photorealistic large moving truck parked outside a suburban home, sunny day, no text no letters",
    ],
}

def slot_exists(industry: str, slot: str) -> bool:
    url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{industry}/{slot}.png"
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except:
        return False

def generate_image(prompt: str) -> tuple[bytes, str]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["image", "text"]},
    }).encode()
    req = urllib.request.Request(url, data=body, method="POST",
          headers={"Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.loads(r.read())
            for part in data["candidates"][0]["content"]["parts"]:
                if "inlineData" in part:
                    mime = part["inlineData"]["mimeType"]
                    b64  = part["inlineData"]["data"]
                    return base64.b64decode(b64), mime
            raise Exception("No image in response")
        except Exception as e:
            if attempt == 2:
                raise
            print(f"    Retry {attempt+1}/3 after error: {e}")
            time.sleep(8)
    raise Exception("All retries failed")

def upload(img_bytes: bytes, mime: str, industry: str, slot: str) -> str:
    path = f"{industry}/{slot}.png"
    url  = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    req  = urllib.request.Request(url, data=img_bytes, method="POST",
           headers={"Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": mime, "x-upsert": "true"})
    with urllib.request.urlopen(req, timeout=60) as r:
        r.read()
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"

def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(PROMPTS.keys())
    print(f"🍌 Industry Library Fill — {len(targets)} industries × {len(SLOTS)} slots")
    total = skipped = failed = 0

    for industry in targets:
        if industry not in PROMPTS:
            print(f"⚠️  Unknown: {industry}")
            continue
        prompts = PROMPTS[industry]
        print(f"\n📸 {industry.upper()}")
        for i, slot in enumerate(SLOTS):
            if slot_exists(industry, slot):
                print(f"  ⏭  {slot} already exists — skipping")
                skipped += 1
                continue
            prompt = prompts[i] if i < len(prompts) else prompts[-1]
            print(f"  🎨 Generating {slot}...")
            try:
                img_bytes, mime = generate_image(prompt)
                url = upload(img_bytes, mime, industry, slot)
                print(f"  ✅ {slot} → {url}")
                total += 1
                time.sleep(4)  # Rate limit buffer
            except Exception as e:
                print(f"  ❌ {slot} failed: {e}")
                failed += 1
                time.sleep(6)

    print(f"\n✅ Done: {total} generated, {skipped} skipped, {failed} failed")

if __name__ == "__main__":
    main()

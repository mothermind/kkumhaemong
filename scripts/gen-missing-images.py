#!/usr/bin/env python3
"""
Generate images for slugs that have content but no images.
Uses Imagen 4 API via Google Generative Language API.
Reads research files for context, builds prompts, saves PNGs + manifests.

Usage: source ~/.zshrc && python3 scripts/gen-missing-images.py [--dry-run]
"""
import json
import base64
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

DRY_RUN = "--dry-run" in sys.argv
BASE = Path("/Users/llnormll/WorkSpace/my-fortune-site")
CONTENT_DIR = BASE / "data" / "content"
IMAGE_DIR = BASE / "data" / "images"
PUBLIC_DIR = BASE / "public" / "images" / "dreams"
RESEARCH_DIR = BASE / "data" / "research"

MODEL = "imagen-4.0-generate-001"
STYLE_SUFFIX = "soft ink-wash watercolor illustration, Korean traditional painting aesthetic (한국화), dreamlike atmospheric mist, no text, no people, no typography"

# Get API key
api_key = os.environ.get("GOOGLE_API_KEY", "")
if not api_key and not DRY_RUN:
    print("ERROR: GOOGLE_API_KEY not found. Run: source ~/.zshrc", file=sys.stderr)
    sys.exit(1)

API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:predict?key={api_key}"


def find_missing_slugs():
    """Find content slugs that have no image folder."""
    content_slugs = set()
    for cat_dir in CONTENT_DIR.iterdir():
        if not cat_dir.is_dir():
            continue
        for f in cat_dir.glob("*.json"):
            content_slugs.add(f.stem)
    image_slugs = set(d.name for d in IMAGE_DIR.iterdir() if d.is_dir()) if IMAGE_DIR.exists() else set()
    return sorted(content_slugs - image_slugs)


def load_research(slug):
    """Find and load research file for a slug."""
    for cat_dir in RESEARCH_DIR.iterdir():
        if not cat_dir.is_dir():
            continue
        research_file = cat_dir / f"{slug}.json"
        if research_file.exists():
            with open(research_file) as f:
                return json.load(f)
    return None


def build_prompts(slug, research):
    """Build hero/auspicious/inauspicious prompts from research data."""
    name_ko = research.get("symbol", {}).get("korean", slug)
    name_en = research.get("symbol", {}).get("english", slug.replace("-dream", "").replace("-", " ").title())
    summary_en = research.get("summary", {}).get("english", "")

    # Extract auspicious/inauspicious context from interpretations
    auspicious_ctx = ""
    inauspicious_ctx = ""
    for interp in research.get("interpretations", []):
        if interp.get("type") == "길몽" and not auspicious_ctx:
            auspicious_ctx = interp.get("english", "")[:100]
        elif interp.get("type") == "흉몽" and not inauspicious_ctx:
            inauspicious_ctx = interp.get("english", "")[:100]

    hero_prompt = (
        f"A dreamlike scene featuring {name_en.lower()} as the central symbol, "
        f"set in a misty Korean landscape, ethereal and atmospheric, "
        f"muted earth tones with subtle golden highlights, {STYLE_SUFFIX}"
    )

    auspicious_prompt = (
        f"An auspicious, blessed scene related to {name_en.lower()} in Korean dream interpretation, "
        f"warm golden morning light, sense of fortune and prosperity, "
        f"traditional Korean setting with symbols of good luck, "
        f"warm amber and gold tones, {STYLE_SUFFIX}"
    )

    inauspicious_prompt = (
        f"A foreboding, cautionary scene related to {name_en.lower()} in Korean dream interpretation, "
        f"dim moonlight, cool shadows, sense of unease and warning, "
        f"traditional Korean setting with somber atmosphere, "
        f"deep indigo and slate tones, {STYLE_SUFFIX}"
    )

    return {
        "name_ko": name_ko,
        "name_en": name_en,
        "hero": hero_prompt,
        "auspicious": auspicious_prompt,
        "inauspicious": inauspicious_prompt,
    }


def generate_image(prompt, aspect_ratio="4:3"):
    """Call Imagen 4 API and return image bytes."""
    payload = json.dumps({
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": aspect_ratio}
    }).encode()

    req = urllib.request.Request(
        API_URL, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())

    if "predictions" in data and data["predictions"]:
        return base64.b64decode(data["predictions"][0]["bytesBase64Encoded"])
    raise RuntimeError(f"No predictions in response: {json.dumps(data)[:200]}")


def process_slug(slug):
    """Generate all 3 images + manifest for one slug."""
    research = load_research(slug)
    if not research:
        print(f"  SKIP {slug}: no research file")
        return False

    prompts = build_prompts(slug, research)
    out_dir = PUBLIC_DIR / slug
    manifest_dir = IMAGE_DIR / slug

    if DRY_RUN:
        print(f"  [DRY RUN] {slug}: {prompts['name_en']}")
        for img_type in ["hero", "auspicious", "inauspicious"]:
            print(f"    {img_type}: {prompts[img_type][:80]}...")
        return True

    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_dir.mkdir(parents=True, exist_ok=True)

    image_specs = [
        ("hero", "16:9", out_dir / "hero.png"),
        ("auspicious", "4:3", out_dir / "auspicious.png"),
        ("inauspicious", "4:3", out_dir / "inauspicious.png"),
    ]

    for img_type, aspect, out_path in image_specs:
        if out_path.exists():
            print(f"    {img_type}: already exists, skipping")
            continue
        print(f"    Generating {img_type}...")
        try:
            img_bytes = generate_image(prompts[img_type], aspect)
            with open(out_path, "wb") as f:
                f.write(img_bytes)
            print(f"    Saved {img_type}: {len(img_bytes)} bytes")
        except Exception as e:
            print(f"    ERROR {img_type}: {e}", file=sys.stderr)
            return False

    # Write manifest
    manifest = {
        "slug": slug,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "imagen-4-fast",
        "hero": {
            "path": f"/images/dreams/{slug}/hero.png",
            "alt_ko": f"{prompts['name_ko']} 해몽 - 꿈속 {prompts['name_ko']} 장면 일러스트",
            "alt_en": f"{prompts['name_en']} dream interpretation - dreamlike scene illustration",
            "prompt": prompts["hero"],
        },
        "sections": [
            {
                "type": "auspicious",
                "path": f"/images/dreams/{slug}/auspicious.png",
                "alt_ko": f"{prompts['name_ko']} 길몽 - 행운과 복을 암시하는 장면",
                "alt_en": f"{prompts['name_en']} auspicious dream - scene of fortune and blessing",
                "prompt": prompts["auspicious"],
            },
            {
                "type": "inauspicious",
                "path": f"/images/dreams/{slug}/inauspicious.png",
                "alt_ko": f"{prompts['name_ko']} 흉몽 - 경고와 주의를 암시하는 장면",
                "alt_en": f"{prompts['name_en']} inauspicious dream - scene of warning and caution",
                "prompt": prompts["inauspicious"],
            },
        ],
    }

    with open(manifest_dir / "manifest.json", "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"    Manifest written")
    return True


# Main
missing = find_missing_slugs()
print(f"Found {len(missing)} slugs missing images\n")

if DRY_RUN:
    print("=== DRY RUN MODE ===\n")

success = 0
fail = 0
for i, slug in enumerate(missing, 1):
    print(f"[{i}/{len(missing)}] {slug}")
    try:
        if process_slug(slug):
            success += 1
        else:
            fail += 1
    except Exception as e:
        print(f"  FAILED: {e}", file=sys.stderr)
        fail += 1

print(f"\n=== Done: {success} success, {fail} failed out of {len(missing)} ===")
sys.exit(0 if fail == 0 else 1)

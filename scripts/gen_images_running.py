#!/usr/bin/env python3
"""Generate images for running-dream using Imagen API."""
import json
import base64
import os
import sys
import urllib.request
import urllib.error

# Try to get API key from environment
api_key = os.environ.get('GOOGLE_API_KEY', '')

# If not in environment, try reading from a config file
if not api_key:
    config_paths = [
        os.path.expanduser('~/.config/google/api_key'),
        os.path.expanduser('~/google_api_key.txt'),
    ]
    for path in config_paths:
        if os.path.exists(path):
            with open(path) as f:
                api_key = f.read().strip()
            if api_key:
                break

if not api_key:
    print("ERROR: GOOGLE_API_KEY not found", file=sys.stderr)
    sys.exit(1)

MODEL = "imagen-4.0-generate-001"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:predict?key={api_key}"

OUTPUT_DIR = "/Users/llnormll/WorkSpace/my-fortune-site/public/images/dreams/running-dream"
os.makedirs(OUTPUT_DIR, exist_ok=True)

images = [
    {
        "name": "hero",
        "prompt": "A silhouette figure running freely across an open plain at golden hour, long grass swaying in wind, distant Korean mountains in background, soft ink-wash watercolor illustration, dreamlike motion blur suggesting speed and freedom, Korean traditional painting aesthetic, no text, warm amber and ochre tones, muted earth palette with golden highlights",
        "aspectRatio": "16:9",
        "output": f"{OUTPUT_DIR}/hero.png"
    },
    {
        "name": "auspicious",
        "prompt": "A figure running joyfully toward a bright radiant horizon, wind caught in flowing clothes, pink cherry blossoms swirling in the air, sense of freedom and forward momentum, warm golden morning light, Korean traditional watercolor illustration style, dreamlike atmosphere, soft brushwork, no text",
        "aspectRatio": "4:3",
        "output": f"{OUTPUT_DIR}/auspicious.png"
    },
    {
        "name": "inauspicious",
        "prompt": "A lone figure struggling to run with heavy legs unable to move forward, dark threatening shadows looming behind, night landscape with dim moonlight, cool blue-gray tones, traditional Korean ink-wash style, oppressive heavy atmosphere, sense of dread and stagnation, no text, somber mood",
        "aspectRatio": "4:3",
        "output": f"{OUTPUT_DIR}/inauspicious.png"
    }
]

results = {}
for img in images:
    print(f"Generating {img['name']}...")
    payload = json.dumps({
        "instances": [{"prompt": img["prompt"]}],
        "parameters": {"sampleCount": 1, "aspectRatio": img["aspectRatio"]}
    }).encode()

    req = urllib.request.Request(
        BASE_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        if 'predictions' in data and data['predictions']:
            img_bytes = base64.b64decode(data['predictions'][0]['bytesBase64Encoded'])
            with open(img['output'], 'wb') as f:
                f.write(img_bytes)
            print(f"  Saved {img['name']}: {len(img_bytes)} bytes -> {img['output']}")
            results[img['name']] = True
        else:
            print(f"  ERROR {img['name']}: {json.dumps(data)}", file=sys.stderr)
            results[img['name']] = False
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP ERROR {img['name']}: {e.code} {body[:200]}", file=sys.stderr)
        results[img['name']] = False
    except Exception as e:
        print(f"  ERROR {img['name']}: {e}", file=sys.stderr)
        results[img['name']] = False

print("\nResults:", results)
all_ok = all(results.values())
sys.exit(0 if all_ok else 1)

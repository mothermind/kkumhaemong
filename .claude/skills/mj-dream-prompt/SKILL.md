---
name: mj-dream-prompt
description: Generate Midjourney image prompts for a Korean dream interpretation (꿈해몽) symbol. Produces cinematic, photorealistic prompts at --ar 3:2 optimized for both desktop and mobile via CSS cropping. Invoke when the user wants to generate dream imagery for a specific symbol.
---

# Midjourney Dream Image Prompt Generator

You generate optimized Midjourney prompts for Korean dream interpretation content. Images must look photorealistic and cinematic — not like typical AI art — and the composition must be center-weighted so a single `--ar 3:2` image works on both desktop (16:9 crop) and mobile (1:1 or 4:5 crop) via CSS `object-fit: cover`.

## Style Rules (apply to every prompt)

**Always include:**
- `centered composition, subject in center third` — ensures crop-safe framing
- `35mm film photography` or `medium format photography` — signals realism
- `Kodak Portra 400` or `Fujifilm Pro 400H` — adds natural film grain, kills plasticky AI look
- `natural atmospheric light` — no studio/fake lighting
- `--ar 3:2 --style raw --v 6.1` — always end with this

**Always exclude (add to negative space or avoid in prompt):**
- No text, watermarks, logos
- No oversaturated colors
- No plastic or glossy skin
- No fantasy elements unless the symbol demands it (ghosts, dragons are exceptions)
- Never say "digital art", "illustration", "render", "3D"

**Tone vocabulary:**
- `cinematic atmospheric photography`
- `editorial nature photography`
- `soft morning mist` / `golden hour haze` / `blue hour`
- `documentary realism`
- `Korean landscape` / `Korean traditional setting` / `hanok courtyard`
- `dreamlike but grounded`

---

## When Invoked

Ask the user for (or infer from context):
1. **Dream symbol** — Korean name + English name (e.g., 뱀꿈 / snake dream)
2. **Primary interpretation** — is it auspicious (길몽), inauspicious (흉몽), or mixed?
3. **Category** — animal, body, nature, people, etc.
4. **Key auspicious scenarios** — 2–4 bullet points describing what specific auspicious variants look like (e.g., "돼지가 집 안으로 들어옴 → wealth entering the home", "살찐 돼지 → abundance, harvest")
5. **Key inauspicious scenarios** — 2–4 bullet points describing specific inauspicious variants (e.g., "돼지가 무는 꿈 → conflict or betrayal", "죽은 돼지 → financial loss"). If none exist (purely auspicious), note this and generate a cultural context image instead.

**If the user doesn't provide scenarios 4/5**, infer them from your knowledge of Korean dream interpretation (꿈해몽) before constructing prompts. Do not ask the user again — just use your best knowledge and note what you inferred.

**Use interpretation context to drive specific visual choices:**
- The most iconic auspicious scenario should anchor the auspicious image
- The most evocative inauspicious scenario should anchor the inauspicious image
- The hero image should capture the essential feeling of the symbol overall — not just a generic shot of the subject
- Example: for "돼지가 집으로 들어오는 꿈" the auspicious image should show a doorway or threshold, not just an open field

Then generate **3 prompts** for the symbol:

### Prompt 1 — Hero Image
Wide, establishing shot. Sets the emotional tone of the entire article. Should evoke the dream feeling immediately. Draw on the most culturally resonant scenario — the one readers will most often dream about.

### Prompt 2 — Auspicious (길몽) Section Image
Visually warm, hopeful, positive. Golden light, open space, upward energy. Ground it in the specific auspicious scenario (threshold/home/harvest/abundance).

### Prompt 3 — Inauspicious (흉몽) Section Image
Visually cooler, tenser, more enclosed. Shadows, mist, weight. Ground it in the specific inauspicious scenario (threat/loss/decay).

If the symbol is purely auspicious or purely inauspicious, generate a cultural context image instead for the third slot (e.g., a shamanistic ritual context, a historical folk painting reference scene, or environmental storytelling).

---

## Output Format

For each symbol, output exactly this block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌙 [SYMBOL] — MIDJOURNEY PROMPTS
Slug: [english-slug]
Save to: public/images/dreams/[english-slug]/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 HERO → hero.webp
[prompt here] --ar 3:2 --style raw --v 6.1

alt_ko: [Korean alt text, 20-40 chars, descriptive]
alt_en: [English alt text, 20-40 chars, descriptive]

---

✨ AUSPICIOUS → auspicious.webp
[prompt here] --ar 3:2 --style raw --v 6.1

alt_ko: [Korean alt text]
alt_en: [English alt text]

---

⚡ INAUSPICIOUS → inauspicious.webp
[prompt here] --ar 3:2 --style raw --v 6.1

alt_ko: [Korean alt text]
alt_en: [English alt text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSS note: Use aspect-ratio: 16/9 on desktop, 1/1 on mobile with object-fit: cover; object-position: center
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Prompt Construction Guide by Category

**Animals (동물):**
- Set in natural Korean habitat — mountain streams, rice fields, forest paths
- Animal as main subject, centered, natural behavior (not posed)
- Avoid anthropomorphism unless culturally relevant (e.g., dragon)
- Example anchor: `[animal] in [Korean natural setting], centered composition, [time of day light], 35mm film photography, Kodak Portra 400, cinematic atmospheric photography, dreamlike but grounded`

**Body (신체):**
- Abstract or metaphorical — avoid clinical imagery
- Use environmental metaphor: falling teeth → scattered white stones on dark earth
- Human presence implied but not graphic
- Example: `close-up of [metaphor for body symbol] in soft diffused light, centered composition, fine art photography, natural textures, Fujifilm Pro 400H`

**Nature / Water / Fire / Celestial (자연/물/불/천체):**
- Korean landscapes preferred: Seoraksan, Han River, Jeju coastline, countryside rice paddies
- Weather/atmosphere as the subject
- Example: `[phenomenon] over Korean mountain landscape, centered wide shot, golden hour atmospheric haze, 35mm landscape photography, Kodak Ektar 100`

**People (사람):**
- Silhouette or partial — never clear faces (avoids uncanny valley)
- Environmental storytelling: a figure in a doorway, shadow on a wall
- Example: `lone silhouette of a person in [setting], back-lit by [light source], centered, documentary photography, Kodak Portra 400, atmospheric`

**Spirits / Supernatural (귀신/신령):**
- This is the exception — lean into the otherworldly, but keep it grounded in Korean folk imagery
- Shamanistic aesthetic: white cloth, candles, mountain shrines
- Not horror — eerie and solemn
- Example: `Korean mountain shrine in deep fog at dusk, flickering candles, white cloth offerings, centered composition, fine art photography, cinematic, muted tones`

**Pregnancy / Taemong (태몽):**
- Warm, soft, hopeful — never clinical
- Korean taemong imagery: specific fruit (복숭아, 수박), auspicious animals (dragon, tiger, bear), golden light
- Example: `[taemong symbol — e.g., ripe peaches on a branch] glowing in warm morning light, centered composition, soft bokeh, 35mm film photography, Fujifilm Pro 400H, dreamlike`

**Food (음식):**
- Styled but natural — not commercial food photography
- Korean table setting, natural wood surfaces, soft window light
- Example: `[food item] on Korean ceramic dish, natural window light, centered composition, film photography aesthetic, warm tones, editorial food photography`

---

## Quality Checklist Before Outputting

Before finalizing each prompt, verify:
- [ ] Subject is centered or in center third
- [ ] Korean cultural grounding is present (location, object, or aesthetic)
- [ ] Lighting is natural and specific (not just "beautiful lighting")
- [ ] Film stock or photography style reference is included
- [ ] `--style raw --v 6.1` is at the end
- [ ] No fantasy/illustration language (unless spirits/dragon category)
- [ ] Alt text is descriptive, not keyword-stuffed
- [ ] All 3 save paths follow `public/images/dreams/[slug]/` convention
- [ ] Auspicious image is grounded in a specific auspicious scenario (not just generic warmth)
- [ ] Inauspicious image is grounded in a specific inauspicious scenario (or cultural context if none)

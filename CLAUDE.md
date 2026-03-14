# 꿈해몽 (Korean Dream Interpretation Site) — Project Guide

## Project Overview

A comprehensive bilingual (Korean + English) Korean dream interpretation website. Revenue model is display advertising (Google AdSense + Kakao AdFit). The site covers all 꿈해몽 scenarios — from high-volume symbols (돼지꿈, 뱀꿈) down to long-tail variations.

**Core philosophy**: Quality over volume. Each published page is a complete, well-structured article with proper editorial flow, relevant imagery, and deep cultural context — not just SEO-stuffed text. Build the pipeline right, then let it run autonomously to produce a few excellent articles at a time.

**Goal**: Become the most authoritative and well-designed 꿈해몽 resource on the web, winning both Naver and Google through content depth and user experience.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16 (App Router) | React 19, React Compiler enabled |
| Language | TypeScript | strict mode |
| Styling | Tailwind CSS v4 | mobile-first |
| Hosting | Vercel Hobby | Migrating FROM Cloudflare Workers — see Open Decisions |
| i18n | `next-intl` | `/[locale]/` route prefix |
| Package manager | npm | |

**Important**: Running on Firebase (Storage + Firestore) + Vercel Hobby. Images are in Firebase Storage (`gs://my-fortune-site.firebasestorage.app`, asia-northeast3). Content JSON is in Firestore (collection: `dreams`, doc ID = english slug). `src/lib/content.ts` reads from Firestore via Admin SDK (`src/lib/firestore.ts`). `fs/promises` stays for taxonomy files only. Never use `fs` in client components or non-server code.

---

## Commands

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # start production server
npm run lint     # ESLint
```

---

## Architecture

### URL Structure

Locale-prefixed routing:

```
/ko/꿈해몽/뱀꿈          ← Korean page (Naver + Google KR)
/en/dream/snake           ← English page (Google international)
```

- Language toggle navigates between locale equivalents — does NOT swap in-place
- Every URL is fully indexable with its own metadata
- `hreflang` links ko ↔ en on every page

### Route Structure ✅ Implemented

```
src/
├── middleware.ts                        ← next-intl locale detection + redirect
├── i18n/
│   ├── routing.ts                       ← locales, defaultLocale, pathnames map
│   ├── request.ts                       ← getRequestConfig (messages loader)
│   └── navigation.ts                    ← locale-aware Link, useRouter, usePathname
├── app/
│   ├── layout.tsx                       ← root passthrough (locale layout owns html/body)
│   ├── globals.css                      ← Tailwind + :lang(ko) word-break rules
│   ├── sitemap.ts                       ← /sitemap.xml with all ko + en URLs
│   ├── robots.ts                        ← /robots.txt (includes Naver Yeti bot)
│   └── [locale]/
│       ├── layout.tsx                   ← Noto Sans KR + Geist, NextIntlProvider, Header/Footer
│       ├── page.tsx                     ← homepage: hero bg + search + chips + popular list
│       ├── dream/[slug]/page.tsx        ← full article: hero, sections, FAQ, related
│       ├── category/[category]/page.tsx ← category symbol listing (legacy)
│       └── explore/
│           ├── page.tsx                 ← explorer: category grid (emoji + name + count)
│           └── [category]/page.tsx      ← category listing: subcategory filter pills + DreamCards
├── components/
│   ├── layout/   Header.tsx (logo=home + 탐색 link left, ThemeToggle+LanguageToggle right), Footer.tsx
│   ├── common/   AdSlot.tsx (placeholder, ready for AdSense)
│   ├── home/     SearchBar.tsx (client component)
│   ├── explore/  CategoryDreamList.tsx (client component, subcategory filter pills)
│   └── dream/    DreamHero, DreamSection, DreamVariations, DreamFAQ, RelatedDreams, DreamCard (blog-style)
├── lib/
│   ├── taxonomy.ts  ← server-only, fs/promises, reads data/taxonomy/*.json
│   ├── firestore.ts ← Firebase Admin SDK singleton (credentials from env vars)
│   └── content.ts   ← server-only, Firestore reads; exports getContent(), getContentPreviews(), getAvailableContentSlugs()
└── messages/
    ├── ko.json      ← Korean UI strings (nav, labels, footer — NOT article content)
    └── en.json      ← English UI strings
```

**Pathname mapping** (configured in `i18n/routing.ts`):
- `/dream/[slug]` → `/ko/꿈해몽/[koreanSlug]` and `/en/dream/[englishSlug]`
- `/category/[category]` → `/ko/카테고리/[category]` and `/en/category/[category]`
- `/explore` → `/ko/탐색` and `/en/explore`
- `/explore/[category]` → `/ko/탐색/[category]` and `/en/explore/[category]`

**Known issue**: Next.js 16 shows a deprecation warning — `middleware` file should be renamed to `proxy`. Non-breaking for now; rename when addressing other Next.js 16 migration items.

**Build status**: ✅ Clean build confirmed (`npm run build` passes with 0 errors).

### Mobile-First Requirements

- All layouts designed for mobile first, enhanced for desktop
- Touch-friendly navigation and language toggle
- Images use `next/image` with responsive sizing
- Ad slots use responsive AdSense/Kakao units — no fixed-width ad containers
- Core Web Vitals priority: LCP, CLS, INP all must be green

---

## Content Pipeline

### Philosophy

The pipeline is **autonomous but not rushed**. It processes one symbol at a time through all stages, producing a complete, publish-ready article with images before moving to the next. Quality gates at each stage.

### Pipeline Flow

```
[1] dream-taxonomy-agent
        ↓ builds data/taxonomy/*.json (run once, the master library)

[2] Symbol Selection
        ↓ pick next unprocessed symbol from taxonomy (high-tier first)

[3] dream-research-agent          [4] dream-image-agent
        ↓ deep research                  ↓ generate images in parallel
        data/research/{slug}.json        data/images/{slug}/

[5] dream-content-agent
        ↓ assemble full article using research + image paths
        data/content/{slug}.json

[6] Next.js renders published page
```

Steps 3 and 4 run in parallel. Step 5 waits for both.

### Article Structure (per page)

Each dream page is a proper editorial article:

```
1. Hero Image (dream-relevant, culturally appropriate illustration)
2. Title + summary badge (길몽/흉몽/중립)
3. Intro paragraph (what this dream means, hook)
4. Interpretation sections
   ├── 길몽 (Auspicious) — with supporting image
   ├── 흉몽 (Inauspicious) — with supporting image
   └── Contextual/Neutral
5. Cultural & Historical Context section
6. Variations (by color, action, quantity, situation)
   └── Each variation = own H3 + paragraph (long-tail SEO)
7. FAQ section (5–8 questions, structured data)
8. Related Dreams (internal links with thumbnails)
9. Conclusion
```

---

## Image Generation

### Strategy

Each dream article gets:
- **1 hero image** — wide, editorial, dream-like
- **1–2 section images** — supporting interpretations
- Consistent visual style across the site (Korean traditional + dream aesthetic)

### Image API

Provider priority (same pattern as TTS in hooks):
1. **DALL-E 3** (OpenAI) — highest quality, best prompt following
2. **Stable Diffusion** via Replicate — fallback if no OpenAI key

Images are stored at:
- `public/images/dreams/{slug}/hero.webp`
- `public/images/dreams/{slug}/auspicious.webp`
- `public/images/dreams/{slug}/inauspicious.webp`

Or in **Cloudflare R2** if the repo gets too large (preferred for production).

### Image Prompt Style

Prompts should produce: soft watercolor or ink-wash illustration style, dreamlike quality, Korean traditional aesthetic (한국화 inspired), no text in image, culturally appropriate symbolism.

Example for 뱀꿈: *"A coiled serpent resting on misty mountain rocks, soft ink-wash illustration style, Korean traditional painting aesthetic, dreamlike atmosphere, muted earth tones with subtle golden highlights, no text"*

---

## Agent System

### Agents (`.claude/agents/`)

| Agent | Model | Purpose |
|-------|-------|---------|
| `dream-taxonomy-agent` | Opus | Build the master taxonomy of all dream symbols |
| `dream-research-agent` | Sonnet | Deep research on one symbol (interpretations, variations, FAQs, cultural context) |
| `dream-content-agent` | Sonnet | Generate complete bilingual article from research + image data |
| `dream-image-agent` | Sonnet | Generate image prompts + call image API + save images |
| `content-validator-agent` | Sonnet | Proofread + validate existing content JSON files in place; writes audit report to `data/validation/` |
| `meta-agent` | Opus | Create new subagents |

### Running the Pipeline

**One-time setup:**
> "Run dream-taxonomy-agent to build the full taxonomy"

**Per article (run these together):**
> "Run dream-research-agent for [symbol]"
> "Run dream-image-agent for [symbol]" ← in parallel

**After both complete:**
> "Run dream-content-agent for [symbol]"

### Content Validation Pipeline

Validates and proofreads existing content; syncs only changed docs to Firestore.

```
[1] content-validator-agent
        ↓ reads data/content/{category}/{slug}.json
        ↓ fixes metaDescription lengths, prose tone in place
        ↓ writes data/validation/report-{category}-{batch}-{timestamp}.json

[2] scripts/fix-schema-issues.mjs  ← bulk structural fix (safe to re-run)
        ↓ renames content→body in sections/variations
        ↓ moves relatedDreams→seo.relatedSlugs
        node scripts/fix-schema-issues.mjs [--dry-run] [category]

[3] Review reports (optional)
        cat data/validation/report-*.json | jq '.summary'

[4] Sync to Firestore
        # If few files changed — use validation report:
        node scripts/sync-changed-to-firestore.mjs --latest [--dry-run]
        # If many files changed (>50%) — full re-upload is simpler:
        node scripts/migrate-content-to-firestore.mjs [--dry-run]
```

**Batch sizes:**
- Content generation agents: **6 max** in parallel (rate limit)
- Content validation agents: **10 max** in parallel (no API calls, CPU-bound only)
- Validator processes max 20 files per invocation — chunk large categories (actions: 8 runs, animals: 2 runs)

**metaDescription targets (correct values):**
- Korean: **80–110 chars** (Korean chars visually ~2x wide — do NOT use 120–160)
- English: **120–160 chars**

**Known schema bugs in Phase 1 content (now fixed):**
- `content` key instead of `body` in sections/variations — caused blank text rendering
- `relatedDreams` at root instead of `seo.relatedSlugs` — caused empty related dreams section
- Both fixed via `fix-schema-issues.mjs` across all 413 files (2026-03-14)

---

## Data Schemas

### Taxonomy Entry
```typescript
{
  id: string;
  korean: string;          // "뱀"
  english: string;         // "Snake"
  slug: string;            // "snake" — used in /en/ URLs
  koreanSlug: string;      // "뱀꿈" — used in /ko/ URLs
  category: string;        // "animals"
  subcategory: string;     // "reptiles"
  related: string[];       // slugs of related symbols
  searchTier: "high" | "medium" | "longtail";
  naverKeywords: string[];
  googleKeywords: string[];
}
```

### Research Entry (`data/research/{slug}.json`)
```typescript
{
  symbol: { korean: string; english: string; slug: string; };
  summary: { korean: string; english: string; };
  interpretations: Array<{
    type: "길몽" | "흉몽" | "neutral";
    korean: string; english: string; context: string;
  }>;
  variations: Array<{
    keyword_ko: string; keyword_en: string;
    interpretation_ko: string; interpretation_en: string;
  }>;
  culturalContext: { korean: string; english: string; };
  relatedSymbols: string[];
  seoKeywords: { korean: string[]; english: string[]; };
  faqs: Array<{
    question_ko: string; answer_ko: string;
    question_en: string; answer_en: string;
  }>;
}
```

### Image Manifest (`data/images/{slug}/manifest.json`)
```typescript
{
  slug: string;
  hero: { path: string; alt_ko: string; alt_en: string; prompt: string; };
  sections: Array<{
    type: "auspicious" | "inauspicious" | "context";
    path: string; alt_ko: string; alt_en: string; prompt: string;
  }>;
  generatedAt: string;
  provider: "dalle3" | "stable-diffusion";
}
```

### Content Entry (`data/content/{slug}.json`)
```typescript
{
  ko: {
    title: string; metaDescription: string; h1: string;
    intro: string;
    sections: Array<{ type: string; heading: string; body: string; imageRef?: string; }>;
    variations: Array<{ keyword: string; heading: string; body: string; }>;
    culturalContext: string;
    faqs: Array<{ question: string; answer: string; }>;
    conclusion: string;
  };
  en: { /* same structure */ };
  images: { hero: string; sections: Record<string, string>; };  // paths
  seo: {
    slug: string; koreanSlug: string;
    ogTitle: { ko: string; en: string; };
    ogDescription: { ko: string; en: string; };
    ogImage: string;
    structuredData: { faqSchema: object; articleSchema: object; };
    hreflang: { ko: string; en: string; };
    naverSEO: { blogPostTitle: string; tags: string[]; };
  };
}
```

---

## SEO Strategy

### Dual-Target: Google + Naver

| Platform | Approach |
|----------|----------|
| **Google** | Next.js metadata API, JSON-LD structured data, sitemap, hreflang, Core Web Vitals |
| **Naver** | Naver Webmaster Tools, `naverSEO` fields in content, Korean-natural writing, Naver Blog mirror strategy |

### Per-Page Checklist
- Title: `{symbol} 해몽 - {symbol}의 의미와 길흉 완벽 정리`
- Meta description: **KO 80–110 chars**, EN 120–160 chars, keyword-rich, natural (Korean chars are visually ~2x wide — 80–110 KO ≈ 160+ visual chars)
- FAQ JSON-LD (featured snippets + Naver Q&A)
- Article JSON-LD
- `hreflang` ko ↔ en
- Open Graph with `ogImage` (hero image)
- 800–1,500 words per language
- Internal links to ≥3 related dream symbols

---

## Hooks (`.claude/settings.json`)

| Hook | Script | Purpose |
|------|--------|---------|
| `PreToolUse` | `pre_tool_use.py` | Blocks `.env` access + dangerous `rm -rf` |
| `Stop` | `stop.py` | Logs to `logs/stop.json` |
| `SubagentStop` | `subagent_stop.py` | Logs to `logs/subagent_stop.json` |
| `Notification` | `notification.py` | Logs permission prompts |

All hooks are minimal — logging + security only, no TTS, no external API calls.

---

## Key Conventions

- **Never commit `.env`** — hook blocks it
- **Mobile-first always** — design for 375px width up
- **Korean content**: 해요체/합니다체, authoritative 꿈해몽 expert tone, not robotic
- **English content**: localize, don't translate — explain Korean cultural context for international readers
- **Images**: always use `next/image`, always provide `alt` in both languages, WebP format
- **No keyword stuffing** — write naturally; FAQ coverage drives rankings more than density
- **`server-only` on all lib files** — `src/lib/taxonomy.ts` and `src/lib/content.ts` import `"server-only"` to prevent accidental client-side use
- **Path sanitization in data loaders** — slugs are sanitized (`/[^a-zA-Z0-9_-]/g → ""`) before use as Firestore document IDs to prevent injection
- **Data files are read-only at runtime** — agents write to `data/` during generation; Next.js only reads
- **Custom agents must be invoked via general-purpose agent** — `.claude/agents/*.md` files are not directly usable as `subagent_type` in the Agent tool. To run one, read the agent's `.md` file and pass its instructions to a `general-purpose` agent with the appropriate model

---

## Current State (last updated: 2026-03-14)

### Infrastructure Migration — COMPLETE ✅
- **Firebase Storage**: All 404 slug image folders uploaded as WebP (was PNG, ~90% size reduction). Bucket: `my-fortune-site.firebasestorage.app` (asia-northeast3). Public URL: `https://storage.googleapis.com/my-fortune-site.firebasestorage.app/images/dreams/{slug}/{name}.webp`
- **Firestore**: 413 content docs in collection `dreams` (doc ID = english slug). `src/lib/content.ts` reads from Firestore via Admin SDK.
- **`public/images/dreams/`**: Added to `.gitignore`, removed from git tracking (795 MB freed)
- **Env vars required**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (set in `.env` locally, Vercel env vars for production)
- **`next.config.ts`**: `remotePatterns` added for `storage.googleapis.com`
- **Migration scripts**: `scripts/migrate-images-to-firebase.mjs`, `scripts/migrate-content-to-firestore.mjs`

### Content Pipeline Progress — PHASE 1 COMPLETE ✅
- **Total articles: 413** across all 24 categories (actions: 161, others: 9–10 each)
- Content files live in `data/content/{category}/{slug}.json` (also mirrored in Firestore)
- `crossing-river-dream` images fixed and uploaded ✅

### Content Validation — COMPLETE ✅ (2026-03-14)
All 413 content files validated and fixed across all 24 categories:
- **metaDescription lengths**: KO 80–110 chars, EN 120–160 chars (corrected from original wrong 120–160 KO target)
- **`content`→`body` key migration**: 315 files fixed — sections/variations now render correctly in `DreamSection`
- **`relatedDreams`→`seo.relatedSlugs` migration**: 315 files fixed — related dreams now display correctly
- **Firestore re-synced**: all 413 docs re-uploaded via `migrate-content-to-firestore.mjs`
- **Bulk fix script**: `scripts/fix-schema-issues.mjs` — reusable, safe to re-run (no-op on already-fixed files)

### Prose Quality Fixes — COMPLETE ✅ (2026-03-14)
Three rounds of prose cleanup applied to all content files:
- **`**bold**` markers stripped**: 19 files had `**bold**` markdown in section bodies — removed. `MarkdownBody` renders `<strong>` as gold-highlighted text (`bg-gold/10`), but bold openers were dropped as a style decision.
- **Em-dash cleanup**: 242 files had AI-style ` — ` (spaced em-dash) in Korean prose fields (intro, body, conclusion, faq answers). Replaced with `. `. English fields untouched. Script: `scripts/strip-em-dashes.mjs`
- **Cliffhanger rewrite**: 392 of 413 intros used the identical `그런데 한 가지—` transition. Rewrote all 392 using GPT-4o-mini with varied natural Korean alternatives. Script: `scripts/rewrite-cliffhanger.mjs` (dry-run + full mode, batch size 6). Content agent updated to ban this phrase with 6 varied alternatives.
- All changes synced to Firestore after each round.

### All 24 Categories — Research + Content Complete ✅
- actions: 161/161 ✅
- animals, body, celestial, clothing, colors, death: 10/10 ✅
- disasters: 9/10 ✅ (car-accident-dream canonical to actions)
- emotions, fire, food, insects, marriage, money, nature: 10/10 ✅
- numbers: 9/10 ✅ (winning-lottery-dream canonical to money)
- objects, people, places, plants, pregnancy, spirits, transportation, water, weather: 10/10 ✅

### Pipeline to run next articles
1. Content agent calls Imagen 4 (`imagen-4.0-generate-001`) via Google Generative Language API
2. `source ~/.zshrc` required in bash for GOOGLE_API_KEY
3. Batch size: **6 agents max** in parallel

---

## Open Decisions

- [x] ~~Domain name~~ → **kkumhaemong.com** purchased ✅
- [x] ~~Homepage redesign~~ → Hero image + searchbar + category chips + popular dreams list ✅
- [x] ~~Explorer UI~~ → `/explore` category grid + `/explore/[category]` with subcategory filter pills ✅
- [x] ~~Bash permission for subagents~~ → `Bash(*)` in `.claude/settings.json` allow list ✅
- [x] ~~Infrastructure migration~~ → Firebase Storage + Firestore + Vercel Hobby ✅
- [ ] **Deploy to Vercel**: Remove `@opennextjs/cloudflare`, connect repo, set Firebase env vars in Vercel dashboard
- [ ] Ad slot implementation: replace placeholder divs with real AdSense + Kakao AdFit units
- [ ] Naver Blog mirroring: manual vs semi-automated
- [ ] Rename `src/middleware.ts` → `src/proxy.ts` (Next.js 16 deprecation)

## Competitive Landscape

### Primary Competitor: kkumhaemong.co.kr
WordPress blog, 217+ pages, `.co.kr` domain (Naver advantage from domain age/region signal).

**Their weaknesses = our differentiators:**

| Factor | kkumhaemong.co.kr | kkumhaemong.com (us) |
|--------|-------------------|----------------------|
| Structure | Blog-style, all uncategorized | Category taxonomy, clean URL routing |
| Language | Korean only | Korean + English (hreflang) |
| SEO | Basic WordPress | Next.js metadata API, JSON-LD, sitemap |
| Cross-linking | None | Related dreams, category grids, internal links |
| Content depth | Single generic interpretation | 길몽/흉몽/neutral + variations + FAQ + cultural + western psychology |
| International reach | None | Google-targeted `/en/dream/[slug]` pages |
| UX | Generic OceanWP theme | Custom mobile-first design, Core Web Vitals priority |
| Religious bias | Heavy (Buddhist/Christian content skew) | Balanced folk tradition + secular psychology |

**Strategy:** Their 217 pages prove the niche has traffic. We win on depth-per-article (variations + FAQ + westernContext) which dominates long-tail queries, and on international reach which they have zero presence in. The `.co.kr` may outrank us on Naver initially due to domain age, but structured content + internal linking + English coverage should close the gap fast.

---

## Resolved Decisions

- ✅ URL structure: Option A — `/ko/꿈해몽/[koreanSlug]` + `/en/dream/[englishSlug]`
- ✅ i18n: `next-intl` v3 with App Router, `[locale]` segment, pathname localization
- ✅ Data loading: Firestore (content) + `fs/promises` (taxonomy only) — both `server-only`
- ✅ Fonts: Noto Sans KR (Korean locale) + Geist (English locale), applied via `font-[family-name:var()]`
- ✅ Language toggle: `Link` with `locale` prop (navigates to equivalent URL, not in-place swap)

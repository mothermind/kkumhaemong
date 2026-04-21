---
name: write
description: Ship a new kkumhaemong article end-to-end — research → images → content → validate → Firebase upload → Firestore → search index → commit → push. Triggers: "ship article", "publish dream article", "ship new kkumhaemong article", "run write pipeline", "꿈해몽 발행".
---

Run the full kkumhaemong publish pipeline. End-to-end: from picking a slug to the article being live on kkumhaemong.com.

**Target**: $ARGUMENTS

**The invoking session is the orchestrator.** Each pipeline stage is spawned as a separate Agent at the invoker's level — one layer only, which is reliable. Do NOT delegate orchestration downward to kkumhaemong-agent or any other sub-agent. The invoker runs each step directly. This constraint exists because sub-agents cannot spawn further sub-agents.

All absolute paths are under `$HOME/WorkSpace/my-fortune-site/`.

---

## Step 1 — Pick the target slug

- If `$ARGUMENTS` contains a specific slug (e.g., `snake-dream`), use that.
- If `$ARGUMENTS` contains a category name only (e.g., `animals`), pick any pending slug in that category.
- If `$ARGUMENTS` is empty, pick the highest-priority pending symbol from any category.

Pending = research file exists with no matching content file, OR no research file yet. Prioritize categories with the most pending work.

Use Bash with `find` on `$HOME/WorkSpace/my-fortune-site/data/research/` and `data/content/` to identify gaps. This is the only step the invoker executes directly (no agent spawn).

---

## Step 2 — Research + Images (parallel where possible)

**If research file already exists** (`data/research/{category}/{slug}.json`): skip research, spawn only the image agent.

**If research file does NOT exist**: spawn both in a SINGLE message so they run concurrently:

- Agent: `subagent_type: kkumhaemong-research-agent`, prompt: slug + category + Korean/English names from taxonomy
- Agent: `subagent_type: kkumhaemong-image-agent`, prompt: slug + category + Korean/English names

Wait for all reports before proceeding.

---

## Step 3 — Content generation

After research + images both report success:

- Agent: `subagent_type: kkumhaemong-content-agent`, prompt: slug + category

The content agent reads the research JSON and image manifest on its own — just pass the slug and category.

---

## Step 4 — Validation (QUALITY GATE)

After content generation reports success:

- Agent: `subagent_type: kkumhaemong-validator-agent`, prompt: the new content file path (`data/content/{category}/{slug}.json`)

**This is the hard gate.** Read the validator's report carefully.

- **If 0 schema errors and no critical prose issues** → proceed to Step 5.
- **If there are minor flags only** (e.g., metaDescription slightly outside range, westernContext slightly short) → record them in `validationFlags` and proceed to Step 5. Set `retried: false`.

### Failure classification and auto-retry

When the validator reports failures, classify them before deciding how to proceed:

**Structural / unfixable failures — HALT immediately, `status: fail`, `retried: false`:**
- Missing required fields (title, intro, sections, faqs, conclusion, etc.)
- Malformed or invalid JSON in the content file
- Missing research file (`data/research/{category}/{slug}.json` not found)
- Missing image manifest (`data/images/{slug}/manifest.json` not found)
- Image paths not resolving (Firebase URLs missing or placeholder-only)

Do NOT retry on structural failures. The content-agent cannot fix these without deeper intervention. Surface the validator report path and halt.

**Prose / SEO / voice failures — eligible for one auto-retry:**
- metaDescription length outside target range (KO: 80–110 chars, EN: 120–160 chars)
- Banned patterns detected (em-dashes in Korean prose, `**bold**` markdown in body, cliffhanger openers)
- Tone issues (robotic phrasing, keyword stuffing, formulaic section openers)
- Vague filler or thin content flagged by validator
- SEO flags (missing keywords, weak FAQ coverage)

On an eligible failure:

1. Note the absolute path to the validator's report JSON (written by the validator to `data/validation/`).
2. Re-invoke `kkumhaemong-content-agent` in **revision mode** with this exact prompt structure:

```
Revise the content file at data/content/{category}/{slug}.json to address
the validator flags in {path-to-report}.json.

Slug: {slug}
Category: {category}
Validation report: {absolute path to the report JSON written by validator}

Read the report first. Address each flagged issue explicitly. Preserve
unflagged fields as-is. Report which flags you addressed in your summary.
```

3. After the content-agent's revision pass completes, re-invoke `kkumhaemong-validator-agent` on the same content file. This second validation is authoritative:
   - **PASS** → set `retried: true`, proceed to Step 5.
   - **FAIL still** → HALT. Set `status: partial`, `retried: true`. Include both validator report paths (initial and retry) in the final report so the operator can see what did not converge. Do NOT attempt a second retry.

**Maximum one retry.** This is the first iteration of the retry pattern — keep it conservative.

---

## Step 5 — Upload images to Firebase Storage

Run the image migration script to convert PNGs to WebP and upload to Firebase Storage:

```bash
cd $HOME/WorkSpace/my-fortune-site && node scripts/migrate-images-to-firebase.mjs
```

This script:
- Scans `public/images/dreams/` for new/changed images
- Converts PNG → WebP (if not already WebP)
- Uploads to Firebase Storage (`my-fortune-site.firebasestorage.app`)
- Updates content JSON image paths to Firebase URLs

If the script fails, STOP and mark status as `fail`. Do not proceed to Firestore upload.

---

## Step 6 — Upload content to Firestore

Push the new content document to Firestore:

```bash
cd $HOME/WorkSpace/my-fortune-site && node scripts/migrate-content-to-firestore.mjs
```

This script:
- Reads all content JSON files in `data/content/`
- Pushes each as a Firestore document (collection: `dreams`, doc ID = english slug)
- Idempotent — safe to re-run

If the script fails, STOP and mark status as `fail`.

---

## Step 7 — Rebuild search index

Rebuild the search index so the new article appears in the homepage search:

```bash
cd $HOME/WorkSpace/my-fortune-site && node scripts/build-search-index.mjs
```

This writes to `public/search-index.json` — a static file that must be committed and pushed for the change to go live.

---

## Step 8 — Git commit and push

Stage all new/modified files and push to deploy:

```bash
cd $HOME/WorkSpace/my-fortune-site
git add data/content/{category}/{slug}.json
git add data/images/{slug}/manifest.json
git add public/search-index.json
git add -A public/images/dreams/{slug}/
git commit -m "feat: add {slug} ({category}) — research, images, content, validated

Co-Authored-By: MotherMind <mothermind@mother.dev>"
git push origin main
```

Vercel auto-deploys from the push. The article will be live at `https://www.kkumhaemong.com/ko/꿈해몽/{koreanSlug}` within minutes.

**Do NOT commit `.env`, `firebase-service-account.json`, or any file in `secrets/`.**

Capture the commit SHA from the `git commit` output for the Step 9 report.

---

## Step 9 — Report

Return a structured report for the invoking session to log. Format:

```json
{
  "slug": "{slug}",
  "category": "{category}",
  "status": "success | partial | fail",
  "commitSha": "{7-char sha or null if not pushed}",
  "retried": false,
  "validationFlags": [
    "metaDescription KO 115 chars (target 80-110)",
    "westernContext EN slightly short"
  ],
  "validationReports": [
    "data/validation/report-{category}-{slug}-{timestamp}.json"
  ],
  "filesCreated": [
    "data/research/{category}/{slug}.json",
    "data/images/{slug}/manifest.json",
    "public/images/dreams/{slug}/hero.webp",
    "public/images/dreams/{slug}/auspicious.webp",
    "public/images/dreams/{slug}/inauspicious.webp",
    "data/content/{category}/{slug}.json"
  ],
  "pendingCountRemaining": 42,
  "note": "Brief plain-text note — e.g. 'All stages green. Pushed to main, Vercel deploying.' or the reason for partial/fail."
}
```

Field rules:
- `status`: `success` = all 8 steps complete and pushed. `partial` = stopped at validation gate or a non-fatal issue. `fail` = a script or agent error aborted the pipeline.
- `commitSha`: 7-char short SHA from `git rev-parse --short HEAD` after push, or `null` if not committed.
- `retried`: `true` if the auto-retry path in Step 4 was triggered (prose/SEO failure → revision pass → re-validation). `false` otherwise (no failure, structural halt, or minor flags only).
- `validationFlags`: empty array `[]` if the validator raised no flags. List minor flags even when proceeding. On a retried run, list flags from the second (authoritative) report.
- `validationReports`: list of absolute paths to all validator report JSONs written during this run. One entry on a clean run; two entries when `retried: true` (initial report first, retry report second).
- `filesCreated`: list only files that were newly created in this run (skip pre-existing research file if Step 2 was skipped).
- `pendingCountRemaining`: count of slugs that have taxonomy entries but no content file yet. Use `find` on `data/content/` vs `data/taxonomy/` to compute, or approximate from previous counts if exact count is expensive.
- `note`: one sentence. Include commit SHA here too if pushed (redundant with `commitSha` but helpful for human-readable log lines).

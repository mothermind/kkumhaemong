#!/usr/bin/env node
// Bulk card generation — corpus-wide, language-aware, skips entries already in queue.
//
// Usage:
//   node scripts/generate-cards.mjs [options]
//     --limit N              Max cards to generate this run (default 10)
//     --locale ko|en         Language to generate (default ko)
//     --category <name>      Restrict to one category (optional)
//     --slug <slug>          Override: generate for a single slug, ignore other filters
//     --tier high|med|long   Restrict by searchTier (default: all, process high→med→long order)
//     --dry-run              Print what WOULD generate, don't write

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// --- arg parsing ---
const args = process.argv.slice(2);
const getArg = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const hasFlag = (flag) => args.includes(flag);

const LIMIT = parseInt(getArg("--limit", "10"), 10);
const LOCALE = getArg("--locale", "ko");
const CATEGORY_FILTER = getArg("--category");
const SLUG_OVERRIDE = getArg("--slug");
const TIER_FILTER = getArg("--tier");
const DRY_RUN = hasFlag("--dry-run");

if (!["ko", "en"].includes(LOCALE)) {
  console.error(`invalid locale: ${LOCALE} (must be ko or en)`);
  process.exit(1);
}
const TIER_ORDER = { high: 0, medium: 1, longtail: 2 };
const TIER_ALIASES = { med: "medium", long: "longtail", high: "high" };
const normalizedTier = TIER_FILTER ? (TIER_ALIASES[TIER_FILTER] || TIER_FILTER) : null;

// --- load queue — collect (slug, locale) pairs already present ---
const QUEUE_PATH = path.join(PROJECT_ROOT, "data/x-queue/queue.json");
const queue = fs.existsSync(QUEUE_PATH)
  ? JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"))
  : { entries: [] };

const inQueue = new Set(queue.entries.map((e) => `${e.slug}::${e.locale}`));

// --- load hook corpus — these are the candidate slugs ---
const HOOKS_DIR = path.join(PROJECT_ROOT, "data/x-queue/hooks");
if (!fs.existsSync(HOOKS_DIR)) {
  console.error(`hooks directory not found: ${HOOKS_DIR}`);
  process.exit(1);
}
const hookFiles = fs.readdirSync(HOOKS_DIR).filter((f) => f.endsWith(".json"));
const hookSlugs = hookFiles.map((f) => path.basename(f, ".json"));

// --- load taxonomy — slug → { category, searchTier, koreanSlug } ---
const TAXONOMY_DIR = path.join(PROJECT_ROOT, "data/taxonomy");
const taxonomyMap = new Map(); // slug → { category, searchTier, koreanSlug }

const taxFiles = fs.readdirSync(TAXONOMY_DIR).filter(
  (f) => f.endsWith(".json") && !f.startsWith("_") && f !== "canonical-map.json"
);
for (const tf of taxFiles) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(TAXONOMY_DIR, tf), "utf8"));
    const symbols = data.symbols || [];
    for (const sym of symbols) {
      if (sym.slug) {
        taxonomyMap.set(sym.slug, {
          category: sym.category || data.category || path.basename(tf, ".json"),
          searchTier: sym.searchTier || "longtail",
          koreanSlug: sym.koreanSlug || null,
        });
      }
    }
  } catch {
    // skip malformed taxonomy files
  }
}

// --- build candidate list ---
const IMAGE_EXTS = ["webp", "png", "jpg"];

const skipped = { queued: 0, noContent: 0, noHero: 0, tier: 0, category: 0 };
let candidates = [];

const slugsToProcess = SLUG_OVERRIDE ? [SLUG_OVERRIDE] : hookSlugs;

for (const slug of slugsToProcess) {
  // Category filter
  const taxEntry = taxonomyMap.get(slug);
  const category = taxEntry?.category || null;

  if (CATEGORY_FILTER && category !== CATEGORY_FILTER) {
    skipped.category++;
    continue;
  }

  // Tier filter
  if (normalizedTier && taxEntry?.searchTier !== normalizedTier) {
    skipped.tier++;
    continue;
  }

  // Already in queue check
  if (inQueue.has(`${slug}::${LOCALE}`)) {
    skipped.queued++;
    continue;
  }

  // Content existence check — look for data/content/{category}/{slug}.json
  // We need category to locate content; if taxonomy missing, try all category dirs
  let contentPath = null;
  if (category) {
    const candidate = path.join(PROJECT_ROOT, `data/content/${category}/${slug}.json`);
    if (fs.existsSync(candidate)) contentPath = candidate;
  }
  if (!contentPath) {
    // scan all category dirs
    const contentBase = path.join(PROJECT_ROOT, "data/content");
    const catDirs = fs.existsSync(contentBase) ? fs.readdirSync(contentBase) : [];
    for (const catDir of catDirs) {
      const c = path.join(contentBase, catDir, `${slug}.json`);
      if (fs.existsSync(c)) {
        contentPath = c;
        break;
      }
    }
  }
  if (!contentPath) {
    skipped.noContent++;
    continue;
  }

  // Hero image existence check
  const heroPath = IMAGE_EXTS
    .map((ext) => path.join(PROJECT_ROOT, `public/images/dreams/${slug}/hero.${ext}`))
    .find((p) => fs.existsSync(p));
  if (!heroPath) {
    skipped.noHero++;
    continue;
  }

  candidates.push({
    slug,
    category: category || path.dirname(contentPath).split(path.sep).pop(),
    searchTier: taxEntry?.searchTier || "longtail",
    contentPath,
  });
}

// --- order: high → medium → longtail, then alphabetical within tier ---
candidates.sort((a, b) => {
  const ta = TIER_ORDER[a.searchTier] ?? 2;
  const tb = TIER_ORDER[b.searchTier] ?? 2;
  if (ta !== tb) return ta - tb;
  return a.slug.localeCompare(b.slug);
});

// --- take first LIMIT ---
candidates = candidates.slice(0, LIMIT);

console.log(`\n=== generate-cards.mjs ===`);
console.log(`locale: ${LOCALE} | limit: ${LIMIT}${DRY_RUN ? " | DRY-RUN" : ""}`);
if (SLUG_OVERRIDE) console.log(`slug override: ${SLUG_OVERRIDE}`);
if (CATEGORY_FILTER) console.log(`category filter: ${CATEGORY_FILTER}`);
if (normalizedTier) console.log(`tier filter: ${normalizedTier}`);
console.log(`candidates after filters: ${candidates.length}`);
console.log(`skipped — already queued: ${skipped.queued}, no content: ${skipped.noContent}, no hero: ${skipped.noHero}, tier: ${skipped.tier}, category: ${skipped.category}`);
console.log();

if (candidates.length === 0) {
  console.log("nothing to generate.");
  process.exit(0);
}

if (DRY_RUN) {
  console.log("--- DRY-RUN: would generate ---");
  for (const c of candidates) {
    console.log(`  ${c.slug}  [${c.category}]  tier=${c.searchTier}`);
  }
  console.log(`\n${candidates.length} card(s) would be generated.`);
  process.exit(0);
}

// --- generate cards ---
let generated = 0;
let failed = 0;
const failLog = [];

for (const c of candidates) {
  const { slug, category } = c;
  console.log(`--- generating ${slug} [${LOCALE}] ---`);

  // Step 1: render card
  const renderCmd = `node ${path.join(PROJECT_ROOT, "scripts/render-x-card.mjs")} ${slug} ${category} 0 ${LOCALE}`;
  let renderOk = false;
  try {
    execSync(renderCmd, { cwd: PROJECT_ROOT, stdio: "inherit" });
    renderOk = true;
  } catch (err) {
    console.error(`  render FAILED for ${slug} [${LOCALE}] — skipping`);
    failLog.push({ slug, locale: LOCALE, stage: "render", error: String(err.message || err) });
    failed++;
    continue;
  }

  if (!renderOk) continue;

  // Step 2: queue entry
  const queueCmd = `node ${path.join(PROJECT_ROOT, "scripts/queue-post.mjs")} ${slug} ${category} ${LOCALE} 0`;
  try {
    execSync(queueCmd, { cwd: PROJECT_ROOT, stdio: "inherit" });
    generated++;
    console.log(`  queued: ${slug} [${LOCALE}]`);
  } catch (err) {
    console.error(`  queue FAILED for ${slug} [${LOCALE}]`);
    failLog.push({ slug, locale: LOCALE, stage: "queue", error: String(err.message || err) });
    failed++;
  }
  console.log();
}

// --- report ---
const totalPending = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8")).entries.filter((e) => e.status === "pending").length;

console.log(`\n=== done ===`);
console.log(`Generated: ${generated}  Failed: ${failed}`);
console.log(`Total pending in queue: ${totalPending}`);
console.log(`Est. days to post queue @ 3/day: ${(totalPending / 3).toFixed(1)}`);
if (failLog.length) {
  console.log(`\nFailures:`);
  for (const f of failLog) {
    console.log(`  ${f.slug} [${f.locale}] @ ${f.stage}: ${f.error.slice(0, 120)}`);
  }
}

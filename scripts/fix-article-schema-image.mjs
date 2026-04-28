/**
 * Fix stale seo.structuredData.articleSchema.image in Firestore docs (and local content files).
 *
 * The 2026-03-15 image migration updated seo.ogImage to the Firebase Storage URL but
 * missed the nested articleSchema.image field. This script patches it using the correct
 * Firebase Storage URL, sourced in priority order from:
 *   1. seo.ogImage       (most docs)
 *   2. images.hero       (fallback for docs where ogImage was never set)
 *
 * A doc is "affected" (needs patching) when articleSchema.image differs from the
 * correct Firebase Storage URL derived above.
 *
 * Usage:
 *   node scripts/fix-article-schema-image.mjs --dry-run   ← safe, no writes
 *   node scripts/fix-article-schema-image.mjs             ← live run
 */

import { readFile, writeFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const CONTENT_DIR = join(PROJECT_ROOT, "data/content");
const SERVICE_ACCOUNT_PATH = join(__dirname, "firebase-service-account.json");

const DRY_RUN = process.argv.includes("--dry-run");

// ── Firebase init ─────────────────────────────────────────────────────────────

const serviceAccount = JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const collection = db.collection("dreams");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive the correct Firebase Storage image URL for a doc.
 * Returns null if neither ogImage nor images.hero is available.
 */
function correctImageUrl(data) {
  // seo.ogImage is preferred
  if (data.seo?.ogImage) return data.seo.ogImage;
  // images.hero is the reliable fallback
  if (data.images?.hero) return data.images.hero;
  return null;
}

/**
 * Build a local content file index once: Map<slug, filePath>
 */
async function buildLocalIndex() {
  const index = new Map();
  let categories;
  try {
    categories = await readdir(CONTENT_DIR, { withFileTypes: true });
  } catch {
    return index; // data/content not present — skip local patching
  }
  for (const cat of categories.filter((e) => e.isDirectory())) {
    let files;
    try {
      files = await readdir(join(CONTENT_DIR, cat.name));
    } catch {
      continue;
    }
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      const slug = file.slice(0, -5);
      index.set(slug, join(CONTENT_DIR, cat.name, file));
    }
  }
  return index;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("fix-article-schema-image");
console.log(`  Collection : dreams`);
console.log(
  `  Mode       : ${DRY_RUN ? "DRY RUN — no writes" : "LIVE — will write to Firestore + local files"}`
);
console.log("");

if (!DRY_RUN) {
  console.log(
    "WARNING: Live mode will mutate Firestore docs and local content files."
  );
  console.log("         Re-run with --dry-run to preview changes first.");
  console.log("");
}

// Fetch all docs from Firestore
process.stdout.write("Fetching all docs from Firestore... ");
const snapshot = await collection.get();
console.log(`${snapshot.size} docs`);
console.log("");

let affected = 0;       // needs patching
let alreadyCorrect = 0; // articleSchema.image already matches correct URL
let noArticleSchema = 0; // articleSchema.image field missing entirely — skip
let noCorrectUrl = 0;   // cannot determine correct URL (no ogImage, no images.hero)
let noOgImageUsedHero = 0; // patching using images.hero fallback

const affectedDocs = [];   // { slug, oldImage, newImage }
const cannotFixDocs = [];  // { slug, artImage, note }

for (const docSnap of snapshot.docs) {
  const slug = docSnap.id;
  const data = docSnap.data();

  const artImage = data.seo?.structuredData?.articleSchema?.image;

  // Missing field entirely — separate concern, not our job
  if (artImage === undefined || artImage === null || artImage === "") {
    noArticleSchema++;
    continue;
  }

  const correct = correctImageUrl(data);

  // Cannot determine correct URL
  if (!correct) {
    noCorrectUrl++;
    cannotFixDocs.push({ slug, artImage, note: "no ogImage or images.hero" });
    continue;
  }

  // Already correct
  if (artImage === correct) {
    alreadyCorrect++;
    continue;
  }

  // Needs patching
  affected++;
  const usedHero = !data.seo?.ogImage && !!data.images?.hero;
  if (usedHero) noOgImageUsedHero++;
  affectedDocs.push({ slug, oldImage: artImage, newImage: correct });
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
);
console.log(`Affected (stale, will patch)       : ${affected}`);
console.log(
  `  of which patched via images.hero : ${noOgImageUsedHero} (no seo.ogImage, used images.hero fallback)`
);
console.log(`Already correct                    : ${alreadyCorrect}`);
console.log(`No articleSchema.image (skipped)   : ${noArticleSchema}`);
console.log(`No correct URL available (skipped) : ${noCorrectUrl}`);
console.log(`Total docs                         : ${snapshot.size}`);
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
);
console.log("");

// Sample 5 affected docs
const sample = affectedDocs.slice(0, 5);
if (sample.length > 0) {
  console.log("Sample changes (first 5):");
  for (const { slug, oldImage, newImage } of sample) {
    console.log(`  - ${slug}:`);
    console.log(`      before: ${oldImage}`);
    console.log(`      after : ${newImage}`);
  }
  console.log("");
}

// Cannot-fix anomalies
if (cannotFixDocs.length > 0) {
  console.log(`Cannot fix (${cannotFixDocs.length} docs — no source URL):`);
  for (const a of cannotFixDocs.slice(0, 10)) {
    console.log(`  - ${a.slug}: ${a.artImage}`);
  }
  if (cannotFixDocs.length > 10) {
    console.log(`  ... and ${cannotFixDocs.length - 10} more`);
  }
  console.log("");
}

if (DRY_RUN) {
  console.log("DRY RUN complete — Firestore was NOT modified.");
  console.log(`Run without --dry-run to apply ${affected} patches.`);
  process.exit(0);
}

// ── Live writes ───────────────────────────────────────────────────────────────

if (affected === 0) {
  console.log("Nothing to patch. Exiting.");
  process.exit(0);
}

console.log(`Patching ${affected} docs...`);
console.log("");

// Build local file index once
const localIndex = await buildLocalIndex();

const BATCH_SIZE = 100;
let patched = 0;
let localPatched = 0;
let localNotFound = 0;
let failed = 0;

// Backup affectedDocs to a timestamped JSON file for rollback safety
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const backupPath = join(__dirname, `_backup-articleSchema-image-${timestamp}.json`);
await writeFile(backupPath, JSON.stringify({
  ranAt: new Date().toISOString(),
  collection: "dreams",
  field: "seo.structuredData.articleSchema.image",
  count: affectedDocs.length,
  docs: affectedDocs,
}, null, 2) + "\n", "utf8");
console.log(`Backup written: ${backupPath}`);
console.log("");

for (let i = 0; i < affectedDocs.length; i += BATCH_SIZE) {
  const chunk = affectedDocs.slice(i, i + BATCH_SIZE);
  const batch = db.batch();

  for (const { slug, newImage } of chunk) {
    batch.update(collection.doc(slug), {
      "seo.structuredData.articleSchema.image": newImage,
    });
  }

  try {
    await batch.commit();
    patched += chunk.length;
    process.stdout.write(
      `  Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} docs)\n`
    );
  } catch (err) {
    console.error(`  Batch failed: ${err.message}`);
    failed += chunk.length;
    continue;
  }

  // Patch local files for the same chunk
  for (const { slug, newImage } of chunk) {
    const localPath = localIndex.get(slug);
    if (!localPath || !existsSync(localPath)) {
      localNotFound++;
      continue;
    }
    try {
      const raw = await readFile(localPath, "utf8");
      const doc = JSON.parse(raw);
      if (doc.seo?.structuredData?.articleSchema) {
        doc.seo.structuredData.articleSchema.image = newImage;
        await writeFile(localPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
        localPatched++;
      }
    } catch (err) {
      console.error(`  Local file patch failed [${slug}]: ${err.message}`);
    }
  }
}

console.log("");
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
);
console.log(`Firestore patched  : ${patched}`);
console.log(`Firestore failed   : ${failed}`);
console.log(`Local files patched: ${localPatched}`);
console.log(`Local files missing: ${localNotFound}`);
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
);

process.exit(failed > 0 ? 1 : 0);

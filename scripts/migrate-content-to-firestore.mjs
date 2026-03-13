/**
 * Migrate content JSONs to Firestore
 * Collection: "dreams", document ID: slug (e.g. "snake-dream")
 *
 * Usage:
 *   node scripts/migrate-content-to-firestore.mjs
 *   node scripts/migrate-content-to-firestore.mjs --dry-run
 *   node scripts/migrate-content-to-firestore.mjs --slug snake-dream
 */

import { readdir, readFile } from "fs/promises";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const CONTENT_DIR = join(PROJECT_ROOT, "data/content");
const SERVICE_ACCOUNT_PATH = join(__dirname, "firebase-service-account.json");

const DRY_RUN = process.argv.includes("--dry-run");
const SINGLE_SLUG = process.argv.includes("--slug")
  ? process.argv[process.argv.indexOf("--slug") + 1]
  : null;

// Firestore batch limit is 500 writes per batch
const BATCH_SIZE = 20;

// Initialize Firebase Admin
const serviceAccount = JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const collection = db.collection("dreams");

let uploaded = 0;
let skipped = 0;
let failed = 0;

async function getAllContentFiles() {
  const results = [];
  const categories = await readdir(CONTENT_DIR, { withFileTypes: true });
  for (const cat of categories.filter((e) => e.isDirectory())) {
    const files = await readdir(join(CONTENT_DIR, cat.name));
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      results.push({
        category: cat.name,
        slug: basename(file, ".json"),
        path: join(CONTENT_DIR, cat.name, file),
      });
    }
  }
  return results.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function migrateInBatches(files) {
  let batch = db.batch();
  let batchCount = 0;
  let batchNum = 1;

  for (const { category, slug, path } of files) {
    let data;
    try {
      const raw = await readFile(path, "utf8");
      data = JSON.parse(raw);
    } catch (err) {
      console.error(`❌ Invalid JSON [${slug}]: ${err.message}`);
      failed++;
      continue;
    }

    // Add category field so we can query by category later
    const doc = { ...data, category, slug };

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would write: dreams/${slug}`);
      uploaded++;
      continue;
    }

    batch.set(collection.doc(slug), doc);
    batchCount++;
    uploaded++;

    // Commit batch when full
    if (batchCount >= BATCH_SIZE) {
      process.stdout.write(`  Committing batch ${batchNum} (${batchCount} docs)... `);
      await batch.commit();
      console.log("✅");
      batch = db.batch();
      batchCount = 0;
      batchNum++;
    }
  }

  // Commit remaining
  if (batchCount > 0 && !DRY_RUN) {
    process.stdout.write(`  Committing batch ${batchNum} (${batchCount} docs)... `);
    await batch.commit();
    console.log("✅");
  }
}

// Main
console.log(`🚀 Firestore Content Migration`);
console.log(`   Collection: dreams`);
console.log(`   Batch size: ${BATCH_SIZE}`);
if (DRY_RUN) console.log(`   Mode: DRY RUN`);
if (SINGLE_SLUG) console.log(`   Slug: ${SINGLE_SLUG} only`);
console.log("");

let files = await getAllContentFiles();

if (SINGLE_SLUG) {
  files = files.filter((f) => f.slug === SINGLE_SLUG);
  if (files.length === 0) {
    console.error(`No content file found for slug: ${SINGLE_SLUG}`);
    process.exit(1);
  }
}

console.log(`📁 Found ${files.length} content files\n`);

// List all files being migrated
for (const { category, slug } of files) {
  console.log(`  ${category}/${slug}`);
}
console.log("");

await migrateInBatches(files);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done
   Uploaded: ${uploaded}
   Failed:   ${failed}
${DRY_RUN ? "\n⚠️  DRY RUN — nothing was written to Firestore" : ""}
`);

process.exit(0);

/**
 * Bulk schema migration for all content JSON files.
 *
 * Fixes two structural bugs introduced during content generation:
 *
 * 1. `content` key → `body` key in sections[] and variations[]
 *    DreamSection.tsx reads section.body, so `content` causes blank text rendering.
 *
 * 2. Root-level `relatedDreams` → `seo.relatedSlugs`
 *    RelatedDreams component reads seo.relatedSlugs, root-level key is ignored.
 *
 * Safe to re-run — already-fixed files are a no-op (no changes written).
 *
 * Usage:
 *   node scripts/fix-schema-issues.mjs             # fix all categories
 *   node scripts/fix-schema-issues.mjs --dry-run   # preview without writing
 *   node scripts/fix-schema-issues.mjs actions     # fix one category only
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const CONTENT_DIR = join(PROJECT_ROOT, "data/content");

const DRY_RUN = process.argv.includes("--dry-run");
const TARGET_CATEGORY = process.argv.find(
  (a) => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1]
);

// ── Helpers ────────────────────────────────────────────────────────────────

function renameContentToBody(arr) {
  if (!Array.isArray(arr)) return { arr, count: 0 };
  let count = 0;
  const fixed = arr.map((item) => {
    if (item && typeof item === "object" && "content" in item && !("body" in item)) {
      const { content, ...rest } = item;
      count++;
      return { ...rest, body: content };
    }
    return item;
  });
  return { arr: fixed, count };
}

function fixFile(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (e) {
    return { changed: false, error: `read error: ${e.message}` };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { changed: false, error: `invalid JSON: ${e.message}` };
  }

  let changed = false;
  const fixes = [];

  // Fix 1: content → body in sections and variations (both locales)
  for (const locale of ["ko", "en"]) {
    if (!data[locale]) continue;

    for (const field of ["sections", "variations"]) {
      const arr = data[locale][field];
      if (!Array.isArray(arr)) continue;
      const { arr: fixed, count } = renameContentToBody(arr);
      if (count > 0) {
        data[locale][field] = fixed;
        changed = true;
        fixes.push(`${locale}.${field}: renamed ${count} 'content' key(s) to 'body'`);
      }
    }
  }

  // Fix 2: relatedDreams at root → seo.relatedSlugs
  if ("relatedDreams" in data) {
    if (!data.seo) data.seo = {};
    if (!data.seo.relatedSlugs) {
      data.seo.relatedSlugs = data.relatedDreams;
      fixes.push(`moved root relatedDreams (${data.relatedDreams.length} slugs) → seo.relatedSlugs`);
    } else {
      fixes.push(`root relatedDreams present but seo.relatedSlugs already exists — deleted root key only`);
    }
    delete data.relatedDreams;
    changed = true;
  }

  if (!changed) return { changed: false, fixes: [] };

  if (!DRY_RUN) {
    const out = JSON.stringify(data, null, 2);
    // Verify JSON integrity before writing
    try {
      JSON.parse(out);
    } catch (e) {
      return { changed: false, error: `JSON serialization error: ${e.message}` };
    }
    writeFileSync(filePath, out, "utf8");
  }

  return { changed: true, fixes };
}

// ── Main ───────────────────────────────────────────────────────────────────

const categories = TARGET_CATEGORY
  ? [TARGET_CATEGORY]
  : readdirSync(CONTENT_DIR).filter((d) => {
      try {
        return readdirSync(join(CONTENT_DIR, d)).length > 0;
      } catch {
        return false;
      }
    });

console.log(`\n🔧 Schema fix${DRY_RUN ? " [DRY RUN]" : ""} — ${categories.length} categor${categories.length === 1 ? "y" : "ies"}\n`);

let totalFiles = 0;
let totalChanged = 0;
let totalErrors = 0;

for (const category of categories) {
  const categoryDir = join(CONTENT_DIR, category);
  let files;
  try {
    files = readdirSync(categoryDir).filter((f) => f.endsWith(".json"));
  } catch {
    console.warn(`  ⚠️  Could not read category: ${category}`);
    continue;
  }

  let catChanged = 0;
  for (const file of files) {
    const filePath = join(categoryDir, file);
    const result = fixFile(filePath);
    totalFiles++;

    if (result.error) {
      console.error(`  ❌ [${category}/${file}] ${result.error}`);
      totalErrors++;
    } else if (result.changed) {
      catChanged++;
      totalChanged++;
      const slug = file.replace(".json", "");
      console.log(`  ✅ ${category}/${slug}`);
      result.fixes.forEach((f) => console.log(`     • ${f}`));
    }
  }

  if (catChanged === 0) {
    console.log(`  ✓  ${category} — no changes needed (${files.length} files)`);
  }
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${DRY_RUN ? "⚠️  DRY RUN — nothing written\n" : ""}✅ Done
   Files scanned:  ${totalFiles}
   Files changed:  ${totalChanged}
   Errors:         ${totalErrors}
`);

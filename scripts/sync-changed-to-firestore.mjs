/**
 * Sync changed content files to Firestore based on a validation report.
 *
 * Reads the changed slug list from a content-validator-agent report and
 * re-uploads only those documents — not a full migration.
 *
 * Usage:
 *   node scripts/sync-changed-to-firestore.mjs --report data/validation/report-2026-03-14T12-00-00.json
 *   node scripts/sync-changed-to-firestore.mjs --latest          # auto-picks newest report
 *   node scripts/sync-changed-to-firestore.mjs --latest --dry-run
 */

import { readFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const CONTENT_DIR = join(PROJECT_ROOT, "data/content");
const VALIDATION_DIR = join(PROJECT_ROOT, "data/validation");
const SERVICE_ACCOUNT_PATH = join(__dirname, "firebase-service-account.json");

const DRY_RUN = process.argv.includes("--dry-run");
const LATEST = process.argv.includes("--latest");
const REPORT_FLAG_INDEX = process.argv.indexOf("--report");
const REPORT_PATH_ARG = REPORT_FLAG_INDEX !== -1 ? process.argv[REPORT_FLAG_INDEX + 1] : null;

// ── Resolve report path ───────────────────────────────────────────────────────

async function resolveReportPath() {
  if (REPORT_PATH_ARG) {
    return join(PROJECT_ROOT, REPORT_PATH_ARG);
  }
  if (LATEST) {
    const files = (await readdir(VALIDATION_DIR)).filter(
      (f) => f.startsWith("report-") && f.endsWith(".json")
    );
    if (!files.length) {
      console.error("❌ No validation reports found in data/validation/");
      process.exit(1);
    }
    files.sort();
    return join(VALIDATION_DIR, files[files.length - 1]);
  }
  console.error("Usage: node sync-changed-to-firestore.mjs --report <path> | --latest [--dry-run]");
  process.exit(1);
}

// ── Firestore init ────────────────────────────────────────────────────────────

const serviceAccount = JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const collection = db.collection("dreams");

// ── Main ──────────────────────────────────────────────────────────────────────

const reportPath = await resolveReportPath();
console.log(`📋 Report: ${reportPath}`);

let report;
try {
  report = JSON.parse(await readFile(reportPath, "utf8"));
} catch (err) {
  console.error(`❌ Could not read report: ${err.message}`);
  process.exit(1);
}

const changed = report.changed ?? [];
if (!changed.length) {
  console.log("✅ No changed files in report — nothing to sync.");
  process.exit(0);
}

console.log(`\n🔄 Syncing ${changed.length} changed document(s) to Firestore`);
if (DRY_RUN) console.log("   Mode: DRY RUN\n");
console.log("");

let synced = 0;
let failed = 0;

for (const { slug, category, filePath } of changed) {
  const absolutePath = join(PROJECT_ROOT, filePath);
  let data;
  try {
    const raw = await readFile(absolutePath, "utf8");
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`  ❌ [${slug}] Could not read/parse: ${err.message}`);
    failed++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would update: dreams/${slug}`);
    synced++;
    continue;
  }

  try {
    await collection.doc(slug).set({ ...data, category, slug });
    console.log(`  ✅ dreams/${slug}`);
    synced++;
  } catch (err) {
    console.error(`  ❌ [${slug}] Firestore write failed: ${err.message}`);
    failed++;
  }
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done
   Synced:  ${synced}
   Failed:  ${failed}
   Report:  ${reportPath}
${DRY_RUN ? "\n⚠️  DRY RUN — nothing was written to Firestore" : ""}
`);

process.exit(failed > 0 ? 1 : 0);

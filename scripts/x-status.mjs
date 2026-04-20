#!/usr/bin/env node
// Progress dashboard for the kkumhaemong X posting pipeline.
//
// Usage:
//   node scripts/x-status.mjs [--verbose]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const VERBOSE = process.argv.includes("--verbose");

// --- load queue ---
const QUEUE_PATH = path.join(PROJECT_ROOT, "data/x-queue/queue.json");
const queue = fs.existsSync(QUEUE_PATH)
  ? JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"))
  : { entries: [] };
const entries = queue.entries || [];

// --- load hook corpus ---
const HOOKS_DIR = path.join(PROJECT_ROOT, "data/x-queue/hooks");
const classifiedCount = fs.existsSync(HOOKS_DIR)
  ? fs.readdirSync(HOOKS_DIR).filter((f) => f.endsWith(".json")).length
  : 0;

// --- queue counts ---
const pending = entries.filter((e) => e.status === "pending");
const posted = entries.filter((e) => e.status === "posted");
const failed = entries.filter((e) => e.status === "failed");

const koInQueue = entries.filter((e) => e.locale === "ko").length;
const enInQueue = entries.filter((e) => e.locale === "en").length;

// --- next pending ---
const sortedPending = [...pending].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
const nextPending = sortedPending[0];

// --- velocity: last post ---
const sortedPosted = [...posted].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
const lastPost = sortedPosted[0];

// --- velocity: posts this week / this month ---
const now = new Date();
const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
const postsThisWeek = posted.filter((e) => e.postedAt && new Date(e.postedAt) >= weekAgo).length;
const postsThisMonth = posted.filter((e) => e.postedAt && new Date(e.postedAt) >= monthAgo).length;

// --- est. days to empty ---
const postsPerDay = postsThisMonth > 0 ? postsThisMonth / 30 : 3;
const estDays = pending.length > 0 ? (pending.length / postsPerDay).toFixed(1) : "0";
const rateStr = postsThisMonth > 0 ? `${postsPerDay.toFixed(1)}/day (30-day avg)` : "3/day (target)";

// --- article count from content dir ---
let articleCount = 0;
const CONTENT_BASE = path.join(PROJECT_ROOT, "data/content");
if (fs.existsSync(CONTENT_BASE)) {
  const catDirs = fs.readdirSync(CONTENT_BASE);
  for (const cat of catDirs) {
    const catPath = path.join(CONTENT_BASE, cat);
    if (fs.statSync(catPath).isDirectory()) {
      articleCount += fs.readdirSync(catPath).filter((f) => f.endsWith(".json")).length;
    }
  }
}

// --- format timestamp ---
function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

// --- print ---
console.log(`\n=== kkumhaemong X pipeline status ===`);
console.log();
console.log(`Corpus:`);
console.log(`  Articles (data/content):        ${String(articleCount).padStart(5)}`);
console.log(`  Classified hooks:               ${String(classifiedCount).padStart(5)}`);
console.log(`  Cards generated (in queue):     ${String(entries.length).padStart(5)}     (KO: ${koInQueue}, EN: ${enInQueue})`);
console.log();
console.log(`Queue:`);
console.log(`  Pending:                        ${String(pending.length).padStart(5)}`);
console.log(`  Posted:                         ${String(posted.length).padStart(5)}`);
console.log(`  Failed:                         ${String(failed.length).padStart(5)}`);
console.log(`  Next pending:                   ${nextPending ? `${nextPending.slug} (${nextPending.locale})` : "—"}`);
console.log();
console.log(`Velocity:`);
console.log(`  Last post:                      ${lastPost ? `${formatTs(lastPost.postedAt)}  [${lastPost.slug}]` : "—"}`);
console.log(`  Posts this week:                ${String(postsThisWeek).padStart(5)}`);
console.log(`  Posts this month:               ${String(postsThisMonth).padStart(5)}`);
console.log(`  Est. days to empty queue:       ${String(estDays).padStart(5)} @ ${rateStr}`);

if (VERBOSE) {
  // --- by-category breakdown ---
  const catMap = new Map();
  for (const e of entries) {
    const cat = e.category || "unknown";
    if (!catMap.has(cat)) catMap.set(cat, { generated: 0, pending: 0, posted: 0, failed: 0 });
    const cm = catMap.get(cat);
    cm.generated++;
    if (e.status === "pending") cm.pending++;
    else if (e.status === "posted") cm.posted++;
    else if (e.status === "failed") cm.failed++;
  }

  const sortedCats = [...catMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  console.log();
  console.log(`By category:`);
  for (const [cat, counts] of sortedCats) {
    const line = `  ${cat.padEnd(20)} generated ${String(counts.generated).padStart(3)} | pending ${String(counts.pending).padStart(3)} | posted ${String(counts.posted).padStart(3)}`;
    console.log(line);
  }
}

console.log();

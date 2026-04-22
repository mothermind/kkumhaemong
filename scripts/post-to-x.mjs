#!/usr/bin/env node
// Automated posting via X API v2 with OAuth 1.0a user context.
//
// Usage:
//   node scripts/post-to-x.mjs [options]
//     --live                 Actually post (default: dry-run)
//     --limit N              Max posts this run (default 1)
//     --stagger-seconds N    Delay between posts in same run (default 45)
//
// Env vars required (from .env):
//   X_API_KEY
//   X_API_KEY_SECRET
//   X_ACCESS_TOKEN
//   X_ACCESS_TOKEN_SECRET

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
// Load .env manually (no dotenv dep in prod deps — parse it ourselves)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env");
if (fs.existsSync(ENV_PATH)) {
  const envLines = fs.readFileSync(ENV_PATH, "utf8").split("\n");
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// --- arg parsing ---
const args = process.argv.slice(2);
const getArg = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const hasFlag = (flag) => args.includes(flag);

const LIVE = hasFlag("--live");
const LIMIT = parseInt(getArg("--limit", "1"), 10);
const STAGGER_MS = parseInt(getArg("--stagger-seconds", "45"), 10) * 1000;

if (!LIVE) {
  console.log("DRY-RUN mode (pass --live to actually post)");
}

// --- queue ---
const QUEUE_PATH = path.join(PROJECT_ROOT, "data/x-queue/queue.json");
if (!fs.existsSync(QUEUE_PATH)) {
  console.error(`queue not found: ${QUEUE_PATH}`);
  process.exit(1);
}

// --- validation helpers ---
const VALIDATION_DIR = path.join(PROJECT_ROOT, "data/x-queue/validation");
const VALIDATE_SCRIPT = path.join(PROJECT_ROOT, "scripts/validate-card.mjs");

function findLatestValidationReport(slug, locale) {
  if (!fs.existsSync(VALIDATION_DIR)) return null;
  const reports = fs.readdirSync(VALIDATION_DIR)
    .filter((f) => f.startsWith(`${slug}-${locale}-script-`) && f.endsWith(".json"))
    .sort()
    .reverse();
  if (reports.length === 0) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(VALIDATION_DIR, reports[0]), "utf8"));
  } catch {
    return null;
  }
}

// Run validation inline; returns the report object or null on fatal error.
function runValidationInline(slug, locale) {
  try {
    execSync(
      `node ${VALIDATE_SCRIPT} --slug ${slug} --locale ${locale}`,
      { cwd: PROJECT_ROOT, stdio: "inherit" }
    );
  } catch {
    // exit code 1 = block — continue and read the report
  }
  return findLatestValidationReport(slug, locale);
}

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
const candidates = queue.entries
  .filter((e) => e.status === "pending")
  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  .slice(0, LIMIT);

if (candidates.length === 0) {
  console.log("no pending entries in queue.");
  process.exit(0);
}

console.log(`\n${LIVE ? "LIVE" : "DRY-RUN"}: posting ${candidates.length} tweet(s), stagger ${STAGGER_MS / 1000}s\n`);

// --- live: validate env vars + init client ---
let client = null;
if (LIVE) {
  const required = ["X_API_KEY", "X_API_KEY_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`missing env vars: ${missing.join(", ")}`);
    console.error("Set them in .env or Vercel env vars.");
    process.exit(1);
  }

  const { TwitterApi } = await import("twitter-api-v2");
  client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });
}

// --- post ---
let postedCount = 0;
let errorCount = 0;
let skippedBlocked = 0;

const POSTED_DIR = path.join(PROJECT_ROOT, "public/x-cards/posted");

function atomicWriteQueue() {
  const tmp = QUEUE_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(queue, null, 2) + "\n");
  fs.renameSync(tmp, QUEUE_PATH);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (let i = 0; i < candidates.length; i++) {
  const entry = candidates[i];
  const { slug, locale, cardPath, postText } = entry;

  // Resolve the queue entry by reference so mutations persist
  const queueIdx = queue.entries.findIndex(
    (e) => e.slug === slug && e.locale === locale && e.createdAt === entry.createdAt
  );

  console.log(`[${i + 1}/${candidates.length}] ${slug} (${locale})`);
  console.log(`  card:     ${cardPath}`);
  console.log(`  postText: ${postText}`);

  // --- validation gate ---
  // Check if the queue entry is already marked blocked from generate-cards
  if (entry.validationStatus === "blocked") {
    const reportRef = entry.validationReport || "see data/x-queue/validation/";
    console.warn(`  SKIP: card marked validationStatus=blocked — report: ${reportRef}`);
    skippedBlocked++;
    console.log();
    continue;
  }

  // Find latest validation report or run inline if none exists
  let report = findLatestValidationReport(slug, locale);
  if (!report) {
    console.log("  no validation report found — running inline validation...");
    report = runValidationInline(slug, locale);
  }

  if (report) {
    if (report.severity === "block") {
      console.warn(`  SKIP: validation severity=block — ${[...report.checks.design.errors, ...report.checks.content.errors, ...report.checks.pipeline.errors].join("; ")}`);
      skippedBlocked++;
      console.log();
      continue;
    }
    if (report.severity === "warn") {
      console.warn(`  WARN: validation has warnings — proceeding to post`);
      const allWarnings = [...report.checks.design.warnings, ...report.checks.content.warnings, ...report.checks.pipeline.warnings];
      for (const w of allWarnings) {
        console.warn(`    - ${w}`);
      }
    }
  } else {
    console.warn("  WARN: could not run validation — proceeding without report");
  }

  if (!LIVE) {
    console.log("  (dry-run — no API call)\n");
    continue;
  }

  // --- live: upload media then tweet ---
  const absCardPath = path.isAbsolute(cardPath)
    ? cardPath
    : path.join(PROJECT_ROOT, cardPath);

  if (!fs.existsSync(absCardPath)) {
    console.error(`  ERROR: card file not found: ${absCardPath}`);
    errorCount++;
    console.log();
    continue;
  }

  let mediaId = null;
  try {
    console.log("  uploading media...");
    mediaId = await client.v1.uploadMedia(absCardPath, { mimeType: "image/jpeg" });
    console.log(`  mediaId: ${mediaId}`);
  } catch (err) {
    console.error(`  media upload FAILED for ${slug} [${locale}]`);
    console.error(`  status: ${err.code || err.status || "unknown"}`);
    console.error(`  message: ${err.message}`);
    if (err.data) console.error(`  X error body:`, JSON.stringify(err.data, null, 2));
    errorCount++;
    console.log();
    // Don't mark as failed — keep pending so Ayden can retry
    continue;
  }

  let tweetId = null;
  try {
    console.log("  creating tweet...");
    const res = await client.v2.tweet({
      text: postText,
      media: { media_ids: [mediaId] },
    });
    tweetId = res.data?.id;
    console.log(`  tweetId: ${tweetId}`);
  } catch (err) {
    console.error(`  tweet create FAILED for ${slug} [${locale}]`);
    console.error(`  status: ${err.code || err.status || "unknown"}`);
    console.error(`  message: ${err.message}`);
    if (err.data) console.error(`  X error body:`, JSON.stringify(err.data, null, 2));
    if (mediaId) console.error(`  NOTE: media was uploaded (mediaId: ${mediaId}) but tweet failed`);
    errorCount++;
    // Don't mark as failed — keep pending
    continue;
  }

  // --- success: update queue + move card ---
  const now = new Date().toISOString();
  if (queueIdx >= 0) {
    queue.entries[queueIdx].status = "posted";
    queue.entries[queueIdx].tweetId = tweetId;
    queue.entries[queueIdx].postedAt = now;
    queue.entries[queueIdx].groupId = `tweet-${tweetId}`;
  }

  // Move card to posted/
  fs.mkdirSync(POSTED_DIR, { recursive: true });
  const cardFilename = path.basename(absCardPath);
  const destPath = path.join(POSTED_DIR, cardFilename);
  if (fs.existsSync(absCardPath) && !fs.existsSync(destPath)) {
    fs.renameSync(absCardPath, destPath);
    if (queueIdx >= 0) {
      queue.entries[queueIdx].cardPath = path.join("public/x-cards/posted", cardFilename);
    }
    console.log(`  moved card → posted/${cardFilename}`);
  }

  atomicWriteQueue();
  postedCount++;
  console.log(`  posted ${slug} [${locale}] ✓\n`);

  // Stagger between posts
  if (i < candidates.length - 1) {
    console.log(`  staggering ${STAGGER_MS / 1000}s...\n`);
    await sleep(STAGGER_MS);
  }
}

// --- cost logging ---
const TWEET_COST = 0.01;
console.log(`--- summary ---`);
console.log(`Posted ${postedCount} tweet(s).${postedCount > 0 ? ` API cost: ~$${(postedCount * TWEET_COST).toFixed(2)} (${postedCount} × $${TWEET_COST} tweet create)` : ""}`);
if (skippedBlocked > 0) {
  console.log(`Blocked by validation: ${skippedBlocked} (fix issues then re-run x:validate)`);
}
if (errorCount > 0) {
  console.log(`Errors: ${errorCount} (entries kept as pending — retry when ready)`);
}

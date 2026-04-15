#!/usr/bin/env node
// Stamp one or more queue entries as "posted" after the user has manually
// uploaded them to X. Also moves their card images from public/x-cards/
// to public/x-cards/posted/ so the ready-to-post folder stays clean.
//
// Usage:
//   node scripts/mark-posted.mjs <slug> [slug...]
//   node scripts/mark-posted.mjs --tweet-id 123456 snake pig-dream
//   node scripts/mark-posted.mjs --locale ko snake           # only ko entry for snake
//
// By default all pending entries for the given slug(s) (both locales) are stamped.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};

const TWEET_ID = getArg("--tweet-id");
const LOCALE = getArg("--locale");

// Extract positional slug args, skipping --flag value pairs.
const slugs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--tweet-id" || args[i] === "--locale") {
    i++; // also skip the value
    continue;
  }
  if (args[i].startsWith("--")) continue;
  slugs.push(args[i]);
}

if (slugs.length === 0) {
  console.error("usage: mark-posted.mjs [--tweet-id ID] [--locale ko|en] <slug> [slug...]");
  process.exit(1);
}

const QUEUE_PATH = "data/x-queue/queue.json";
const POSTED_DIR = "public/x-cards/posted";
const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));

fs.mkdirSync(POSTED_DIR, { recursive: true });

const now = new Date().toISOString();
const groupId = TWEET_ID ? `tweet-${TWEET_ID}` : `manual-${Date.now()}`;
let stamped = 0;

for (const slug of slugs) {
  const matches = queue.entries.filter(
    (e) => e.slug === slug && e.status === "pending" && (!LOCALE || e.locale === LOCALE),
  );

  if (matches.length === 0) {
    console.warn(`  (no pending entry for ${slug}${LOCALE ? " [" + LOCALE + "]" : ""})`);
    continue;
  }

  for (const entry of matches) {
    // move card file
    if (entry.cardPath && fs.existsSync(entry.cardPath)) {
      const newPath = path.join(POSTED_DIR, path.basename(entry.cardPath));
      if (!fs.existsSync(newPath)) {
        fs.renameSync(entry.cardPath, newPath);
        console.log(`  moved ${entry.cardPath} → ${newPath}`);
      }
      entry.cardPath = newPath;
    }

    entry.status = "posted";
    entry.postedAt = now;
    entry.tweetId = TWEET_ID || null;
    entry.groupId = groupId;
    console.log(`  ✓ stamped ${entry.slug} [${entry.locale}]`);
    stamped++;
  }
}

// atomic save
const tmp = QUEUE_PATH + ".tmp";
fs.writeFileSync(tmp, JSON.stringify(queue, null, 2) + "\n");
fs.renameSync(tmp, QUEUE_PATH);

const remaining = queue.entries.filter((e) => e.status === "pending").length;
console.log(`\nstamped ${stamped} entr${stamped === 1 ? "y" : "ies"} as posted`);
console.log(`pending remaining: ${remaining}`);

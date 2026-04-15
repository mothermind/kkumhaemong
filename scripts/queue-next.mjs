#!/usr/bin/env node
// Print the next pending X-queue entry (or a paired batch) in a format
// that's easy to copy-paste into the X web compose view.
//
// Usage:
//   node scripts/queue-next.mjs                   # print next 2 pending in same locale (pair mode)
//   node scripts/queue-next.mjs --count 1         # single entry
//   node scripts/queue-next.mjs --count 4         # 4 entries (won't exceed same-locale run)
//   node scripts/queue-next.mjs --locale ko       # filter
//   node scripts/queue-next.mjs --slug snake      # specific slug

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};

const COUNT = parseInt(getArg("--count", "2"), 10);
const LOCALE = getArg("--locale");
const SLUG = getArg("--slug");

const QUEUE_PATH = "data/x-queue/queue.json";
const LIBRARY_PATH = "data/x-queue/hook-library.json";
if (!fs.existsSync(QUEUE_PATH)) {
  console.error(`queue not found: ${QUEUE_PATH}`);
  process.exit(1);
}
const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
const library = JSON.parse(fs.readFileSync(LIBRARY_PATH, "utf8"));

let candidates = queue.entries.filter((e) => e.status === "pending");
if (LOCALE) candidates = candidates.filter((e) => e.locale === LOCALE);
if (SLUG) candidates = candidates.filter((e) => e.slug === SLUG);
candidates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

if (candidates.length === 0) {
  console.log("no pending entries match filter");
  process.exit(0);
}

// Pair mode: lock to the oldest entry's locale, take up to COUNT from that locale
const lockLocale = candidates[0].locale;
const batch = candidates.filter((e) => e.locale === lockLocale).slice(0, COUNT);

// Re-assemble the caption from structured fields so the brand line injects cleanly
// in both single and paired modes. The raw `text` field on each entry is ignored
// here — this script is the single source of truth for the caption layout.
function assembleCaption(entries) {
  const locale = entries[0].locale;
  const brandLine = library.brandLine?.[locale] || "";

  let hookBlock;
  let tagBlock;

  if (entries.length === 1) {
    // Single post: use setup + oneLiner on two lines (matches the card's hierarchy)
    const e = entries[0];
    hookBlock = `${e.setup}\n${e.oneLiner}`;
    tagBlock = e.hashtags.join(" ");
  } else {
    // Paired post: "{kicker} — {oneLiner}" per entry, shared generic hashtags
    hookBlock = entries
      .map((e) => `${e.kicker} — ${e.oneLiner.replace(/\.$/, "")}`)
      .join("\n");
    tagBlock = locale === "ko" ? "#꿈해몽 #오늘의운세" : "#DreamMeaning #KoreanDreams";
  }

  const urlBlock = entries.map((e) => e.url).join("\n");
  const brandAndUrls = brandLine ? `${brandLine}\n${urlBlock}` : urlBlock;

  return `${hookBlock}\n\n${brandAndUrls}\n${tagBlock}`;
}

const caption = assembleCaption(batch);

// X post length: URLs always count as 23 regardless of actual length
function xLength(text, urls) {
  let t = text;
  for (const u of urls) t = t.replace(u, "x".repeat(23));
  return [...t].length;
}
const len = xLength(caption, batch.map((e) => e.url));

console.log(`\n=== next up ===`);
console.log(`locale: ${lockLocale}`);
console.log(`entries: ${batch.length} — ${batch.map((e) => e.slug).join(", ")}`);
console.log(`length (x-chars): ${len} / 280`);
console.log();

console.log(`--- entries ---`);
for (const e of batch) {
  console.log(`  ${e.slug}  [${e.kicker}]`);
  console.log(`    hook:    ${e.setup} ${e.oneLiner}`);
  console.log(`    url:     ${e.url}`);
  console.log(`    decoded: ${decodeURIComponent(e.url)}`);
  console.log(`    card:    ${path.resolve(e.cardPath)}`);
  if (e.warnings?.length) console.log(`    warns:   ${e.warnings.join("; ")}`);
}
console.log();

console.log(`--- caption (copy below, paste into X) ---`);
console.log(caption);
console.log();
console.log(`--- after posting, mark done with: ---`);
console.log(`  npm run x:mark-posted -- ${batch.map((e) => e.slug).join(" ")}`);
console.log();

#!/usr/bin/env node
// Build a library-consistent queue entry for a slug whose card is already rendered.
// Does NOT touch the card image — only reads content + library + classified hook
// and writes a structured entry into data/x-queue/queue.json.
//
// Usage:
//   node scripts/queue-post.mjs <slug> <category> [locale=ko] [variantSeed=0]

import fs from "node:fs";
import crypto from "node:crypto";

const [, , slug, category, localeArg = "ko", seedArg = "0"] = process.argv;
if (!slug || !category) {
  console.error("usage: queue-post.mjs <slug> <category> [locale=ko] [variantSeed=0]");
  process.exit(1);
}
const locale = localeArg;
const variantSeed = parseInt(seedArg, 10);

const content = JSON.parse(fs.readFileSync(`./data/content/${category}/${slug}.json`, "utf8"));
const library = JSON.parse(fs.readFileSync("./data/x-queue/hook-library.json", "utf8"));
const classified = JSON.parse(fs.readFileSync(`./data/x-queue/hooks/${slug}.json`, "utf8"));

// --- kicker ---
function deriveKickerKo(title) {
  let t = title.split(/\s*해몽/)[0].trim();
  if (!/꿈$/.test(t)) t += " 꿈";
  return t.length > 14 ? t.slice(0, 14) : t;
}
function deriveKickerEn(englishSlug) {
  // Derive from slug (kebab-case → Title Case + " Dream") — en.title has
  // parentheticals and mixed CJK that are unreliable to parse.
  const base = englishSlug
    .replace(/-dream$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const kicker = `${base} Dream`;
  return kicker.length > 24 ? kicker.slice(0, 24).trim() : kicker;
}
const kicker =
  locale === "ko" ? deriveKickerKo(content.ko.title) : deriveKickerEn(slug);

// --- deterministic hook pick (must match render-x-card-smoke.mjs exactly) ---
function seed32(str) {
  return crypto.createHash("md5").update(str).digest().readUInt32BE(0);
}
const s = seed32(`${slug}${locale}${variantSeed}`);

const patterns = locale === "ko" ? library.patterns : library.enPatterns;
const cats = classified.categories;
const catKo = cats[(s >>> 8) % cats.length];
const categoryKey = locale === "ko" ? catKo : library.enCategories[catKo];
const outcomeTable = locale === "ko" ? library.outcomes : library.enOutcomes;
const outcomes = outcomeTable[categoryKey];
const outcome = outcomes[(s >>> 16) % outcomes.length];

const pattern = patterns[s % patterns.length];
const setup = pattern.split("{O}")[0].trim().replace(/[.,]\s*$/, ".");
const payoff = outcome + ".";

// --- url ---
// KO and EN use different slug shapes:
//   KO: /ko/꿈해몽/{koreanSlug}   — romanized Korean (e.g. "bihaenggi-churak-kkum")
//   EN: /en/dream/{slug}          — english slug (e.g. "airplane-crash-dream")
// The 꿈해몽 segment is percent-encoded because X's URL auto-linkifier ignores
// CJK characters in paths and won't make the link clickable otherwise.
// Next.js decodes percent-encoding before route matching, so both forms resolve.
const KO_SEGMENT = encodeURIComponent("꿈해몽"); // %EA%BF%88%ED%95%B4%EB%AA%BD
const koreanSlug = content.seo?.koreanSlug || content.koreanSlug || slug;
const url =
  locale === "ko"
    ? `https://www.kkumhaemong.com/ko/${KO_SEGMENT}/${koreanSlug}`
    : `https://www.kkumhaemong.com/en/dream/${slug}`;

// --- hashtags ---
const HASHTAG_CAT_KO = {
  재물: "#재물운",
  출세: "#출세운",
  연애: "#연애운",
  태몽: "#태몽",
  새출발: "#새출발",
  극복: "#전화위복",
  귀인: "#귀인운",
  건강: "#건강운",
};
const hashtagDream =
  locale === "ko"
    ? `#${kicker.replace(/\s/g, "")}`
    : `#${slug
        .replace(/-dream$/, "")
        .split("-")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join("")}Dream`;

const hashtags =
  locale === "ko"
    ? ["#꿈해몽", hashtagDream, HASHTAG_CAT_KO[catKo] || "#오늘의운세"]
    : ["#DreamMeaning", hashtagDream, "#KoreanDreams"];

// --- assemble single-post text (used when posting one entry at a time) ---
const singleText =
  locale === "ko"
    ? `${setup}\n${payoff}\n\n${url}\n${hashtags.join(" ")}`
    : `${setup}\n${payoff}\n\n${url}\n${hashtags.join(" ")}`;

// --- queue entry ---
const entry = {
  slug,
  category,
  locale,
  kicker,
  setup,
  oneLiner: payoff,
  text: singleText,
  hashtags,
  cardPath:
    locale === "en"
      ? `public/x-cards/${slug}_en.jpg`
      : `public/x-cards/${slug}.jpg`,
  url,
  categoryKey: catKo,
  hook: {
    patternIndex: s % patterns.length,
    category: catKo,
    outcomeIndex: (s >>> 16) % outcomes.length,
  },
  status: "pending",
  variantSeed,
  createdAt: new Date().toISOString(),
  postedAt: null,
  tweetId: null,
  groupId: null,
};

// --- upsert ---
const QUEUE = "data/x-queue/queue.json";
const q = fs.existsSync(QUEUE) ? JSON.parse(fs.readFileSync(QUEUE, "utf8")) : { entries: [] };

const existingIdx = q.entries.findIndex(
  (e) => e.slug === slug && e.locale === locale && (e.variantSeed ?? 0) === variantSeed,
);
if (existingIdx >= 0) {
  if (q.entries[existingIdx].status === "posted") {
    console.log(`already posted: ${slug} [${locale}] seed ${variantSeed} — skipping`);
    process.exit(0);
  }
  console.log(`replacing existing pending entry for ${slug} [${locale}] seed ${variantSeed}`);
  q.entries[existingIdx] = entry;
} else {
  q.entries.push(entry);
}
fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2) + "\n");
console.log(`queued: ${slug} [${locale}] | ${entry.kicker} — ${entry.oneLiner}`);

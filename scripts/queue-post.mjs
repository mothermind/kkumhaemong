#!/usr/bin/env node
// Build a library-consistent queue entry for a slug whose card is already rendered.
// Does NOT touch the card image — only reads content + library + classified hook
// and writes a structured entry into data/x-queue/queue.json.
//
// Usage:
//   node scripts/queue-post.mjs <slug> <category> [locale=ko] [variantSeed=0]
//   npm run x:queue -- <slug> <category> [locale=ko] [variantSeed=0]
//
// For the combined render+queue workflow, use:
//   npm run x:prepare -- <slug> <category> [variantSeed=0]

import fs from "node:fs";
import path from "node:path";
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
// canonicalCategory override: if hooks.json has a reviewedBy canonicalCategory, honour it.
const catKo = classified.canonicalCategory && library.outcomes[classified.canonicalCategory]
  ? classified.canonicalCategory
  : cats[(s >>> 8) % cats.length];
const categoryKey = locale === "ko" ? catKo : library.enCategories[catKo];
const outcomeTable = locale === "ko" ? library.outcomes : library.enOutcomes;
const outcomes = outcomeTable[categoryKey];
// outcomeOverride: hooks.json may pin a specific index for a locale+category pair.
const outcomeOverride = classified.outcomeOverride;
const pinnedIndex = outcomeOverride?.[locale]?.[categoryKey];
const outcomeIndex = (pinnedIndex !== undefined && pinnedIndex >= 0 && pinnedIndex < outcomes.length)
  ? pinnedIndex
  : (s >>> 16) % outcomes.length;
const outcome = outcomes[outcomeIndex];

const pattern = patterns[s % patterns.length];
const setup = pattern.split("{O}")[0].trim().replace(/[.,]\s*$/, "");
// No terminal period on payoff — punchier without it (matches render-x-card.mjs)
const payoff = outcome;

// --- url ---
// KO and EN use different slug shapes:
//   KO: /ko/꿈해몽/{koreanSlug}   — romanized Korean slug (e.g. "sagwa-kkum")
//   EN: /en/dream/{slug}          — english slug (e.g. "apple-dream")
// The 꿈해몽 segment is percent-encoded because X's URL auto-linkifier ignores
// CJK characters in paths and won't make the link clickable otherwise.
// Next.js decodes percent-encoding before route matching, so both forms resolve.
//
// koreanSlug priority:
//   1. Taxonomy file lookup (most authoritative — the routing source of truth)
//   2. content.seo.koreanSlug
//   3. Fallback to english slug (should never happen)
const KO_SEGMENT = encodeURIComponent("꿈해몽"); // %EA%BF%88%ED%95%B4%EB%AA%BD

function lookupKoreanSlugFromTaxonomy(slugToFind, cat) {
  // Try the category taxonomy file first, then scan all taxonomy files.
  const taxonomyDir = path.resolve("data/taxonomy");
  const candidates = [
    path.join(taxonomyDir, `${cat}.json`),
    ...fs.readdirSync(taxonomyDir)
      .filter((f) => f.endsWith(".json") && f !== `${cat}.json`)
      .map((f) => path.join(taxonomyDir, f)),
  ];
  for (const tfile of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(tfile, "utf8"));
      const symbols = data.symbols || [];
      const entry = symbols.find((e) => e.slug === slugToFind);
      if (entry?.koreanSlug) return entry.koreanSlug;
    } catch {
      // skip unreadable files
    }
  }
  return null;
}

const koreanSlug =
  lookupKoreanSlugFromTaxonomy(slug, category) ||
  content.seo?.koreanSlug ||
  content.koreanSlug ||
  slug;
const url =
  locale === "ko"
    ? `https://www.kkumhaemong.com/ko/${KO_SEGMENT}/${koreanSlug}`
    : `https://www.kkumhaemong.com/en/dream/${slug}`;

// --- postText (X caption copy) ---
// CTA + link that moves OFF the card and INTO the X post caption.
// 👉 emoji is fine here — plain text in an X caption, not rendered in an image.
const postText =
  locale === "ko"
    ? `오늘 이 꿈을 꿨다면 행운번호를 확인해보세요 👉 kkumhaemong.com/ko/${KO_SEGMENT}/${encodeURIComponent(koreanSlug)}`
    : `Had this dream? See today's lucky numbers 👉 kkumhaemong.com/en/dream/${slug}`;

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

// --- queue entry ---
// Note: no `text` field — queue-next.mjs is the single source of truth for caption
// assembly (it injects the brand line, handles paired-post merging, etc.).
// Storing a pre-assembled `text` here was causing silent divergence between what
// was stored and what was actually printed. Structured fields are the source of truth.
// `postText` is the CTA + link line that Ayden pastes directly into X alongside the card.
const entry = {
  slug,
  category,
  locale,
  kicker,
  setup,
  oneLiner: payoff,
  hashtags,
  postText,
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

#!/usr/bin/env node
// Render a 1080×1350 (4:5) X card for a dream interpretation article.
//
// Usage:
//   node scripts/render-x-card.mjs <slug> <category> [variantSeed=0] [locale=ko]
//   npm run x:render -- <slug> <category> [variantSeed=0] [locale=ko]
//
// Output:
//   public/x-cards/{slug}.jpg          (ko)
//   public/x-cards/{slug}_en.jpg       (en)
//
// Font embedding:
//   sharp uses librsvg + fontconfig. We set FONTCONFIG_FILE to a custom conf
//   that points to assets/fonts/x-card/ so the render works on any machine
//   without system font dependencies (macOS, Linux CI, Docker).
//   Set XCARD_FONT_DIR env var to override the font path for CI environments.
//
// Design moves (2026-04-20):
//   1. Sub-kicker: brand gold #E8C078, EN uppercased, letter-spaced (+3px EN / +2.5px KO)
//   2. Title: thin gold horizontal rule below (~20px gap, 2px tall, full title pixel width)
//   3. Main-kicker: cream serif text, no opening ornament

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// --- font setup ---
// Override FONTCONFIG_FILE before any sharp call so librsvg picks our fonts.
const FONT_DIR = process.env.XCARD_FONT_DIR
  ? path.resolve(process.env.XCARD_FONT_DIR)
  : path.join(PROJECT_ROOT, "assets/fonts/x-card");

if (!fs.existsSync(FONT_DIR)) {
  console.error(`Font directory not found: ${FONT_DIR}`);
  console.error("Run: node scripts/download-x-card-fonts.mjs  (or set XCARD_FONT_DIR)");
  process.exit(1);
}

// Write a fontconfig that points at the actual font dir (supports CI path overrides)
const fcConf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <cachedir>/tmp/fontconfig-xcards-cache</cachedir>
</fontconfig>`;
fs.mkdirSync("/tmp/fontconfig-xcards-cache", { recursive: true });
const TMP_CONF = "/tmp/fontconfig-xcards-runtime.conf";
fs.writeFileSync(TMP_CONF, fcConf);
process.env.FONTCONFIG_FILE = TMP_CONF;

// --- args ---
const slug = process.argv[2] || "airplane-crash-dream";
const category = process.argv[3] || "transportation";
const variantSeed = parseInt(process.argv[4] || "0", 10);
const locale = process.argv[5] || "ko";
if (!["ko", "en"].includes(locale)) throw new Error(`invalid locale: ${locale}`);

// --- read data ---
const content = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, `data/content/${category}/${slug}.json`), "utf8"),
);
const library = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "data/x-queue/hook-library.json"), "utf8"),
);
const classified = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, `data/x-queue/hooks/${slug}.json`), "utf8"),
);

// --- locate hero ---
const heroCandidates = [
  path.join(PROJECT_ROOT, `public/images/dreams/${slug}/hero.webp`),
  path.join(PROJECT_ROOT, `public/images/dreams/${slug}/hero.png`),
  path.join(PROJECT_ROOT, `public/images/dreams/${slug}/hero.jpg`),
];
const heroPath = heroCandidates.find((p) => fs.existsSync(p));
if (!heroPath) throw new Error(`no local hero image for ${slug}`);

// --- output path ---
fs.mkdirSync(path.join(PROJECT_ROOT, "public/x-cards"), { recursive: true });
const outPath =
  locale === "en"
    ? path.join(PROJECT_ROOT, `public/x-cards/${slug}_en.jpg`)
    : path.join(PROJECT_ROOT, `public/x-cards/${slug}.jpg`);

// --- derive dream name (title element) ---
// KO: strip " 해몽" suffix and ensure it ends in "꿈"
function deriveTitleKo(title) {
  let t = title.split(/\s*해몽/)[0].trim();
  if (!/꿈$/.test(t)) t += " 꿈";
  return t.length > 14 ? t.slice(0, 14) : t;
}
// EN: derive from slug — Title Case + " Dream"
function deriveTitleEn(englishSlug) {
  const base = englishSlug
    .replace(/-dream$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const title = `${base} Dream`;
  return title.length > 30 ? title.slice(0, 30).trim() : title;
}
const cardTitle = locale === "ko" ? deriveTitleKo(content.ko.title) : deriveTitleEn(slug);

// --- deterministic hook pick ---
function seed32(str) {
  const buf = crypto.createHash("md5").update(str).digest();
  return buf.readUInt32BE(0);
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
const subKicker = pattern.split("{O}")[0].trim().replace(/[.,]\s*$/, "");
// No terminal period on mainKicker — punchier without it
const mainKicker = outcome;

console.log({ slug, locale, heroPath, cardTitle, subKicker, mainKicker, categoryKey });

// --- word-wrap ---
function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// --- canvas dimensions (4:5 portrait) ---
const W = 1080;
const H = 1350;

// --- design constants: brand gold accent ---
const GOLD = "#E8C078";

// --- vertical band layout (all positions are deterministic, no centering) ---
//
// Band map (pixels, top → bottom):
//   0   –  820   Hero image zone (60.7% of canvas)
//   470 –  820   Gradient fade zone (350px, 3-stop sigmoid)
//   850 –  900   Sub-kicker line zone (~50px)
//   930 – 1040   Title line zone (~110px — dream name, bold sans)
//  1032           Gold rule (2px @ y=1030, 20px below title baseline of 1010)
//  1070 – 1320   Main-kicker zone (250px — auto-shrink ladder)
//  1320 – 1350   Bottom breathing margin — no content

const HERO_H = 820;
const FADE_START = 470;          // where the gradient begins in the hero
const FADE_H = HERO_H - FADE_START; // 350px

// Sub-kicker zone
const SUB_KICKER_TOP = 850;
const SUB_KICKER_FONT = 40;
const SUB_KICKER_LH = Math.ceil(SUB_KICKER_FONT * 1.2);

// Title zone
const TITLE_TOP = 930;
const TITLE_ZONE_H = 110; // enough for one line at up to 84px bold

// Gold rule: sits 20px below title baseline, 2px tall
const RULE_GAP = 20;      // breathing gap between title baseline and rule top
const RULE_H = 2;         // rule height in px
// Rule Y position computed after titleBaseline is known (below)

// Main-kicker zone — unchanged; there's ~38px clearance between rule bottom (1032) and zone top (1070)
const MAIN_KICKER_ZONE_TOP = 1070;
const MAIN_KICKER_ZONE_BOTTOM = 1320;
const MAIN_KICKER_ZONE_H = MAIN_KICKER_ZONE_BOTTOM - MAIN_KICKER_ZONE_TOP; // 250px

// --- font families (system-independent via fontconfig) ---
const SANS = "Noto Sans KR, sans-serif";
const SERIF = "Nanum Myeongjo, serif";
// Tommy: Latin display font for the title. Falls back to Noto Sans KR for CJK glyphs (KO titles).
const TOMMY = "MADE Tommy Soft, Noto Sans KR, sans-serif";

// --- usable width (60px margin each side) ---
const W_AVAIL = W - 60 - 60; // 960px

// --- sub-kicker: Move 1 — gold label treatment ---
// EN: uppercased; both: letter-spaced as a magazine-style kicker label
const subKickerText = locale === "en" ? subKicker.toUpperCase() : subKicker;
const subKickerLetterSpacing = locale === "en" ? "3px" : "2.5px";
const subKickerWrap = locale === "ko" ? 28 : 44;
const subKickerLines = wrap(subKickerText, subKickerWrap);

// --- title auto-shrink ---
// KO dream names are almost always 2–4 chars — no shrink needed.
// EN names like "Becoming Rich Dream" at 84px can overflow 960px.
const TITLE_CHAR_W = locale === "ko" ? 0.95 : 0.60;
function titleMaxChars(fontSize) { return Math.floor(W_AVAIL / (fontSize * TITLE_CHAR_W)); }
let titleFontSize = 80;
let titleFits = true;
for (const candidateFont of [80, 72, 64]) {
  const maxCh = titleMaxChars(candidateFont);
  if (cardTitle.length <= maxCh) {
    titleFontSize = candidateFont;
    break;
  }
  if (candidateFont === 64) {
    titleFontSize = 64;
    titleFits = false;
  }
}
const TITLE_FONT = titleFontSize;

// --- Move 2: gold rule dimensions ---
// Rule width: full estimated title pixel width (same estimator as auto-shrink).
// Measured at the final font size post-shrink, left-aligned with the title.
const estimatedTitlePx = cardTitle.length * TITLE_FONT * TITLE_CHAR_W;
const RULE_W = Math.round(estimatedTitlePx);

// --- main-kicker auto-shrink ladder: 140 → 120 → 100 → 84px ---
const MAIN_KICKER_CHAR_W = locale === "ko" ? 0.95 : 0.60;
function mainKickerLH(fontSize) { return Math.ceil(fontSize * 1.18); }
function mainKickerMaxChars(fontSize) { return Math.floor(W_AVAIL / (fontSize * MAIN_KICKER_CHAR_W)); }

let mainKickerFontSize = 84;
let mainKickerLines = [];
for (const candidateFont of [140, 120, 100, 84]) {
  const maxCh = mainKickerMaxChars(candidateFont);
  const lines = wrap(mainKicker, maxCh);
  if (lines.length * mainKickerLH(candidateFont) <= MAIN_KICKER_ZONE_H) {
    mainKickerFontSize = candidateFont;
    mainKickerLines = lines;
    break;
  }
  // Smallest: store regardless of fit (fallback)
  if (candidateFont === 84) mainKickerLines = lines;
}
const MAIN_KICKER_FONT = mainKickerFontSize;
const MAIN_KICKER_LH = mainKickerLH(mainKickerFontSize);

console.log(
  "subKicker wrap:", subKickerLines,
  "titleFont:", TITLE_FONT, titleFits ? "" : "(overflow-warn)",
  "mainKickerFont:", MAIN_KICKER_FONT, "mainKicker wrap:", mainKickerLines,
);
console.log(
  "mainKicker zone:", MAIN_KICKER_ZONE_TOP, "–", MAIN_KICKER_ZONE_BOTTOM,
  "=", MAIN_KICKER_ZONE_H, "px, used:", mainKickerLines.length * MAIN_KICKER_LH, "px",
);
console.log("ruleW:", RULE_W);

// --- compose hero buffer ---
const heroBuf = await sharp(heroPath)
  .resize(W, HERO_H, { fit: "cover", position: "center" })
  .toBuffer();

// --- compose background ---
const bg = await sharp({
  create: { width: W, height: H, channels: 3, background: "#0A0E1C" },
})
  .png()
  .toBuffer();

// --- SVG escape ---
const esc = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// --- derived text positions ---
const DARK_ZONE_TOP = FADE_START; // y=470 — where gradient starts in the SVG

// Sub-kicker baseline: zone top + font size
const subKickerFirstBaseline = SUB_KICKER_TOP + SUB_KICKER_FONT;

// Title baseline: TITLE_TOP + TITLE_FONT
const titleBaseline = TITLE_TOP + TITLE_FONT;

// Gold rule: 20px below title baseline
const ruleY = titleBaseline + RULE_GAP;

// Main-kicker baseline: zone top + font size
const mainKickerFirstBaseline = MAIN_KICKER_ZONE_TOP + MAIN_KICKER_FONT;

// --- build SVG text blocks ---

// Move 1: Sub-kicker — gold, uppercased (EN) / letter-spaced (both), magazine kicker label
const subKickerSvg = subKickerLines
  .map(
    (ln, i) =>
      `<text x="60" y="${Math.round(subKickerFirstBaseline + i * SUB_KICKER_LH)}" font-family="${SANS}" font-size="${SUB_KICKER_FONT}" font-weight="400" fill="${GOLD}" letter-spacing="${subKickerLetterSpacing}">${esc(ln)}</text>`,
  )
  .join("\n  ");

// Title: big, bold, Tommy display font, warm cream — the dream name (color unchanged)
const titleSvg = `<text x="60" y="${Math.round(titleBaseline)}" font-family="${TOMMY}" font-size="${TITLE_FONT}" font-weight="700" fill="#EDE5D3">${esc(cardTitle)}</text>`;

// Move 2: Gold horizontal rule — thin editorial divider below title
// Left-aligned at x=60, width equals full estimated title pixel width at final font size
const ruleSvg = `<rect x="60" y="${ruleY}" width="${RULE_W}" height="${RULE_H}" fill="${GOLD}"/>`;

// Move 3: Main-kicker — cream serif, flush left, no opening ornament
// Letter-spacing 0.8px on Nanum Myeongjo for KO; omit for EN.
const mainKickerLetterSpacing = locale === "ko" ? ' letter-spacing="0.8px"' : "";

const mainKickerSvg = mainKickerLines
  .map((ln, i) => {
    const y = Math.round(mainKickerFirstBaseline + i * MAIN_KICKER_LH);
    return `<text x="60" y="${y}" font-family="${SERIF}" font-size="${MAIN_KICKER_FONT}" font-weight="800" fill="#EDE5D3"${mainKickerLetterSpacing}>${esc(ln)}</text>`;
  })
  .join("\n  ");

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient fade: 3-stop sigmoid feel — smoother psychological
         transition; hero bleeds into dark zone more gracefully than a 2-stop linear. -->
    <linearGradient id="fade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#0A0E1C" stop-opacity="0"/>
      <stop offset="50%"  stop-color="#0A0E1C" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#0A0E1C" stop-opacity="1"/>
    </linearGradient>
  </defs>

  <!-- Gradient overlay — sits on top of hero, fades into dark background -->
  <rect x="0" y="${DARK_ZONE_TOP}" width="${W}" height="${FADE_H}" fill="url(#fade)"/>

  <!-- Sub-kicker: gold label, uppercased (EN) / letter-spaced (KO) — Move 1 -->
  ${subKickerSvg}

  <!-- Title: dream name (bold sans, cream — topic) -->
  ${titleSvg}

  <!-- Gold rule: thin editorial divider below title — Move 2 -->
  ${ruleSvg}

  <!-- Main kicker: cream serif payoff — Move 3 -->
  <!-- Auto-shrunk to ${MAIN_KICKER_FONT}px to fit zone -->
  ${mainKickerSvg}
</svg>`;

// --- composite ---
await sharp(bg)
  .composite([
    { input: heroBuf, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ])
  .jpeg({ quality: 88 })
  .toFile(outPath);

const stat = fs.statSync(outPath);
console.log("wrote", outPath, `${(stat.size / 1024).toFixed(1)}KB`);

// --- quality review ---
const hardFails = [];
const softWarns = [];

if (stat.size < 30 * 1024) hardFails.push(`card file too small: ${stat.size}B`);
if (stat.size > 800 * 1024) hardFails.push(`card file too large: ${stat.size}B`);

// Title validation
if (!cardTitle) hardFails.push("card title empty");
else {
  if (cardTitle.includes("undefined")) hardFails.push("card title contains undefined");
  if (locale === "ko" && /꿈\s+꿈/.test(cardTitle)) hardFails.push("card title has double 꿈");
}
if (!titleFits) softWarns.push(`title overflowed at smallest size (64px): "${cardTitle}"`);

for (const [name, str] of [["subKicker", subKicker], ["mainKicker", mainKicker]]) {
  if (!str || str === ".") hardFails.push(`${name} empty`);
  if (str && str.includes("undefined")) hardFails.push(`${name} contains undefined`);
  if (str && str.includes("{O}")) hardFails.push(`${name} has leftover {O} token`);
}

// Main kicker should not end with a period
if (mainKicker && mainKicker.endsWith(".")) softWarns.push("mainKicker unexpectedly ends with period (check hook-library outcomes)");

const fullHook = `${subKicker} ${mainKicker}`;
if (fullHook.includes("**")) hardFails.push("hook contains markdown bold");
if (locale === "ko" && fullHook.includes(" — ")) hardFails.push("hook contains spaced em-dash");
if (locale === "ko" && fullHook.includes("그런데 한 가지")) hardFails.push("hook contains cliffhanger anti-pattern");

const FORBIDDEN = /로또\s*\d*등|\d+억|\d{2,3}%|서울 [가-힣]모|부산 [가-힣]모/;
if (FORBIDDEN.test(fullHook)) hardFails.push("hook contains forbidden specific");

if (subKickerLines.length > 2) softWarns.push(`subKicker wraps to ${subKickerLines.length} lines`);
if (mainKickerLines.length > 3) softWarns.push(`mainKicker wraps to ${mainKickerLines.length} lines — consider shorter outcome text`);
if (MAIN_KICKER_FONT < 100) softWarns.push(`mainKicker font auto-shrunk to ${MAIN_KICKER_FONT}px — long payoff text`);
const mainKickerUsed = mainKickerLines.length * MAIN_KICKER_LH;
// At minimum font size (84px), overflow is a soft-warn — content is genuinely too long.
// Above minimum, overflow is a hard-fail (should have fit within the ladder).
if (mainKickerUsed > MAIN_KICKER_ZONE_H) {
  const msg = `mainKicker overflows zone by ${mainKickerUsed - MAIN_KICKER_ZONE_H}px (font=${MAIN_KICKER_FONT}px, lines=${mainKickerLines.length})`;
  if (MAIN_KICKER_FONT <= 84) softWarns.push(msg + " — content too long for minimum font size");
  else hardFails.push(msg);
}

console.log("\n--- quality review ---");
console.log("hardFails:", hardFails.length ? hardFails : "none");
console.log("softWarns:", softWarns.length ? softWarns : "none");
if (hardFails.length) {
  console.error("\nBLOCKED: hard-fail checks failed");
  process.exit(1);
}

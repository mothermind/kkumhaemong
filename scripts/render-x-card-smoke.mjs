import sharp from "sharp";
import fs from "node:fs";
import crypto from "node:crypto";

const slug = process.argv[2] || "airplane-crash-dream";
const category = process.argv[3] || "transportation";
const variantSeed = parseInt(process.argv[4] || "0", 10);
const locale = process.argv[5] || "ko";
if (!["ko", "en"].includes(locale)) throw new Error(`invalid locale: ${locale}`);

const content = JSON.parse(fs.readFileSync(`./data/content/${category}/${slug}.json`, "utf8"));
const library = JSON.parse(fs.readFileSync("./data/x-queue/hook-library.json", "utf8"));
const classified = JSON.parse(fs.readFileSync(`./data/x-queue/hooks/${slug}.json`, "utf8"));

const heroCandidates = [
  `public/images/dreams/${slug}/hero.webp`,
  `public/images/dreams/${slug}/hero.png`,
  `public/images/dreams/${slug}/hero.jpg`,
];
const heroPath = heroCandidates.find((p) => fs.existsSync(p));
if (!heroPath) throw new Error(`no local hero for ${slug}`);

fs.mkdirSync("public/x-cards", { recursive: true });
// KO cards stay at the root path for backwards compat; EN cards get an _en suffix
const outPath = locale === "en" ? `public/x-cards/${slug}_en.jpg` : `public/x-cards/${slug}.jpg`;

// --- derive card kicker ---
function deriveKickerKo(title) {
  let t = title.split(/\s*해몽/)[0].trim();
  if (!/꿈$/.test(t)) t += " 꿈";
  return t.length > 14 ? t.slice(0, 14) : t;
}
function deriveKickerEn(englishSlug) {
  // en.title is unreliable (parentheticals, mixed CJK, subtitles) — derive from
  // the slug, which is always clean kebab-case.
  //   "airplane-crash-dream" → "Airplane Crash Dream"
  //   "afterlife-dream"      → "Afterlife Dream"
  //   "acne-dream"           → "Acne Dream"
  const base = englishSlug
    .replace(/-dream$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const kicker = `${base} Dream`;
  return kicker.length > 24 ? kicker.slice(0, 24).trim() : kicker;
}
const cardKicker = locale === "ko" ? deriveKickerKo(content.ko.title) : deriveKickerEn(slug);

// --- derive badge from first matching section heading ---
// Badge stays in Korean characters even on EN cards — 길몽/흉몽 is part of the brand
// aesthetic and the color (amber/rose/slate) carries the meaning for non-Korean readers.
const headings = (content.ko.sections || []).map((s) => s.heading || "");
let badgeType = "중립";
let badgeColor = "#475569";
for (const h of headings) {
  if (h.includes("길몽")) { badgeType = "길몽"; badgeColor = "#F59E0B"; break; }
  if (h.includes("흉몽")) { badgeType = "흉몽"; badgeColor = "#E11D48"; break; }
  if (h.includes("중립") || h.includes("긍정")) { badgeType = "중립"; badgeColor = "#475569"; break; }
}

// --- deterministic hook pick (same algorithm for KO + EN, different library tables) ---
function seed32(str) {
  const buf = crypto.createHash("md5").update(str).digest();
  return buf.readUInt32BE(0);
}
const s = seed32(`${slug}${locale}${variantSeed}`);

const patterns = locale === "ko" ? library.patterns : library.enPatterns;
const cats = classified.categories; // classified cats are KO keys
const catKo = cats[(s >>> 8) % cats.length];
const categoryKey = locale === "ko" ? catKo : library.enCategories[catKo];
const outcomeTable = locale === "ko" ? library.outcomes : library.enOutcomes;
const outcomes = outcomeTable[categoryKey];
const outcome = outcomes[(s >>> 16) % outcomes.length];

const pattern = patterns[s % patterns.length];
const setupRaw = pattern.split("{O}")[0].trim().replace(/[.,]\s*$/, locale === "ko" ? "." : ".");
const setup = setupRaw;
const payoff = outcome + ".";

console.log({ slug, locale, heroPath, cardKicker, badgeType, category: categoryKey, setup, payoff });

// --- word-wrap Korean text by character budget ---
function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Wrap budgets differ per locale — English characters are ~40% narrower than CJK
// so we allow more chars per line before wrapping.
const setupWrap = locale === "ko" ? 26 : 40;
const payoffWrap = locale === "ko" ? 12 : 18;
const setupLines = wrap(setup, setupWrap);
const payoffLines = wrap(payoff, payoffWrap);
console.log("setup wrap:", setupLines, "payoff wrap:", payoffLines);

// --- compose ---
const W = 1080, H = 1350;
const HERO_H = 608;

const heroBuf = await sharp(heroPath)
  .resize(W, HERO_H, { fit: "cover", position: "center" })
  .toBuffer();

const bg = await sharp({
  create: { width: W, height: H, channels: 3, background: "#0A0E1C" },
}).png().toBuffer();

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Dynamic vertical centering.
// Text panel = from (HERO_H + 40) to (H - 140), leaving bottom zone for wordmark + domain.
// Block = kicker + gap + setup_lines + gap + payoff_lines
const PANEL_TOP = HERO_H + 40;
const PANEL_BOTTOM = H - 140;
const PANEL_H = PANEL_BOTTOM - PANEL_TOP;

// EN cards use slightly smaller payoff font to fit longer English phrases.
const KICKER_FONT = 32;
const KICKER_H = 38;
const GAP_KICKER_SETUP = 46;
const SETUP_FONT = 42;
const SETUP_LH = 58;
const GAP_SETUP_PAYOFF = 60;
const PAYOFF_FONT = locale === "ko" ? 96 : 86;
const PAYOFF_LH = locale === "ko" ? 116 : 106;

const BODY_SANS = locale === "ko"
  ? "Apple SD Gothic Neo, Noto Sans KR, sans-serif"
  : "Helvetica Neue, Helvetica, Arial, sans-serif";
const BODY_SERIF = locale === "ko"
  ? "Nanum Myeongjo, Apple SD Gothic Neo, serif"
  : "Georgia, Times New Roman, serif";

const setupBlock = setupLines.length * SETUP_LH;
const payoffBlock = payoffLines.length * PAYOFF_LH;
const totalBlock = KICKER_H + GAP_KICKER_SETUP + setupBlock + GAP_SETUP_PAYOFF + payoffBlock;
const blockTop = PANEL_TOP + Math.max(0, (PANEL_H - totalBlock) / 2);

const kickerBaseline = blockTop + KICKER_H;
const setupFirstBaseline = kickerBaseline + GAP_KICKER_SETUP + SETUP_FONT;
const payoffFirstBaseline = setupFirstBaseline + (setupLines.length - 1) * SETUP_LH + GAP_SETUP_PAYOFF + PAYOFF_FONT;

const setupSvg = setupLines
  .map((ln, i) => `<text x="60" y="${Math.round(setupFirstBaseline + i * SETUP_LH)}" font-family="${BODY_SANS}" font-size="${SETUP_FONT}" font-weight="400" fill="#F5F1E8" opacity="0.65">${esc(ln)}</text>`)
  .join("\n  ");

const payoffSvg = payoffLines
  .map((ln, i) => `<text x="60" y="${Math.round(payoffFirstBaseline + i * PAYOFF_LH)}" font-family="${BODY_SERIF}" font-size="${PAYOFF_FONT}" font-weight="800" fill="#F5F1E8">${esc(ln)}</text>`)
  .join("\n  ");

const KICKER_Y = Math.round(kickerBaseline);

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0A0E1C" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0A0E1C" stop-opacity="1"/>
    </linearGradient>
  </defs>

  <rect x="0" y="${HERO_H - 120}" width="${W}" height="120" fill="url(#fade)"/>

  <rect x="${W - 60 - 190}" y="60" width="190" height="78" rx="39" fill="${badgeColor}"/>
  <text x="${W - 60 - 95}" y="114" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif"
        font-size="42" font-weight="700" fill="#FFFFFF" text-anchor="middle">${badgeType}</text>

  <rect x="60" y="${KICKER_Y - 16}" width="60" height="4" fill="#D4AF37"/>
  <text x="140" y="${KICKER_Y}" font-family="${BODY_SANS}"
        font-size="${KICKER_FONT}" font-weight="500" fill="#D4AF37" letter-spacing="2">${esc(cardKicker)}</text>

  ${setupSvg}

  ${payoffSvg}

  <text x="${W - 60}" y="${H - 60}" font-family="Nanum Myeongjo, serif"
        font-size="40" font-weight="700" fill="#D4AF37" text-anchor="end">꿈해몽</text>
  <text x="60" y="${H - 60}" font-family="Apple SD Gothic Neo, sans-serif"
        font-size="26" font-weight="400" fill="#F5F1E8" opacity="0.5">kkumhaemong.com</text>
</svg>`;

await sharp(bg)
  .composite([
    { input: heroBuf, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ])
  .jpeg({ quality: 88 })
  .toFile(outPath);

const stat = fs.statSync(outPath);
console.log("wrote", outPath, `${(stat.size / 1024).toFixed(1)}KB`);

// --- quality review (mirrors dream-x-post-agent.md step 12) ---
const hardFails = [];
const softWarns = [];

// card file
if (stat.size < 30 * 1024) hardFails.push(`card file too small: ${stat.size}B`);
if (stat.size > 800 * 1024) hardFails.push(`card file too large: ${stat.size}B`);

// kicker — different length caps per locale (English chars narrower)
const KICKER_MAX = locale === "ko" ? 14 : 24;
const KICKER_WARN_MAX = locale === "ko" ? 12 : 22;
const KICKER_WARN_MIN = 2;
if (!cardKicker) hardFails.push("kicker empty");
else {
  if (cardKicker.includes("undefined")) hardFails.push("kicker contains undefined");
  if (locale === "ko" && /꿈\s+꿈$/.test(cardKicker)) hardFails.push("kicker has double 꿈");
  if (cardKicker.length > KICKER_MAX) hardFails.push(`kicker too long: ${cardKicker.length}`);
  if (cardKicker.length < KICKER_WARN_MIN) softWarns.push("kicker very short");
  if (cardKicker.length > KICKER_WARN_MAX) softWarns.push(`kicker over ${KICKER_WARN_MAX} chars`);
}

// hook text pieces
for (const [name, str] of [["setup", setup], ["payoff", payoff]]) {
  if (!str || str === ".") hardFails.push(`${name} empty`);
  if (str.includes("undefined")) hardFails.push(`${name} contains undefined`);
  if (str.includes("{O}")) hardFails.push(`${name} has leftover {O} token`);
}
if (locale === "ko" && !/(습니다|합니다|됩니다|옵니다|집니다|립니다|납니다|닙니다|압니다|갑니다|킵니다|칩니다)\.$/.test(payoff)) {
  softWarns.push("payoff doesn't end with expected 습니다-form");
}

// forbidden prose patterns (full hook line)
const fullHook = `${setup} ${payoff}`;
if (fullHook.includes("**")) hardFails.push("hook contains markdown bold");
if (locale === "ko" && fullHook.includes(" — ")) hardFails.push("hook contains spaced em-dash");
if (locale === "ko" && fullHook.includes("그런데 한 가지")) hardFails.push("hook contains cliffhanger anti-pattern");

// AdSense-risky specifics
const FORBIDDEN = /로또\s*\d*등|\d+억|\d{2,3}%|서울 [가-힣]모|부산 [가-힣]모/;
if (FORBIDDEN.test(fullHook)) hardFails.push("hook contains forbidden specific");

// wrap line counts
if (setupLines.length > 2) softWarns.push(`setup wraps to ${setupLines.length} lines`);
if (payoffLines.length > 2) softWarns.push(`payoff wraps to ${payoffLines.length} lines`);

console.log("\n--- quality review ---");
console.log("hardFails:", hardFails.length ? hardFails : "none");
console.log("softWarns:", softWarns.length ? softWarns : "none");
if (hardFails.length) {
  console.error("\nBLOCKED: hard-fail checks failed");
  process.exit(1);
}

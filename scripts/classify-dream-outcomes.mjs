#!/usr/bin/env node
// Rule-based outcome classification for dream interpretation content.
// Scores each content file's 길몽/positive text against 8 outcome categories
// from data/x-queue/hook-library.json and writes data/x-queue/hooks/{slug}.json.
//
// Usage:
//   node scripts/classify-dream-outcomes.mjs                    # classify all
//   node scripts/classify-dream-outcomes.mjs --limit 10         # first 10 only
//   node scripts/classify-dream-outcomes.mjs --slug snake       # single slug
//   node scripts/classify-dream-outcomes.mjs --force            # overwrite existing

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const has = (flag) => args.includes(flag);
const limit = parseInt(getArg("--limit") || "0", 10);
const onlySlug = getArg("--slug");
const force = has("--force");
const verbose = has("--verbose");

const OUT_DIR = "data/x-queue/hooks";
fs.mkdirSync(OUT_DIR, { recursive: true });

// Keyword stems per category. Stems match substring-insensitive on Korean prose.
// Order/weight: exact category word (e.g. "재물") > strong signals > weak signals.
const KEYWORDS = {
  재물: [
    ["재물", 5], ["금전", 4], ["돈", 3], ["복권", 5], ["당첨", 5], ["횡재", 5],
    ["부자", 4], ["재산", 4], ["수익", 3], ["이익", 3], ["풍요", 3], ["부귀", 4],
    ["금전운", 5], ["재물운", 5], ["축재", 4], ["큰돈", 4], ["한턱", 2], ["로또", 5],
  ],
  출세: [
    ["승진", 5], ["합격", 5], ["출세", 5], ["성공", 3], ["명예", 4], ["지위", 4],
    ["인정", 3], ["결실", 3], ["성취", 4], ["시험", 3], ["업적", 4], ["영전", 4],
    ["입사", 4], ["취업", 4], ["사업", 2], ["번창", 3], ["직장운", 5], ["공직", 3],
  ],
  연애: [
    ["연애", 5], ["사랑", 4], ["인연", 4], ["짝", 3], ["애정", 4], ["결혼", 4],
    ["배우자", 4], ["이성", 3], ["커플", 3], ["만남", 2], ["로맨스", 4], ["짝사랑", 5],
    ["고백", 4], ["교제", 4], ["재회", 4],
  ],
  태몽: [
    ["태몽", 6], ["임신", 5], ["출산", 5], ["아이", 3], ["아기", 3], ["자손", 4],
    ["자식", 3], ["자녀", 4], ["득남", 5], ["득녀", 5], ["잉태", 5],
  ],
  새출발: [
    ["새출발", 6], ["새로운 시작", 5], ["전환점", 5], ["변화", 3], ["기회", 3],
    ["시작", 2], ["새 길", 4], ["출발", 3], ["개운", 4], ["새로운", 2], ["새 삶", 4],
    ["신호탄", 3], ["도약", 4], ["전환", 3],
  ],
  극복: [
    ["극복", 5], ["전화위복", 6], ["고비", 4], ["위기", 3], ["액운", 4], ["해방", 4],
    ["벗어", 3], ["이겨", 3], ["역경", 4], ["시련", 3], ["고난", 3], ["풀리", 2],
    ["털어", 2], ["뒤집", 3], ["역설", 3], ["반전", 3], ["한을", 3], ["액막이", 4],
  ],
  귀인: [
    ["귀인", 6], ["조력자", 5], ["도움", 2], ["인맥", 4], ["화해", 4], ["오해", 3],
    ["관계 회복", 4], ["인간관계", 3], ["협력", 3], ["후원", 4], ["은인", 5], ["지원", 2],
  ],
  건강: [
    ["건강", 5], ["병", 3], ["회복", 4], ["치유", 5], ["평안", 4], ["안정", 3],
    ["근심", 3], ["걱정", 2], ["마음의", 2], ["쾌유", 5], ["장수", 4], ["무병", 5],
    ["편안", 3], ["스트레스", 3],
  ],
};

const ALL_CATEGORIES = Object.keys(KEYWORDS);

function extractScoringText(content) {
  // Prefer the 길몽 section(s) and positive framing — that's where outcomes live.
  // Fall back to intro + conclusion if no explicit 길몽 section.
  const ko = content.ko || {};
  const sections = ko.sections || [];
  const positive = sections
    .filter((s) => /길몽|auspicious|positive|좋|긍정|중립/.test(s.heading || ""))
    .map((s) => `${s.heading} ${s.body || ""}`)
    .join("\n");

  // Always mix in intro + conclusion — they usually summarize both sides
  const context = [ko.intro, ko.conclusion].filter(Boolean).join("\n");
  return `${positive}\n${context}`;
}

function classify(text) {
  const scores = {};
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const [stem, weight] of kws) {
      // Count occurrences, cap each keyword's contribution at 3 hits
      const re = new RegExp(stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const hits = (text.match(re) || []).length;
      score += Math.min(hits, 3) * weight;
    }
    scores[cat] = score;
  }

  const ranked = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);

  // Return top 3, but drop any whose score is < 25% of the leader
  // Fallback for pure-흉몽 dreams: 극복 works for warning dreams that lead to overcoming.
  if (ranked.length === 0) return { categories: ["극복"], scores, fallback: true };
  const leader = ranked[0][1];
  const top = ranked
    .filter(([, s]) => s >= leader * 0.25)
    .slice(0, 3)
    .map(([c]) => c);
  return { categories: top, scores, fallback: false };
}

function walkContent() {
  const base = "data/content";
  const out = [];
  for (const cat of fs.readdirSync(base)) {
    const catDir = path.join(base, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const f of fs.readdirSync(catDir)) {
      if (!f.endsWith(".json")) continue;
      out.push({ category: cat, slug: f.replace(/\.json$/, ""), file: path.join(catDir, f) });
    }
  }
  return out;
}

const files = walkContent();
let pool = onlySlug ? files.filter((f) => f.slug === onlySlug) : files;
if (limit > 0) pool = pool.slice(0, limit);

console.log(`classifying ${pool.length} file(s)`);

const summary = { total: 0, written: 0, skipped: 0, fallback: 0, byCategory: {} };

for (const { category, slug, file } of pool) {
  summary.total++;
  const outPath = path.join(OUT_DIR, `${slug}.json`);
  if (!force && fs.existsSync(outPath)) {
    summary.skipped++;
    continue;
  }

  let content;
  try {
    content = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`skip ${slug}: parse error`);
    continue;
  }

  const text = extractScoringText(content);
  const { categories, scores, fallback } = classify(text);

  if (fallback) summary.fallback++;
  for (const c of categories) summary.byCategory[c] = (summary.byCategory[c] || 0) + 1;

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        slug,
        category,
        categories,
        scores,
        classifiedAt: new Date().toISOString(),
        method: "rule-based-v1",
      },
      null,
      2,
    ) + "\n",
  );
  summary.written++;

  if (verbose) console.log(`${slug} → ${categories.join(", ")}`);
}

console.log("\n--- summary ---");
console.log(JSON.stringify(summary, null, 2));

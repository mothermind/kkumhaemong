#!/usr/bin/env node
/**
 * Generate pipeline-status.html — visual dashboard of research vs content progress.
 * Usage: node scripts/pipeline-status.mjs
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const SKIP_SLUGS = new Set(["winning-lottery-dream", "car-accident-dream", "elevator-dream"]);
const CANONICAL_NOTE = {
  "winning-lottery-dream": "→ money",
  "car-accident-dream": "→ actions",
  "elevator-dream": "→ actions",
};

async function listSlugs(dir) {
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files.filter(f => f.endsWith(".json") && f !== "_plan.json").map(f => f.replace(".json", ""));
}

// Get all categories from research dir
const researchBase = "data/research";
const contentBase = "data/content";
const entries = await readdir(researchBase);
const categories = entries.filter(e => !e.startsWith("_") && !e.endsWith(".json"));
categories.sort();

const rows = [];
let totalResearch = 0, totalContent = 0, totalPending = 0;

for (const cat of categories) {
  const research = await listSlugs(path.join(researchBase, cat));
  const content = await listSlugs(path.join(contentBase, cat));
  const contentSet = new Set(content);

  const pending = research.filter(s => !contentSet.has(s) && !SKIP_SLUGS.has(s));
  const canonical = research.filter(s => SKIP_SLUGS.has(s));

  totalResearch += research.length;
  totalContent += content.length;
  totalPending += pending.length;

  rows.push({ cat, research: research.length, content: content.length, pending, canonical });
}

// Sort by pending desc
rows.sort((a, b) => b.pending.length - a.pending.length);

function pct(a, b) { return b === 0 ? 100 : Math.round((a / b) * 100); }

function categoryEmoji(cat) {
  const map = { animals:"🐍", body:"🫀", actions:"🏃", people:"👥", pregnancy:"🤰",
    objects:"📦", food:"🍚", places:"🏛️", money:"💰", death:"⚫", water:"🌊",
    nature:"🏔️", fire:"🔥", emotions:"💭", disasters:"⚡", celestial:"🌙",
    transportation:"🚗", marriage:"💍", colors:"🎨", insects:"🦋", clothing:"👘",
    numbers:"🔢", weather:"⛅", plants:"🌸", spirits:"👻" };
  return map[cat] ?? "✦";
}

const overallPct = pct(totalContent, totalResearch);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>꿈해몽 Pipeline Status</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0d1117; color: #e6edf3; padding: 24px; }
  h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: #7d8590; font-size: 0.85rem; margin-bottom: 28px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 16px 20px; }
  .card .label { font-size: 0.75rem; color: #7d8590; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .card .value { font-size: 1.8rem; font-weight: 700; }
  .card.green .value { color: #3fb950; }
  .card.yellow .value { color: #d29922; }
  .card.blue .value { color: #58a6ff; }
  .card.purple .value { color: #bc8cff; }
  .overall-bar { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 16px 20px; margin-bottom: 32px; }
  .overall-bar .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .bar-track { background: #21262d; border-radius: 99px; height: 10px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #238636, #3fb950); transition: width .3s; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  thead th { text-align: left; padding: 8px 12px; color: #7d8590; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #21262d; }
  tbody tr { border-bottom: 1px solid #161b22; }
  tbody tr:hover { background: #161b22; }
  td { padding: 10px 12px; vertical-align: middle; }
  .cat-name { font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .mini-bar { background: #21262d; border-radius: 99px; height: 6px; width: 100px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 8px; }
  .mini-fill { height: 100%; border-radius: 99px; }
  .fill-done { background: #3fb950; }
  .fill-partial { background: #d29922; }
  .fill-none { background: #da3633; }
  .badge { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 2px 7px; border-radius: 99px; }
  .badge-done { background: #238636; color: #fff; }
  .badge-pending { background: #9e6a03; color: #fff; }
  .badge-canonical { background: #1f6feb; color: #fff; }
  .pending-list { font-size: 0.75rem; color: #7d8590; margin-top: 4px; max-width: 400px; line-height: 1.6; }
  .ts { color: #484f58; font-size: 0.75rem; margin-top: 24px; }
  @media (max-width: 600px) { .summary { grid-template-columns: repeat(2,1fr); } .mini-bar { display: none; } }
</style>
</head>
<body>

<h1>꿈해몽 Pipeline Status</h1>
<p class="subtitle">Generated ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} KST</p>

<div class="summary">
  <div class="card blue"><div class="label">Research Files</div><div class="value">${totalResearch}</div></div>
  <div class="card green"><div class="label">Published Articles</div><div class="value">${totalContent}</div></div>
  <div class="card yellow"><div class="label">Content Pending</div><div class="value">${totalPending}</div></div>
  <div class="card purple"><div class="label">Overall Progress</div><div class="value">${overallPct}%</div></div>
</div>

<div class="overall-bar">
  <div class="top">
    <span style="font-weight:600">Total Progress</span>
    <span style="color:#7d8590">${totalContent} / ${totalResearch} articles</span>
  </div>
  <div class="bar-track"><div class="bar-fill" style="width:${overallPct}%"></div></div>
</div>

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Research</th>
      <th>Content</th>
      <th>Progress</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(({ cat, research, content, pending, canonical }) => {
      const p = pct(content, research - canonical.length);
      const fillClass = p === 100 ? "fill-done" : p > 0 ? "fill-partial" : "fill-none";
      const badge = pending.length === 0
        ? `<span class="badge badge-done">✓ Done</span>`
        : `<span class="badge badge-pending">${pending.length} pending</span>`;
      const canonicalNote = canonical.length > 0
        ? `<span class="badge badge-canonical" title="${canonical.map(s => CANONICAL_NOTE[s] ?? "canonical").join(", ")}" style="margin-left:4px">${canonical.length} canonical</span>`
        : "";
      const pendingList = pending.length > 0 && pending.length <= 20
        ? `<div class="pending-list">${pending.join(", ")}</div>` : "";
      return `
    <tr>
      <td><div class="cat-name">${categoryEmoji(cat)} ${cat}</div>${pendingList}</td>
      <td>${research}</td>
      <td>${content}</td>
      <td>
        <span class="mini-bar"><span class="mini-fill ${fillClass}" style="width:${p}%;display:block;height:100%"></span></span>
        ${p}%
      </td>
      <td>${badge}${canonicalNote}</td>
    </tr>`;
    }).join("")}
  </tbody>
</table>

<p class="ts">Run <code>node scripts/pipeline-status.mjs</code> to refresh</p>

</body>
</html>`;

await writeFile("pipeline-status.html", html, "utf8");
console.log(`✅ pipeline-status.html generated — ${totalContent}/${totalResearch} articles (${totalPending} pending)`);

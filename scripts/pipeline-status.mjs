#!/usr/bin/env node
/**
 * Generate pipeline-status.html — simple table dashboard.
 * Usage: node scripts/pipeline-status.mjs
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const canonicalMap = JSON.parse(await readFile("data/taxonomy/canonical-map.json", "utf8"));
const SKIP_SLUGS = new Set(Object.keys(canonicalMap.canonicals));

async function listSlugs(dir) {
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files.filter(f => f.endsWith(".json") && f !== "_plan.json").map(f => f.replace(".json", ""));
}

const researchBase = "data/research";
const contentBase  = "data/content";
const entries = await readdir(researchBase);
const categories = entries.filter(e => !e.startsWith("_") && !e.endsWith(".json")).sort();

const rows = [];
let totalTaxonomy = 0, totalResearch = 0, totalContent = 0, totalPending = 0, totalResearchPending = 0;

for (const cat of categories) {
  const research  = await listSlugs(path.join(researchBase, cat));
  const content   = await listSlugs(path.join(contentBase, cat));
  const contentSet = new Set(content);
  const pending   = research.filter(s => !contentSet.has(s) && !SKIP_SLUGS.has(s));
  const canonical = research.filter(s => SKIP_SLUGS.has(s));

  let taxonomy = 0;
  const taxFile = path.join("data/taxonomy", `${cat}.json`);
  if (existsSync(taxFile)) {
    const raw = JSON.parse(await readFile(taxFile, "utf8"));
    const arr = Array.isArray(raw) ? raw : raw.symbols ?? Object.values(raw).flat();
    taxonomy = arr.length;
  }

  const researchPending = taxonomy - research.length;

  totalTaxonomy        += taxonomy;
  totalResearch        += research.length;
  totalContent         += content.length;
  totalPending         += pending.length;
  totalResearchPending += researchPending;
  rows.push({ cat, taxonomy, research: research.length, content: content.length, pending, researchPending, canonical });
}

rows.sort((a, b) => b.pending.length - a.pending.length);

const ts = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Pipeline Status</title>
<style>
  body { font-family: ui-monospace, Menlo, monospace; font-size: 13px; background: #0d1117; color: #e6edf3; padding: 32px; }
  h1   { font-size: 14px; margin-bottom: 4px; }
  p    { color: #7d8590; font-size: 12px; margin-bottom: 20px; }
  table { border-collapse: collapse; }
  th { text-align: left; padding: 4px 20px 4px 0; color: #7d8590; font-weight: normal; border-bottom: 1px solid #30363d; }
  td { padding: 5px 20px 5px 0; border-bottom: 1px solid #21262d; }
  tr:hover td { color: #58a6ff; }
  .done    { color: #3fb950; }
  .pending { color: #d29922; }
  .muted   { color: #7d8590; }
  tfoot td { border-top: 1px solid #30363d; border-bottom: none; padding-top: 8px; font-weight: 600; }
</style>
</head>
<body>
<h1>꿈해몽 · Pipeline Status</h1>
<p>${ts} KST</p>
<table>
  <thead>
    <tr>
      <th>category</th>
      <th>taxonomy</th>
      <th>research</th>
      <th>content</th>
      <th>research gap</th>
      <th>content gap</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(({ cat, taxonomy, research, content, pending, researchPending }) => `<tr>
      <td>${cat}</td>
      <td class="muted">${taxonomy}</td>
      <td>${research}</td>
      <td class="${content === research ? "done" : ""}">${content}</td>
      <td class="${researchPending === 0 ? "done muted" : "pending"}">${researchPending === 0 ? "—" : researchPending}</td>
      <td class="${pending.length === 0 ? "done muted" : "pending"}">${pending.length === 0 ? "—" : pending.length}</td>
    </tr>`).join("\n    ")}
  </tbody>
  <tfoot>
    <tr>
      <td>total</td>
      <td class="muted">${totalTaxonomy}</td>
      <td>${totalResearch}</td>
      <td>${totalContent}</td>
      <td class="pending">${totalResearchPending}</td>
      <td class="pending">${totalPending}</td>
    </tr>
  </tfoot>
</table>
</body>
</html>`;

await writeFile("pipeline-status.html", html, "utf8");
console.log(`✅  ${totalContent}/${totalResearch} published · ${totalPending} pending`);

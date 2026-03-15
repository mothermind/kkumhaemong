#!/usr/bin/env node
/**
 * Build public/search-index.json from data/content files.
 * Run after any content changes: node scripts/build-search-index.mjs
 * Also hooked into `npm run build` via package.json prebuild.
 */

import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

function detectBadge(sections = []) {
  for (const s of sections) {
    const h = s.heading ?? "";
    if (h.includes("길몽") || /auspicious/i.test(h)) return "auspicious";
    if (h.includes("흉몽") || /inauspicious/i.test(h)) return "inauspicious";
  }
  return "neutral";
}

const files = await glob("data/content/**/*.json");

if (files.length === 0) {
  console.log("⚠️  No content files found — skipping search index rebuild (existing index preserved)");
  process.exit(0);
}

const index = [];

for (const file of files) {
  const raw = await readFile(file, "utf8");
  const data = JSON.parse(raw);

  const slug = data.slug ?? data.seo?.slug;
  const koreanSlug = data.seo?.koreanSlug ?? data.koreanSlug ?? "";
  const titleKo = data.ko?.title ?? "";
  const titleEn = data.en?.title ?? "";
  const tagsKo = data.seo?.naverSEO?.tags ?? [];
  const hero = data.images?.hero ?? null;
  const badgeType = detectBadge(data.ko?.sections ?? []);

  if (!slug) continue;

  index.push({ slug, koreanSlug, titleKo, titleEn, tagsKo, badgeType, hero });
}

// Sort alphabetically by slug for deterministic output
index.sort((a, b) => a.slug.localeCompare(b.slug));

const outPath = "public/search-index.json";
await writeFile(outPath, JSON.stringify(index), "utf8");
console.log(`✅ search-index.json — ${index.length} entries → ${outPath}`);

#!/usr/bin/env node
/**
 * Structural validation for content JSON files.
 * Checks: JSON validity, required fields, metaDescription lengths,
 * body vs content key, seo.relatedSlugs, FAQ count.
 *
 * Usage: node scripts/validate-structure.mjs [category]
 *   No args = all categories
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const BASE = "/Users/llnormll/WorkSpace/my-fortune-site/data/content";
const targetCategory = process.argv[2] || null;

const REQUIRED_LOCALE_FIELDS = ["title", "metaDescription", "h1", "intro", "sections", "variations", "faqs", "conclusion", "culturalContext"];
const REQUIRED_SEO_FIELDS = ["slug", "koreanSlug"];
const MIN_FAQS = 5;
const KO_META_MIN = 80, KO_META_MAX = 110;
const EN_META_MIN = 120, EN_META_MAX = 160;

const results = { valid: 0, invalid: 0, warnings: 0, errors: [], warnings_list: [], malformed: [] };

async function getCategories() {
  if (targetCategory) return [targetCategory];
  const entries = await readdir(BASE);
  return entries.filter(e => !e.startsWith(".") && !e.endsWith(".json")).sort();
}

async function validateFile(category, filename) {
  const slug = filename.replace(".json", "");
  const filePath = path.join(BASE, category, filename);
  const issues = [];
  const warns = [];

  // 1. JSON validity
  let data;
  try {
    const raw = await readFile(filePath, "utf8");
    data = JSON.parse(raw);
  } catch (e) {
    results.malformed.push({ category, slug, error: e.message });
    return;
  }

  // 2. Required locale fields
  for (const locale of ["ko", "en"]) {
    if (!data[locale]) {
      issues.push(`missing "${locale}" object`);
      continue;
    }
    for (const field of REQUIRED_LOCALE_FIELDS) {
      const val = data[locale][field];
      if (val === undefined || val === null) {
        issues.push(`${locale}.${field} missing`);
      } else if (typeof val === "string" && val.trim() === "") {
        issues.push(`${locale}.${field} empty string`);
      } else if (Array.isArray(val) && val.length === 0) {
        issues.push(`${locale}.${field} empty array`);
      }
    }

    // Check sections have "body" not "content"
    if (Array.isArray(data[locale].sections)) {
      for (let i = 0; i < data[locale].sections.length; i++) {
        const s = data[locale].sections[i];
        if (s.content && !s.body) {
          issues.push(`${locale}.sections[${i}] uses "content" instead of "body"`);
        }
        if (!s.heading) {
          warns.push(`${locale}.sections[${i}] missing heading`);
        }
        if (!s.body && !s.content) {
          issues.push(`${locale}.sections[${i}] missing body`);
        }
      }
    }

    // Check variations have "body" not "content"
    if (Array.isArray(data[locale].variations)) {
      for (let i = 0; i < data[locale].variations.length; i++) {
        const v = data[locale].variations[i];
        if (v.content && !v.body) {
          issues.push(`${locale}.variations[${i}] uses "content" instead of "body"`);
        }
      }
    }

    // metaDescription length
    if (data[locale].metaDescription) {
      const len = data[locale].metaDescription.length;
      const [min, max] = locale === "ko" ? [KO_META_MIN, KO_META_MAX] : [EN_META_MIN, EN_META_MAX];
      if (len < min) warns.push(`${locale}.metaDescription too short (${len}, min ${min})`);
      if (len > max) warns.push(`${locale}.metaDescription too long (${len}, max ${max})`);
    }

    // FAQ count
    if (Array.isArray(data[locale].faqs) && data[locale].faqs.length < MIN_FAQS) {
      warns.push(`${locale}.faqs only ${data[locale].faqs.length} (min ${MIN_FAQS})`);
    }
  }

  // 3. SEO fields
  if (!data.seo) {
    issues.push("missing seo object");
  } else {
    for (const f of REQUIRED_SEO_FIELDS) {
      if (!data.seo[f]) issues.push(`seo.${f} missing`);
    }
    // relatedSlugs should be in seo, not root
    if (!data.seo.relatedSlugs && data.relatedDreams) {
      issues.push("relatedDreams at root instead of seo.relatedSlugs");
    }
  }

  // 4. Images
  if (!data.images?.hero) {
    warns.push("images.hero missing");
  }

  if (issues.length > 0) {
    results.errors.push({ category, slug, issues });
  }
  if (warns.length > 0) {
    results.warnings_list.push({ category, slug, warnings: warns });
    results.warnings += warns.length;
  }
  if (issues.length === 0) {
    results.valid++;
  } else {
    results.invalid++;
  }
}

// Run
const categories = await getCategories();
let totalFiles = 0;

for (const cat of categories) {
  const dir = path.join(BASE, cat);
  if (!existsSync(dir)) continue;
  const files = (await readdir(dir)).filter(f => f.endsWith(".json"));
  totalFiles += files.length;
  for (const f of files) {
    await validateFile(cat, f);
  }
}

// Summary
console.log(`\n=== Structural Validation ===`);
console.log(`Total files: ${totalFiles}`);
console.log(`  ✅ Valid:    ${results.valid}`);
console.log(`  ❌ Errors:   ${results.invalid}`);
console.log(`  ⚠️  Warnings: ${results.warnings}`);
console.log(`  💀 Malformed: ${results.malformed.length}`);

if (results.malformed.length > 0) {
  console.log(`\n--- Malformed JSON ---`);
  for (const m of results.malformed) {
    console.log(`  ${m.category}/${m.slug}: ${m.error.split("\n")[0]}`);
  }
}

if (results.errors.length > 0) {
  console.log(`\n--- Errors ---`);
  for (const e of results.errors) {
    console.log(`  ${e.category}/${e.slug}:`);
    for (const i of e.issues) console.log(`    - ${i}`);
  }
}

if (results.warnings_list.length > 0) {
  console.log(`\n--- Warnings ---`);
  for (const w of results.warnings_list) {
    console.log(`  ${w.category}/${w.slug}:`);
    for (const warn of w.warnings) console.log(`    - ${warn}`);
  }
}

if (results.invalid === 0 && results.malformed.length === 0) {
  console.log(`\n✅ All ${totalFiles} files pass structural validation.`);
}

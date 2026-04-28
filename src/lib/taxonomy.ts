/**
 * Taxonomy data access utilities.
 * Reads from data/taxonomy/*.json — written by dream-taxonomy-agent.
 *
 * Uses fs/promises (Node.js compat mode on Cloudflare Workers via @opennextjs/cloudflare).
 * During build: Next.js reads files from disk.
 * At runtime: Cloudflare Workers Node.js compat provides fs access.
 */

import "server-only";
import { readFile } from "fs/promises";
import path from "path";

const TAXONOMY_DIR = path.join(process.cwd(), "data", "taxonomy");

export type TaxonomySymbol = {
  id: string;
  korean: string;
  english: string;
  slug: string;
  koreanSlug: string;
  category: string;
  subcategory: string;
  subcategoryKorean: string;
  related: string[];
  searchTier: "high" | "medium" | "longtail";
  naverKeywords: string[];
  googleKeywords: string[];
};

export type TaxonomyCategory = {
  category: string;
  korean: string;
  english: string;
  symbols: TaxonomySymbol[];
};

export type TaxonomyMeta = {
  version: string;
  generatedAt: string;
  totalSymbols: number;
  categories: Array<{
    id: string;
    korean: string;
    english: string;
    slug: string;
    symbolCount: number;
    subcategories: string[];
  }>;
};

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function getTaxonomyMeta(): Promise<TaxonomyMeta | null> {
  return readJson<TaxonomyMeta>(path.join(TAXONOMY_DIR, "_meta.json"));
}

export async function getTaxonomyCategory(
  category: string
): Promise<TaxonomyCategory | null> {
  // Sanitize to prevent path traversal
  const safe = category.replace(/[^a-zA-Z0-9_-]/g, "");
  return readJson<TaxonomyCategory>(path.join(TAXONOMY_DIR, `${safe}.json`));
}

export async function getAllSlugs(): Promise<
  Array<{ slug: string; koreanSlug: string }>
> {
  const meta = await getTaxonomyMeta();
  if (!meta?.categories.length) return [];

  const results: Array<{ slug: string; koreanSlug: string }> = [];

  for (const cat of meta.categories) {
    const data = await getTaxonomyCategory(cat.id);
    if (!data) continue;
    for (const symbol of data.symbols) {
      results.push({ slug: symbol.slug, koreanSlug: symbol.koreanSlug });
    }
  }

  return results;
}

export async function getSymbolBySlug(
  slug: string,
  locale: "ko" | "en",
  // Optional content-existence guard for the "ko" branch only.
  // When provided, a koreanSlug match is skipped if the validator resolves false,
  // allowing iteration to continue to the next duplicate entry.
  validator?: (symbol: TaxonomySymbol) => Promise<boolean>
): Promise<TaxonomySymbol | null> {
  const meta = await getTaxonomyMeta();
  if (!meta) return null;

  for (const cat of meta.categories) {
    const data = await getTaxonomyCategory(cat.id);
    if (!data) continue;

    if (locale === "ko" && validator) {
      for (const s of data.symbols) {
        if (s.koreanSlug !== slug) continue;
        const valid = await validator(s);
        if (valid) return s;
      }
    } else {
      const match = data.symbols.find((s) =>
        locale === "ko" ? s.koreanSlug === slug : s.slug === slug
      );
      if (match) return match;
    }
  }

  return null;
}

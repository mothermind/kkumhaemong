/**
 * Content data access utilities.
 * Reads from data/content/{slug}.json — written by dream-content-agent.
 *
 * Uses fs/promises (Node.js compat mode on Cloudflare Workers via @opennextjs/cloudflare).
 */

import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import type { Locale } from "@/i18n/routing";
import { getSymbolBySlug } from "./taxonomy";

const CONTENT_DIR = path.join(process.cwd(), "data", "content");

export type ContentSection = {
  type: string;
  heading: string;
  body: string;
  imageRef?: string;
};

export type ContentVariation = {
  keyword: string;
  heading: string;
  body: string;
};

export type ContentFAQ = {
  question: string;
  answer: string;
};

export type LocaleContent = {
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: ContentSection[];
  variations: ContentVariation[];
  culturalContext: string;
  faqs: ContentFAQ[];
  conclusion: string;
};

export type DreamContent = {
  ko: LocaleContent;
  en: LocaleContent;
  images: {
    hero?: string;
    sections?: Record<string, string>;
  };
  seo: {
    slug: string;
    koreanSlug: string;
    ogTitle: { ko: string; en: string };
    ogDescription: { ko: string; en: string };
    ogImage?: string;
    structuredData: {
      faqSchema: object | null;
      articleSchema: object | null;
    };
    hreflang: { ko: string; en: string };
    relatedSlugs?: string[];
    naverSEO: { blogPostTitle: string; tags: string[] };
  };
};

export async function getContent(
  slug: string,
  locale: Locale
): Promise<DreamContent | null> {
  const resolvedSlug = await resolveToEnglishSlug(slug, locale);
  if (!resolvedSlug) return null;

  // Sanitize to prevent path traversal
  const safe = resolvedSlug.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    const raw = await readFile(path.join(CONTENT_DIR, `${safe}.json`), "utf-8");
    return JSON.parse(raw) as DreamContent;
  } catch {
    return null;
  }
}

// Korean pages use koreanSlug in the URL — resolve to english slug for file lookup
async function resolveToEnglishSlug(
  slug: string,
  locale: Locale
): Promise<string | null> {
  if (locale === "en") return slug;

  const symbol = await getSymbolBySlug(slug, "ko");
  return symbol?.slug ?? null;
}

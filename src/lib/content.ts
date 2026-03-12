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
  /** Bilingual western psychology section (Freud/Jung/modern/cross-cultural). Markdown string. */
  westernContext?: string;
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

export type ContentPreview = {
  slug: string;
  koreanSlug: string;
  title: { ko: string; en: string };
  excerpt: { ko: string; en: string };
  heroImage?: string;
  badgeType: "auspicious" | "inauspicious" | "neutral";
};

function detectBadge(heading: string): ContentPreview["badgeType"] {
  if (heading.includes("길몽") || /auspicious/i.test(heading)) return "auspicious";
  if (heading.includes("흉몽") || /inauspicious/i.test(heading)) return "inauspicious";
  return "neutral";
}

export async function getAvailableContentSlugs(): Promise<string[]> {
  try {
    const { readdir } = await import("fs/promises");
    const slugs: string[] = [];
    const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        slugs.push(entry.name.replace(".json", ""));
      } else if (entry.isDirectory()) {
        const subEntries = await readdir(path.join(CONTENT_DIR, entry.name), { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.isFile() && sub.name.endsWith(".json")) {
            slugs.push(sub.name.replace(".json", ""));
          }
        }
      }
    }
    return slugs;
  } catch {
    return [];
  }
}

async function findContentFilePath(safe: string): Promise<string | null> {
  const { access, readdir } = await import("fs/promises");
  const direct = path.join(CONTENT_DIR, `${safe}.json`);
  try {
    await access(direct);
    return direct;
  } catch {
    // not in root, search one level of subdirectories
  }
  try {
    const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const candidate = path.join(CONTENT_DIR, entry.name, `${safe}.json`);
        try {
          await access(candidate);
          return candidate;
        } catch {
          continue;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getContentPreviews(slugs?: string[]): Promise<ContentPreview[]> {
  const targetSlugs = slugs ?? (await getAvailableContentSlugs());
  const previews: ContentPreview[] = [];
  for (const slug of targetSlugs) {
    try {
      const safe = slug.replace(/[^a-zA-Z0-9_-]/g, "");
      const filePath = await findContentFilePath(safe);
      if (!filePath) continue;
      const raw = await readFile(filePath, "utf-8");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = JSON.parse(raw) as any;
      const firstHeading = data?.ko?.sections?.[0]?.heading ?? "";
      previews.push({
        slug,
        koreanSlug: data?.seo?.koreanSlug ?? "",
        title: { ko: data?.ko?.title ?? "", en: data?.en?.title ?? "" },
        excerpt: {
          ko: (data?.ko?.intro ?? "").slice(0, 130).trim() + "…",
          en: (data?.en?.intro ?? "").slice(0, 130).trim() + "…",
        },
        heroImage: data?.images?.hero,
        badgeType: detectBadge(firstHeading),
      });
    } catch {
      continue;
    }
  }
  return previews;
}

export async function getContent(
  slug: string,
  locale: Locale
): Promise<DreamContent | null> {
  const resolvedSlug = await resolveToEnglishSlug(slug, locale);
  if (!resolvedSlug) return null;

  // Sanitize to prevent path traversal
  const safe = resolvedSlug.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    const filePath = await findContentFilePath(safe);
    if (!filePath) return null;
    const raw = await readFile(filePath, "utf-8");
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

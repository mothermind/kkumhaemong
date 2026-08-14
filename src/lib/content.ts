/**
 * Content data access utilities.
 * Reads from Firestore collection "dreams", document ID = english slug.
 */

import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import type { Locale } from "@/i18n/routing";
import { getSymbolBySlug } from "./taxonomy";
import { getFirestore } from "./firestore";

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

function detectBadge(sections: { heading?: string }[]): ContentPreview["badgeType"] {
  // First match wins — the section that appears first sets the primary tone
  for (const s of sections) {
    const h = s.heading ?? "";
    if (h.includes("길몽") || /auspicious/i.test(h)) return "auspicious";
    if (h.includes("흉몽") || /inauspicious/i.test(h)) return "inauspicious";
  }
  return "neutral";
}

export async function getTopDreamsByViews(limit = 18): Promise<ContentPreview[]> {
  try {
    const db = getFirestore();
    const snap = await db
      .collection("dreams")
      .orderBy("views", "desc")
      .limit(limit)
      .get();

    return snap.docs.map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = doc.data() as any;
      const sections = data?.ko?.sections ?? [];
      return {
        slug: doc.id,
        koreanSlug: data?.seo?.koreanSlug ?? "",
        title: { ko: data?.ko?.title ?? "", en: data?.en?.title ?? "" },
        excerpt: {
          ko: (data?.ko?.intro ?? "").slice(0, 130).trim() + "…",
          en: (data?.en?.intro ?? "").slice(0, 130).trim() + "…",
        },
        heroImage: data?.images?.hero,
        badgeType: detectBadge(sections),
      };
    });
  } catch {
    return [];
  }
}

export async function getAvailableContentSlugs(): Promise<string[]> {
  try {
    const db = getFirestore();
    const refs = await db.collection("dreams").listDocuments();
    return refs.map((r) => r.id);
  } catch {
    return [];
  }
}

// Memoized set of slugs that exist in Firestore — populated on first successful call.
// Fix for ba0baa8 regression: only cache a non-empty result. An empty list (Firestore
// error or transient failure) must NOT be memoized — doing so poisons the cache for
// the function instance's lifetime and makes hasContent() return false for every slug,
// causing every KO page to 404.
let _contentSlugCache: Set<string> | null = null;

async function getContentSlugSet(): Promise<Set<string>> {
  if (_contentSlugCache) return _contentSlugCache;
  const slugs = await getAvailableContentSlugs();
  // Only memoize when we got real data. An empty result means Firestore was
  // unavailable — return a transient set so the next request retries.
  if (slugs.length > 0) {
    _contentSlugCache = new Set(slugs);
    return _contentSlugCache;
  }
  return new Set();
}

/**
 * Returns true if the english slug has a corresponding Firestore document.
 *
 * Fails open: when the slug list cannot be fetched (Firestore error → empty list),
 * returns true so KO slug resolution lets the request proceed. A genuine phantom
 * slug will still 404 downstream when getContent() fetches the doc and finds nothing.
 * "Cannot verify" must not be treated the same as "confirmed absent".
 */
export async function hasContent(slug: string): Promise<boolean> {
  const set = await getContentSlugSet();
  // Empty set means we could not verify — fail open (treat as present).
  if (set.size === 0) return true;
  return set.has(slug);
}

export async function getContentPreviews(slugs?: string[]): Promise<ContentPreview[]> {
  try {
    const db = getFirestore();
    const targetSlugs = slugs ?? (await getAvailableContentSlugs());

    // Fetch in parallel batches of 30 (Firestore `in` query limit)
    const batches: string[][] = [];
    for (let i = 0; i < targetSlugs.length; i += 30) {
      batches.push(targetSlugs.slice(i, i + 30));
    }

    const results = await Promise.all(
      batches.map((batch) =>
        db.collection("dreams")
          .where(FieldPath.documentId(), "in", batch)
          .get()
      )
    );

    const previews: ContentPreview[] = [];
    for (const snap of results) {
      for (const doc of snap.docs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = doc.data() as any;
        const sections = data?.ko?.sections ?? [];
        previews.push({
          slug: doc.id,
          koreanSlug: data?.seo?.koreanSlug ?? "",
          title: { ko: data?.ko?.title ?? "", en: data?.en?.title ?? "" },
          excerpt: {
            ko: (data?.ko?.intro ?? "").slice(0, 130).trim() + "…",
            en: (data?.en?.intro ?? "").slice(0, 130).trim() + "…",
          },
          heroImage: data?.images?.hero,
          badgeType: detectBadge(sections),
        });
      }
    }
    return previews;
  } catch {
    return [];
  }
}

export async function getContent(
  slug: string,
  locale: Locale
): Promise<DreamContent | null> {
  const resolvedSlug = await resolveToEnglishSlug(slug, locale);
  if (!resolvedSlug) return null;

  // Sanitize slug
  const safe = resolvedSlug.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    const db = getFirestore();
    const doc = await db.collection("dreams").doc(safe).get();
    if (!doc.exists) return null;
    return doc.data() as DreamContent;
  } catch {
    return null;
  }
}

// Korean pages use koreanSlug in the URL — resolve to english slug for Firestore lookup.
// The validator skips taxonomy entries whose english slug has no Firestore content,
// allowing duplicate koreanSlug entries to fall through to the real article.
async function resolveToEnglishSlug(
  slug: string,
  locale: Locale
): Promise<string | null> {
  if (locale === "en") return slug;

  const symbol = await getSymbolBySlug(slug, "ko", async (s) => hasContent(s.slug));
  return symbol?.slug ?? null;
}

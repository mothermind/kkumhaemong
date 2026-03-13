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

function detectBadge(heading: string): ContentPreview["badgeType"] {
  if (heading.includes("길몽") || /auspicious/i.test(heading)) return "auspicious";
  if (heading.includes("흉몽") || /inauspicious/i.test(heading)) return "inauspicious";
  return "neutral";
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

export async function getContentPreviews(slugs?: string[]): Promise<ContentPreview[]> {
  try {
    const db = getFirestore();
    const targetSlugs = slugs ?? (await getAvailableContentSlugs());

    // Fetch in batches of 10 (Firestore `in` query limit)
    const previews: ContentPreview[] = [];
    for (let i = 0; i < targetSlugs.length; i += 10) {
      const batch = targetSlugs.slice(i, i + 10);
      const snap = await db
        .collection("dreams")
        .where(FieldPath.documentId(), "in", batch)
        .get();

      for (const doc of snap.docs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = doc.data() as any;
        const firstHeading = data?.ko?.sections?.[0]?.heading ?? "";
        previews.push({
          slug: doc.id,
          koreanSlug: data?.seo?.koreanSlug ?? "",
          title: { ko: data?.ko?.title ?? "", en: data?.en?.title ?? "" },
          excerpt: {
            ko: (data?.ko?.intro ?? "").slice(0, 130).trim() + "…",
            en: (data?.en?.intro ?? "").slice(0, 130).trim() + "…",
          },
          heroImage: data?.images?.hero,
          badgeType: detectBadge(firstHeading),
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

// Korean pages use koreanSlug in the URL — resolve to english slug for Firestore lookup
async function resolveToEnglishSlug(
  slug: string,
  locale: Locale
): Promise<string | null> {
  if (locale === "en") return slug;

  const symbol = await getSymbolBySlug(slug, "ko");
  return symbol?.slug ?? null;
}

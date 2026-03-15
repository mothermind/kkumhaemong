import type { MetadataRoute } from "next";
import { getAllSlugs, getTaxonomyMeta } from "@/lib/taxonomy";

const BASE_URL = "https://www.kkumhaemong.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push(
    { url: `${BASE_URL}/ko`, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/en`, lastModified: new Date(), priority: 0.9 }
  );

  // Explore index pages
  entries.push(
    { url: `${BASE_URL}/ko/탐색`, lastModified: new Date(), priority: 0.85 },
    { url: `${BASE_URL}/en/explore`, lastModified: new Date(), priority: 0.8 }
  );

  // Explore category pages
  const meta = await getTaxonomyMeta();
  if (meta) {
    for (const cat of meta.categories) {
      entries.push(
        {
          url: `${BASE_URL}/ko/탐색/${cat.slug}`,
          lastModified: new Date(),
          priority: 0.75,
        },
        {
          url: `${BASE_URL}/en/explore/${cat.slug}`,
          lastModified: new Date(),
          priority: 0.7,
        }
      );
    }
  }

  // Dream article pages
  const slugs = await getAllSlugs();
  for (const { slug, koreanSlug } of slugs) {
    entries.push(
      {
        url: `${BASE_URL}/ko/꿈해몽/${encodeURIComponent(koreanSlug)}`,
        lastModified: new Date(),
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/en/dream/${slug}`,
        lastModified: new Date(),
        priority: 0.8,
      }
    );
  }

  return entries;
}

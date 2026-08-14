import { getContent } from "@/lib/content";
import { RelatedDreamLink } from "@/components/dream/RelatedDreamLink";
import type { Locale } from "@/i18n/routing";

type Props = {
  heading: string;
  slugs: string[];
  locale: Locale;
};

export async function RelatedDreams({ heading, slugs, locale }: Props) {
  if (!slugs?.length) return null;

  const related = await Promise.all(
    slugs.slice(0, 6).map(async (slug) => {
      const content = await getContent(slug, "en");
      if (!content) return null;
      const c = locale === "ko" ? content.ko : content.en;
      return {
        // Locale-specific slug used for the route.
        slug: locale === "ko" ? content.seo.koreanSlug : content.seo.slug,
        // Canonical english slug — used for tracking so aggregation keys survive
        // sanitization (Korean characters get stripped by /[^a-zA-Z0-9_-]/g).
        trackSlug: content.seo.slug,
        title: c.h1,
        hero: content.images?.hero,
      };
    })
  );

  const valid = related.filter(Boolean) as Array<{
    slug: string;
    trackSlug: string;
    title: string;
    hero?: string;
  }>;

  if (!valid.length) return null;

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2
        className="text-[1.6rem] font-bold tracking-tight text-text-primary mb-6"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {heading}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {valid.map((item) => (
          <RelatedDreamLink
            key={item.slug}
            href={item.slug}
            title={item.title}
            hero={item.hero}
            trackSlug={item.trackSlug}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

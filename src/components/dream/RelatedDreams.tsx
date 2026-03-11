import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
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
      const content = await getContent(slug, locale);
      if (!content) return null;
      const c = locale === "ko" ? content.ko : content.en;
      return {
        slug: locale === "ko" ? content.seo.koreanSlug : content.seo.slug,
        title: c.h1,
        hero: content.images?.hero,
      };
    })
  );

  const valid = related.filter(Boolean) as Array<{
    slug: string;
    title: string;
    hero?: string;
  }>;

  if (!valid.length) return null;

  return (
    <section className="mt-16 pt-10 border-t border-stone-200 dark:border-stone-800">
      <h2
        className="text-[1.6rem] font-bold tracking-tight text-stone-900 mb-6 dark:text-stone-100"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {heading}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {valid.map((item) => (
          <Link
            key={item.slug}
            href={{
              pathname: "/dream/[slug]",
              params: { slug: item.slug },
            }}
            className="group rounded-xl border border-stone-200 bg-stone-50 p-3 transition-all hover:border-amber-400 hover:bg-amber-50/50 dark:border-stone-800/60 dark:bg-stone-900/60 dark:hover:border-amber-800/50 dark:hover:bg-amber-950/20"
          >
            {item.hero && (
              <div className="mb-3 h-20 w-full overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800">
                <img
                  src={item.hero}
                  alt={item.title}
                  className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity dark:opacity-80"
                />
              </div>
            )}
            <p className="text-sm font-medium text-stone-600 leading-snug transition-colors group-hover:text-amber-800 dark:text-stone-400 dark:group-hover:text-amber-200">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

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

  // Fetch titles for related dreams (up to 6)
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
    <section className="mt-10">
      <h2 className="mb-5 text-xl font-semibold">{heading}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {valid.map((item) => (
          <Link
            key={item.slug}
            href={{
              pathname: "/dream/[slug]",
              params: { slug: item.slug },
            }}
            className="group rounded-xl border border-gray-200 p-3 transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            {item.hero && (
              <div className="mb-2 h-20 w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={item.hero}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

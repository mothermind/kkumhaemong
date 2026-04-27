import Image from "next/image";
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
      const content = await getContent(slug, "en");
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
    <section className="mt-16 pt-10 border-t border-border">
      <h2
        className="text-[1.6rem] font-bold tracking-tight text-text-primary mb-6"
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
            className="group rounded-xl border border-border bg-surface/20 light:bg-black/[0.03] p-3 transition-all hover:border-gold/30 hover:bg-surface/40 light:hover:bg-black/[0.06]"
          >
            {item.hero && (
              <div className="relative mb-3 h-20 w-full overflow-hidden rounded-lg bg-white/10">
                <Image
                  src={item.hero}
                  alt={item.title}
                  fill
                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            )}
            <p className="text-sm font-medium text-text-muted leading-snug transition-colors group-hover:text-gold">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

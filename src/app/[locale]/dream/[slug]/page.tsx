import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getContent } from "@/lib/content";
import { getAllSlugs } from "@/lib/taxonomy";
import { DreamHero } from "@/components/dream/DreamHero";
import { DreamSection } from "@/components/dream/DreamSection";
import { DreamVariations } from "@/components/dream/DreamVariations";
import { DreamFAQ } from "@/components/dream/DreamFAQ";
import { RelatedDreams } from "@/components/dream/RelatedDreams";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  // Returns both ko (koreanSlug) and en (englishSlug) params
  return slugs.flatMap(({ slug, koreanSlug }) => [
    { locale: "en", slug },
    { locale: "ko", slug: koreanSlug },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale as Locale);
  if (!content) return {};

  const { seo } = content;

  return {
    title: locale === "ko" ? content.ko.title : content.en.title,
    description:
      locale === "ko"
        ? content.ko.metaDescription
        : content.en.metaDescription,
    alternates: {
      canonical: seo.hreflang[locale as Locale],
      languages: {
        ko: seo.hreflang.ko,
        en: seo.hreflang.en,
      },
    },
    openGraph: {
      title: seo.ogTitle[locale as Locale],
      description: seo.ogDescription[locale as Locale],
      images: seo.ogImage ? [seo.ogImage] : [],
    },
  };
}

export default async function DreamPage({ params }: Props) {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale as Locale);

  if (!content) notFound();

  const t = await getTranslations({ locale, namespace: "dream" });
  const c = locale === "ko" ? content.ko : content.en;

  // JSON-LD structured data
  const jsonLd = [
    content.seo.structuredData.faqSchema,
    content.seo.structuredData.articleSchema,
  ].filter(Boolean);

  return (
    <>
      {/* Structured data */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Hero: image + title + 길몽/흉몽 badge */}
        <DreamHero
          title={c.h1}
          intro={c.intro}
          heroImage={content.images?.hero}
          locale={locale as Locale}
        />

        {/* Ad slot — top */}
        <div className="my-6 rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-400">
          {/* Ad: top placement */}
        </div>

        {/* Interpretation sections (길몽 / 흉몽 / neutral) */}
        {c.sections.map((section, i) => (
          <DreamSection
            key={i}
            heading={section.heading}
            body={section.body}
            type={section.type}
            image={section.imageRef ? content.images?.sections?.[section.imageRef] : undefined}
          />
        ))}

        {/* Ad slot — mid */}
        <div className="my-6 rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-400">
          {/* Ad: mid placement */}
        </div>

        {/* Variations: long-tail SEO sections */}
        <DreamVariations
          heading={t("variations")}
          variations={c.variations}
        />

        {/* Cultural context */}
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold">{t("culturalContext")}</h2>
          <p className="leading-relaxed text-gray-700">{c.culturalContext}</p>
        </section>

        {/* FAQ */}
        <DreamFAQ heading={t("faq")} faqs={c.faqs} />

        {/* Ad slot — bottom */}
        <div className="my-6 rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-400">
          {/* Ad: bottom placement */}
        </div>

        {/* Related dreams */}
        <RelatedDreams
          heading={t("relatedDreams")}
          slugs={content.seo.relatedSlugs ?? []}
          locale={locale as Locale}
        />
      </article>
    </>
  );
}

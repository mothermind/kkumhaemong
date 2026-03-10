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
import { MarkdownBody } from "@/components/dream/MarkdownBody";
import { TableOfContents } from "@/components/dream/TableOfContents";
import { ReadingProgress } from "@/components/dream/ReadingProgress";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
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
    description: locale === "ko" ? content.ko.metaDescription : content.en.metaDescription,
    alternates: {
      canonical: seo.hreflang[locale as Locale],
      languages: { ko: seo.hreflang.ko, en: seo.hreflang.en },
    },
    openGraph: {
      title: seo.ogTitle[locale as Locale],
      description: seo.ogDescription[locale as Locale],
      images: seo.ogImage ? [seo.ogImage] : [],
    },
  };
}

function detectSectionType(heading: string): "auspicious" | "inauspicious" | "neutral" {
  if (heading.includes("길몽") || /auspicious/i.test(heading)) return "auspicious";
  if (heading.includes("흉몽") || /inauspicious/i.test(heading)) return "inauspicious";
  return "neutral";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBody(item: any): string {
  return item.content ?? item.body ?? "";
}

function toId(str: string) {
  return str.replace(/[^a-zA-Z0-9가-힣]/g, "-").replace(/-+/g, "-").slice(0, 40);
}

export default async function DreamPage({ params }: Props) {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale as Locale);
  if (!content) notFound();

  const t = await getTranslations({ locale, namespace: "dream" });
  const c = locale === "ko" ? content.ko : content.en;

  const jsonLd = [
    content.seo.structuredData.faqSchema,
    content.seo.structuredData.articleSchema,
  ].filter(Boolean);

  // Build TOC items
  const sectionIds = c.sections.map((s) => toId(s.heading));
  const variationsId = "variations";
  const culturalId = "cultural-context";
  const westernId = "western-context";
  const faqId = "faq";

  const tocItems = [
    ...c.sections.map((s, i) => ({ id: sectionIds[i], label: s.heading })),
    { id: variationsId, label: t("variations") },
    { id: culturalId, label: t("culturalContext") },
    ...(c.westernContext
      ? [{ id: westernId, label: locale === "ko" ? "서양 심리학적 해석" : "Western Psychological Perspectives" }]
      : []),
    { id: faqId, label: t("faq") },
  ];

  return (
    <>
      <ReadingProgress />

      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <DreamHero
          title={c.h1}
          intro={c.intro}
          heroImage={content.images?.hero}
          locale={locale as Locale}
        />

        {/* Divider */}
        <div className="my-10 border-t border-white/10" />

        <TableOfContents items={tocItems} locale={locale} />

        {c.sections.map((section, i) => (
          <DreamSection
            key={i}
            id={sectionIds[i]}
            heading={section.heading}
            body={getBody(section)}
            type={(section as any).type ?? detectSectionType(section.heading)}
            locale={locale}
            image={content.images?.sections?.[
              (section as any).imageRef ?? detectSectionType(section.heading)
            ]}
          />
        ))}

        <DreamVariations
          id={variationsId}
          heading={t("variations")}
          variations={c.variations.map((v) => ({
            keyword: (v as any).keyword ?? "",
            heading: v.heading,
            body: getBody(v),
          }))}
        />

        <section id={culturalId} className="mt-[72px] scroll-mt-20">
          <span className="inline-block mb-3 rounded-full px-3 py-[0.28rem] text-xs font-semibold tracking-wide bg-white/5 text-gray-500">
            {locale === "ko" ? "문화적 배경" : "Cultural Context"}
          </span>
          <h2 className="font-serif-ko mb-5 text-[22px] font-semibold tracking-tight text-white">{t("culturalContext")}</h2>
          <MarkdownBody className="text-gray-400 leading-8">{c.culturalContext}</MarkdownBody>
        </section>

        {c.westernContext && (
          <section id={westernId} className="mt-[72px] scroll-mt-20">
            <span className="inline-block mb-3 rounded-full px-3 py-[0.28rem] text-xs font-semibold tracking-wide bg-white/5 text-gray-500">
              {locale === "ko" ? "심리학적 해석" : "Psychology"}
            </span>
            <h2 className="font-serif-ko mb-5 text-[22px] font-semibold tracking-tight text-white">
              {locale === "ko" ? "서양 심리학적 해석" : "Western Psychological Perspectives"}
            </h2>
            <MarkdownBody className="text-gray-400 leading-8">{c.westernContext}</MarkdownBody>
          </section>
        )}

        <DreamFAQ id={faqId} heading={t("faq")} faqs={c.faqs} />

        {c.conclusion && (
          <section className="mt-12 border-t border-white/10 pt-8">
            <MarkdownBody className="text-gray-500 italic leading-8">{c.conclusion}</MarkdownBody>
          </section>
        )}

        <RelatedDreams
          heading={t("relatedDreams")}
          slugs={content.seo.relatedSlugs ?? []}
          locale={locale as Locale}
        />
      </article>
    </>
  );
}

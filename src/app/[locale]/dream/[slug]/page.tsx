import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getContent } from "@/lib/content";
import { LocaleSlugUpdater } from "@/components/layout/LocaleSlugContext";
import { DreamHero } from "@/components/dream/DreamHero";
import { DreamSection } from "@/components/dream/DreamSection";
import { DreamVariations } from "@/components/dream/DreamVariations";
import { DreamFAQ } from "@/components/dream/DreamFAQ";
import { RelatedDreams } from "@/components/dream/RelatedDreams";
import { MarkdownBody } from "@/components/dream/MarkdownBody";
import { TableOfContents } from "@/components/dream/TableOfContents";
import { ReadingProgress } from "@/components/dream/ReadingProgress";
import { ViewTracker } from "@/components/dream/ViewTracker";
import { LuckyNumbers } from "@/components/dream/LuckyNumbers";
import type { Locale } from "@/i18n/routing";

export const revalidate = 86400; // revalidate cached pages every 24h
export const dynamicParams = true; // render unknown slugs on demand

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const BASE_URL = "https://www.kkumhaemong.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale as Locale);
  if (!content) return {};
  const { seo } = content;

  // Construct canonical URLs from the www base + locale slugs.
  // Stored seo.hreflang values point to apex (kkumhaemong.com) — do NOT use them.
  const koPath = `/ko/꿈해몽/${seo.koreanSlug}`;
  const enPath = `/en/dream/${seo.slug}`;
  const canonical = locale === "ko" ? `${BASE_URL}${koPath}` : `${BASE_URL}${enPath}`;

  return {
    title: locale === "ko" ? content.ko.title : content.en.title,
    description: locale === "ko" ? content.ko.metaDescription : content.en.metaDescription,
    alternates: {
      canonical,
      languages: {
        ko: `${BASE_URL}${koPath}`,
        en: `${BASE_URL}${enPath}`,
        "x-default": `${BASE_URL}${enPath}`,
      },
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
      <LocaleSlugUpdater ko={content.seo.koreanSlug} en={content.seo.slug} />
      <ReadingProgress />
      <ViewTracker slug={content.seo.slug} />

      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <DreamHero
          title={c.h1}
          intro={c.intro}
          heroImage={content.images?.hero}
          locale={locale as Locale}
        />

        {/* Divider */}
        <div className="my-0" />

        <TableOfContents items={tocItems} locale={locale} />

        {(() => {
          const usedImageKeys = new Set<string>();
          return c.sections.map((section, i) => {
            const imageKey = (section as any).imageRef ?? detectSectionType(section.heading);
            const image = !usedImageKeys.has(imageKey)
              ? content.images?.sections?.[imageKey]
              : undefined;
            if (image) usedImageKeys.add(imageKey);
            return (
              <DreamSection
                key={i}
                id={sectionIds[i]}
                heading={section.heading}
                body={getBody(section)}
                type={(section as any).type ?? detectSectionType(section.heading)}
                image={image}
              />
            );
          });
        })()}

        <LuckyNumbers slug={content.seo.slug} locale={locale} />

        <DreamVariations
          id={variationsId}
          heading={t("variations")}
          variations={c.variations.map((v) => ({
            keyword: (v as any).keyword ?? "",
            heading: v.heading,
            body: getBody(v),
          }))}
        />

        <section id={culturalId} className="mt-16 scroll-mt-20">
          <h2 className="text-[1.6rem] font-bold tracking-tight text-text-primary mb-6" style={{ fontFamily: 'var(--font-serif)' }}>{t("culturalContext")}</h2>
          <MarkdownBody className="">{c.culturalContext}</MarkdownBody>
        </section>

        {c.westernContext && (
          <section id={westernId} className="mt-16 scroll-mt-20">
            <h2 className="text-[1.6rem] font-bold tracking-tight text-text-primary mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              {locale === "ko" ? "서양 심리학적 해석" : "Western Psychological Perspectives"}
            </h2>
            <MarkdownBody className="">{c.westernContext}</MarkdownBody>
          </section>
        )}

        <DreamFAQ id={faqId} heading={t("faq")} faqs={c.faqs} />

        {c.conclusion && (
          <section className="mt-16 border-t border-border pt-8">
            <MarkdownBody className="italic [&_p]:text-text-muted">{c.conclusion}</MarkdownBody>
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

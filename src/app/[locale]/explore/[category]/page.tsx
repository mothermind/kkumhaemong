import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getTaxonomyCategory } from "@/lib/taxonomy";
import { getContentPreviews, getAvailableContentSlugs } from "@/lib/content";
import { CategoryDreamList } from "@/components/explore/CategoryDreamList";
import type { EnrichedPreview } from "@/components/explore/CategoryDreamList";

type Props = { params: Promise<{ locale: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const data = await getTaxonomyCategory(category);
  if (!data) return {};
  return {
    title:
      locale === "ko"
        ? `${data.korean} 꿈해몽 - 꿈해몽`
        : `${data.english} Dream Meanings - Kkumhaemong`,
  };
}

export default async function CategoryExplorePage({ params }: Props) {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: "explore" });

  const [taxData, availableSlugs] = await Promise.all([
    getTaxonomyCategory(category),
    getAvailableContentSlugs(),
  ]);

  if (!taxData) notFound();

  const availableSet = new Set(availableSlugs);

  // Symbols in this category that have content — preserve taxonomy order, deduplicate by slug
  const seenSlugs = new Set<string>();
  const symbolsWithContent = taxData.symbols.filter((s) => {
    if (!availableSet.has(s.slug) || seenSlugs.has(s.slug)) return false;
    seenSlugs.add(s.slug);
    return true;
  });
  const slugsWithContent = symbolsWithContent.map((s) => s.slug);

  const previews = await getContentPreviews(slugsWithContent);
  const previewMap = new Map(previews.map((p) => [p.slug, p]));

  // Enrich with subcategory metadata from taxonomy
  const enriched: EnrichedPreview[] = symbolsWithContent
    .map((sym) => {
      const preview = previewMap.get(sym.slug);
      if (!preview) return null;
      return {
        ...preview,
        subcategory: sym.subcategory,
        subcategoryLabel: locale === "ko"
          ? (sym.subcategoryKorean || sym.subcategory)
          : sym.subcategory.replace(/-/g, " "),
      };
    })
    .filter(Boolean) as EnrichedPreview[];

  const comingSoonCount = taxData.symbols.length - slugsWithContent.length;
  const categoryName = locale === "ko" ? taxData.korean : taxData.english;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Back link */}
      <Link
        href="/explore"
        locale={locale as Locale}
        className="mb-8 inline-block text-sm text-slate-500 transition hover:text-gold"
      >
        {t("backToExplore")}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[2rem] font-bold text-white"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {categoryName}
          {locale === "ko" ? " 꿈해몽" : " Dream Meanings"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {t("availableCount", { count: enriched.length })}
          {comingSoonCount > 0 && (
            <span className="ml-2 text-slate-500">
              · {comingSoonCount}{locale === "ko" ? "개 준비 중" : " more coming soon"}
            </span>
          )}
        </p>
      </div>

      {/* Filtered dream list */}
      {enriched.length > 0 ? (
        <CategoryDreamList
          items={enriched}
          locale={locale as Locale}
          allLabel={locale === "ko" ? "전체" : "All"}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-slate-500">
            {locale === "ko"
              ? "이 카테고리의 꿈해몽을 열심히 준비 중입니다."
              : "Dream interpretations for this category are coming soon."}
          </p>
        </div>
      )}
    </div>
  );
}

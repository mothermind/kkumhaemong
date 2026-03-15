import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTaxonomyCategory } from "@/lib/taxonomy";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = {
  params: Promise<{ locale: string; category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const data = await getTaxonomyCategory(category);
  if (!data) return {};

  const name = locale === "ko" ? data.korean : data.english;

  return {
    title:
      locale === "ko"
        ? `${name} 꿈해몽 - ${name} 꿈의 의미 총정리`
        : `${name} Dream Meanings - Korean Dream Interpretation`,
    description:
      locale === "ko"
        ? `${name}에 관한 모든 꿈해몽을 확인하세요. 길몽, 흉몽 구분과 함께 상세히 정리했습니다.`
        : `Explore all Korean dream interpretations related to ${name.toLowerCase()}. Auspicious and inauspicious meanings explained.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category } = await params;
  const data = await getTaxonomyCategory(category);

  if (!data) notFound();

  const t = await getTranslations({ locale, namespace: "category" });
  const name = locale === "ko" ? data.korean : data.english;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
        {locale === "ko" ? `${name} 꿈해몽` : `${name} Dream Meanings`}
      </h1>
      <p className="mb-8 text-gray-500">
        {t("symbolCount", { count: data.symbols.length })}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.symbols.map((symbol) => (
          <Link
            key={symbol.id}
            href={{
              pathname: "/dream/[slug]",
              params: {
                slug: locale === "ko" ? symbol.koreanSlug : symbol.slug,
              },
            }}
            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <span className="font-medium">
              {locale === "ko" ? symbol.korean : symbol.english}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                symbol.searchTier === "high"
                  ? "bg-amber-100 text-amber-700"
                  : symbol.searchTier === "medium"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {symbol.searchTier}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

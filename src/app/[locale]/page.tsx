import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { CategoryGrid } from "@/components/category/CategoryGrid";
import { getTaxonomyMeta } from "@/lib/taxonomy";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: {
        ko: "/ko",
        en: "/en",
      },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const meta = await getTaxonomyMeta();

  return <HomePageClient locale={locale as Locale} categories={meta?.categories ?? []} />;
}

// Client component for translations
function HomePageClient({
  locale,
  categories,
}: {
  locale: Locale;
  categories: Array<{ id: string; korean: string; english: string; slug: string; symbolCount: number }>;
}) {
  const t = useTranslations("home");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
          {t("description")}
        </p>
      </section>

      {/* Category grid */}
      <section>
        <h2 className="mb-6 text-xl font-semibold sm:text-2xl">
          {t("allCategories")}
        </h2>
        <CategoryGrid locale={locale} categories={categories} />
      </section>
    </div>
  );
}

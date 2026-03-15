import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getTaxonomyMeta, getTaxonomyCategory } from "@/lib/taxonomy";
import { getAvailableContentSlugs } from "@/lib/content";

type Props = { params: Promise<{ locale: string }> };

const CATEGORY_ICONS: Record<string, string> = {
  animals: "🐍",
  body: "🫀",
  actions: "🏃",
  people: "👥",
  pregnancy: "🤰",
  objects: "📦",
  food: "🍚",
  places: "🏛️",
  money: "💰",
  death: "⚫",
  water: "🌊",
  nature: "🏔️",
  fire: "🔥",
  emotions: "💭",
  disasters: "⚡",
  celestial: "🌙",
  transportation: "🚗",
  marriage: "💍",
  colors: "🎨",
  insects: "🦋",
  clothing: "👘",
  numbers: "🔢",
  weather: "⛅",
  plants: "🌸",
  spirits: "👻",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo ? "꿈 탐색 - 꿈해몽" : "Dream Explorer - Kkumhaemong";
  const description = isKo
    ? "동물, 행동, 태몽, 재물 등 카테고리별로 꿈해몽을 찾아보세요. 길몽·흉몽 구분과 함께 상세한 한국 전통 꿈 해석을 제공합니다."
    : "Browse Korean dream interpretations by category — animals, actions, pregnancy, money and more. Find auspicious and inauspicious meanings.";
  const canonical = isKo
    ? "https://kkumhaemong.com/ko/탐색"
    : "https://kkumhaemong.com/en/explore";

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ko: "https://kkumhaemong.com/ko/탐색",
        en: "https://kkumhaemong.com/en/explore",
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "explore" });

  const [meta, availableSlugs] = await Promise.all([
    getTaxonomyMeta(),
    getAvailableContentSlugs(),
  ]);

  const availableSet = new Set(availableSlugs);

  // Count actual content per category in parallel
  const categoryData = await Promise.all(
    (meta?.categories ?? []).map((cat) => getTaxonomyCategory(cat.id))
  );
  const contentCountMap = new Map<string, number>();
  (meta?.categories ?? []).forEach((cat, i) => {
    const data = categoryData[i];
    const count = data?.symbols.filter((s) => availableSet.has(s.slug)).length ?? 0;
    contentCountMap.set(cat.id, count);
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-[2rem] font-bold text-text-primary"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {t("title")}
        </h1>
        <p className="mt-2 text-text-muted">{t("subtitle")}</p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {meta?.categories.map((cat) => {
          const contentCount = contentCountMap.get(cat.id) ?? 0;

          return (
            <Link
              key={cat.id}
              href={{ pathname: "/explore/[category]", params: { category: cat.id } }}
              locale={locale as Locale}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-surface/20 light:bg-black/[0.03] px-4 py-5 transition-all hover:border-gold/30 hover:bg-surface/40 light:hover:bg-black/[0.06]"
            >
              <span className="text-2xl">{CATEGORY_ICONS[cat.id] ?? "✦"}</span>
              <div>
                <p
                  className="font-bold text-text-primary"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {locale === "ko" ? cat.korean : cat.english}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {contentCount}{locale === "ko" ? "개" : " articles"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

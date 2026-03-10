"use client";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const CATEGORY_EMOJIS: Record<string, string> = {
  animals: "🐾",
  people: "👥",
  nature: "🌿",
  food: "🍚",
  objects: "📦",
  places: "🏞️",
  actions: "🏃",
  body: "🫀",
  numbers: "🔢",
  colors: "🎨",
  clothing: "👘",
  transportation: "🚂",
  weather: "⛅",
  plants: "🌸",
  death: "🕯️",
  money: "💰",
  marriage: "💍",
  pregnancy: "🤰",
  spirits: "👻",
  disasters: "⚡",
  emotions: "💭",
  celestial: "🌙",
  water: "🌊",
  fire: "🔥",
  insects: "🦋",
};

type Category = {
  id: string;
  korean: string;
  english: string;
  slug: string;
  symbolCount: number;
};

export function CategoryGrid({
  locale,
  categories,
}: {
  locale: Locale;
  categories: Category[];
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
        {locale === "ko"
          ? "카테고리를 불러오는 중..."
          : "Loading categories..."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={{
            pathname: "/category/[category]",
            params: { category: cat.slug },
          }}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 p-4 text-center transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <span className="text-3xl">{CATEGORY_EMOJIS[cat.id] ?? "✨"}</span>
          <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600">
            {locale === "ko" ? cat.korean : cat.english}
          </span>
          <span className="text-xs text-gray-400">{cat.symbolCount}개</span>
        </Link>
      ))}
    </div>
  );
}

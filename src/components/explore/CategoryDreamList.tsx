"use client";

import { useState } from "react";
import { DreamCard } from "@/components/dream/DreamCard";
import type { ContentPreview } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export type EnrichedPreview = ContentPreview & {
  subcategory: string;
  subcategoryLabel: string; // localized
};

type Props = {
  items: EnrichedPreview[];
  locale: Locale;
  allLabel: string;       // "전체" / "All"
};

const PAGE_SIZE = 20;

export function CategoryDreamList({ items, locale, allLabel }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Build unique subcategory list preserving order of first appearance
  const subcategories = Array.from(
    new Map(items.map((i) => [i.subcategory, i.subcategoryLabel])).entries()
  );

  const filtered = active ? items.filter((i) => i.subcategory === active) : items;
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  function handleFilterChange(slug: string | null) {
    setActive(slug);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      {/* Filter pills — only show when there are multiple subcategories */}
      {subcategories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange(null)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              active === null
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
            }`}
          >
            {allLabel}
          </button>
          {subcategories.map(([slug, label]) => (
            <button
              key={slug}
              onClick={() => handleFilterChange(active === slug ? null : slug)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                active === slug
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Dream cards */}
      <div className="space-y-6">
        {visible.map((preview) => (
          <DreamCard key={preview.slug} preview={preview} locale={locale} />
        ))}
      </div>

      {/* Load more */}
      {remaining > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="inline-block px-8 py-3 border border-border text-text-primary text-sm tracking-widest hover:bg-text-primary hover:text-bg transition-all duration-300"
          >
            {locale === "ko"
              ? `더 보기 (+${Math.min(remaining, PAGE_SIZE)})`
              : `LOAD MORE (+${Math.min(remaining, PAGE_SIZE)})`}
          </button>
        </div>
      )}
    </>
  );
}

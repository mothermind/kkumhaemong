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

export function CategoryDreamList({ items, locale, allLabel }: Props) {
  const [active, setActive] = useState<string | null>(null);

  // Build unique subcategory list preserving order of first appearance
  const subcategories = Array.from(
    new Map(items.map((i) => [i.subcategory, i.subcategoryLabel])).entries()
  );

  const filtered = active ? items.filter((i) => i.subcategory === active) : items;

  return (
    <>
      {/* Filter pills — only show when there are multiple subcategories */}
      {subcategories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActive(null)}
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
              onClick={() => setActive(active === slug ? null : slug)}
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
        {filtered.map((preview) => (
          <DreamCard key={preview.slug} preview={preview} locale={locale} />
        ))}
      </div>
    </>
  );
}

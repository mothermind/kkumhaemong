"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { track } from "@/lib/track";

type Props = {
  categoryId: string;
  icon: string;
  name: string;
  count: number;
  countLabel: string;
  locale: Locale;
};

export function CategoryCard({ categoryId, icon, name, count, countLabel, locale }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <Link
      href={{ pathname: "/explore/[category]", params: { category: categoryId } }}
      locale={locale}
      onClick={() => {
        setLoading(true);
        track({ type: "explore_nav", slug: categoryId, locale });
      }}
      className={`group flex flex-col gap-3 rounded-xl border border-border bg-surface/20 light:bg-black/[0.03] px-4 py-5 transition-all hover:border-gold/30 hover:bg-surface/40 light:hover:bg-black/[0.06] ${
        loading ? "opacity-60 scale-[0.97]" : ""
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p
          className="font-bold text-text-primary"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {name}
        </p>
        <p className="mt-0.5 text-xs text-text-muted flex items-center gap-1.5">
          {loading ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
              <span className="text-gold/70">{countLabel}</span>
            </>
          ) : (
            countLabel
          )}
        </p>
      </div>
    </Link>
  );
}

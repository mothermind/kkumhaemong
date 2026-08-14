"use client";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { track } from "@/lib/track";

type Props = {
  categoryId: string;
  label: string;
  locale: Locale;
};

/** Homepage category chip — client component so it can fire explore_nav on click. */
export function CategoryChip({ categoryId, label, locale }: Props) {
  return (
    <Link
      href={{ pathname: "/explore/[category]", params: { category: categoryId } }}
      locale={locale}
      onClick={() => track({ type: "explore_nav", slug: categoryId, locale })}
      className="px-6 py-2 rounded-full border border-border bg-surface/30 light:bg-white/20 light:text-white light:border-white/30 hover:bg-gold hover:text-midnight transition-all"
    >
      {label}
    </Link>
  );
}

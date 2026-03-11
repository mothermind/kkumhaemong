import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ContentPreview } from "@/lib/content";

type Props = {
  preview: ContentPreview;
  locale: Locale;
};

const BADGE_STYLES = {
  auspicious: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
  inauspicious: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
  neutral: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

const BADGE_LABELS: Record<ContentPreview["badgeType"], { ko: string; en: string }> = {
  auspicious: { ko: "길몽", en: "Auspicious" },
  inauspicious: { ko: "흉몽", en: "Inauspicious" },
  neutral: { ko: "중립", en: "Neutral" },
};

export function DreamCard({ preview, locale }: Props) {
  const { slug, koreanSlug, title, excerpt, heroImage, badgeType } = preview;
  const href =
    locale === "ko"
      ? { pathname: "/dream/[slug]" as const, params: { slug: koreanSlug } }
      : { pathname: "/dream/[slug]" as const, params: { slug } };

  return (
    <Link
      href={href}
      locale={locale}
      className="group flex items-start gap-4 rounded-xl border border-stone-200 bg-white px-4 py-4 transition-colors hover:border-amber-300 dark:border-stone-800/60 dark:bg-stone-900/40 dark:hover:border-amber-800/50"
    >
      {/* Thumbnail */}
      <div className="relative h-[72px] w-[108px] shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
        {heroImage ? (
          <Image src={heroImage} alt={locale === "ko" ? title.ko : title.en} fill className="object-cover" sizes="108px" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-amber-50 to-stone-200 dark:from-stone-700 dark:to-stone-800" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1.5 flex items-center gap-2">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_STYLES[badgeType]}`}>
            {BADGE_LABELS[badgeType][locale]}
          </span>
        </div>
        <h3
          className="line-clamp-1 text-[1rem] font-bold leading-snug text-stone-900 dark:text-stone-100"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {locale === "ko" ? title.ko : title.en}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          {locale === "ko" ? excerpt.ko : excerpt.en}
        </p>
      </div>
    </Link>
  );
}

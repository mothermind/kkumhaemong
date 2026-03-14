import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ContentPreview } from "@/lib/content";

type Props = {
  preview: ContentPreview;
  locale: Locale;
};

const BADGE_STYLES = {
  auspicious: "bg-green-500/20 text-green-400",
  inauspicious: "bg-red-500/20 text-red-400",
  neutral: "",
};

const BADGE_LABELS: Record<ContentPreview["badgeType"], { ko: string; en: string }> = {
  auspicious: { ko: "길몽", en: "Auspicious" },
  inauspicious: { ko: "흉몽", en: "Inauspicious" },
  neutral: { ko: "", en: "" },
};

const BLUR_PLACEHOLDER = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAIAAgBAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABQQG/8QAIRAAAQQCAwEBAQAAAAAAAAAAAQIDBBESITFBUWH/2gAIAQEAAD8Az2pRbXXe2bnU6T4S5QFiMMrPEzpk9PoFpH0T7j1R8T3gbFDrp/vn/9k=";

export function DreamCard({ preview, locale }: Props) {
  const { slug, koreanSlug, title, excerpt, heroImage, badgeType } = preview;
  const href =
    locale === "ko"
      ? { pathname: "/dream/[slug]" as const, params: { slug: koreanSlug } }
      : { pathname: "/dream/[slug]" as const, params: { slug } };

  const badgeLabel = BADGE_LABELS[badgeType][locale];

  return (
    <Link
      href={href}
      locale={locale}
      className="group flex items-center gap-3 md:gap-5 p-3 md:p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-gold/30 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-14 md:w-20 md:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={locale === "ko" ? title.ko : title.en}
            fill
            quality={85}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="80px"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/10" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {badgeLabel && (
          <span className={`inline-block px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 md:mb-1.5 ${BADGE_STYLES[badgeType]}`}>
            {badgeLabel}
          </span>
        )}
        <h3 className="text-sm md:text-base font-semibold text-white group-hover:text-gold transition-colors duration-300 leading-snug line-clamp-1">
          {locale === "ko" ? title.ko : title.en}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 line-clamp-1 mt-0.5 md:mt-1 leading-relaxed">
          {locale === "ko" ? excerpt.ko : excerpt.en}
        </p>
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 flex-shrink-0 text-white/20 group-hover:text-gold/60 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

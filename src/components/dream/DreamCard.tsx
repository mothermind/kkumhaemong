import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ContentPreview } from "@/lib/content";

type Props = {
  preview: ContentPreview;
  locale: Locale;
};

const BADGE_STYLES = {
  auspicious: "bg-green-500/20 text-green-300",
  inauspicious: "bg-red-500/20 text-red-300",
  neutral: "bg-black/10 text-text-muted",
};

const BADGE_LABELS: Record<ContentPreview["badgeType"], { ko: string; en: string }> = {
  auspicious: { ko: "길몽", en: "Auspicious" },
  inauspicious: { ko: "흉몽", en: "Inauspicious" },
  neutral: { ko: "중립", en: "Neutral" },
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
      className="group relative flex h-40 overflow-hidden rounded-xl border border-white/5 hover:border-gold/30 transition-all duration-300"
    >
      {/* Full-bleed image */}
      {heroImage ? (
        <Image
          src={heroImage}
          alt={locale === "ko" ? title.ko : title.en}
          fill
          quality={85}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 672px"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Text pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 ${BADGE_STYLES[badgeType]}`}>
          {badgeLabel}
        </span>
        <h3
          className="text-[15px] font-semibold text-white group-hover:text-gold transition-colors duration-300 leading-snug line-clamp-1"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
        >
          {locale === "ko" ? title.ko : title.en}
        </h3>
        <p
          className="text-xs text-slate-300 line-clamp-1 mt-0.5 leading-relaxed"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
        >
          {locale === "ko" ? excerpt.ko : excerpt.en}
        </p>
      </div>
    </Link>
  );
}

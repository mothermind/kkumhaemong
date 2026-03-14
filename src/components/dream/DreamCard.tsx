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
      className="group flex gap-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-gold/30 transition-all cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={locale === "ko" ? title.ko : title.en}
            width={192}
            height={192}
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAIAAgBAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABQQG/8QAIRAAAQQCAwEBAQAAAAAAAAAAAQIDBBESITFBUWH/2gAIAQEAAD8Az2pRbXXe2bnU6T4S5QFiMMrPEzpk9PoFpH0T7j1R8T3gbFDrp/vn/9k="
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="96px"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/10" />
        )}
      </div>

      {/* Text */}
      <div className="flex-grow min-w-0">
        {badgeLabel && (
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${BADGE_STYLES[badgeType]}`}>
            {badgeLabel}
          </span>
        )}
        <h3
          className="text-lg font-semibold text-white group-hover:text-gold transition-colors leading-snug"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {locale === "ko" ? title.ko : title.en}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mt-1 font-light leading-relaxed">
          {locale === "ko" ? excerpt.ko : excerpt.en}
        </p>
      </div>
    </Link>
  );
}

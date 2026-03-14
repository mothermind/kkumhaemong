import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getContentPreviews } from "@/lib/content";
import { DreamCard } from "@/components/dream/DreamCard";
import { AdSlot } from "@/components/common/AdSlot";
import { SearchBar } from "@/components/home/SearchBar";

type Props = { params: Promise<{ locale: string }> };

// Ordered by traffic priority
const POPULAR_SLUGS = [
  "flying-dream",
  "falling-dream",
  "being-chased-dream",
  "taking-exam-dream",
  "giving-birth-dream",
  "fishing-dream",
  "drowning-dream",
  "climbing-mountain-dream",
  "crying-dream",
  "fighting-dream",
  "running-dream",
  "driving-dream",
  "eating-dream",
  "swimming-dream",
  "kissing-dream",
  "winning-dream",
  "dancing-dream",
  "sex-dream",
];

const CATEGORY_CHIPS = [
  { slug: "animals", ko: "동물 (Animals)", en: "Animals" },
  { slug: "actions", ko: "행동 (Actions)", en: "Actions" },
  { slug: "pregnancy", ko: "태몽 (Pregnancy)", en: "Pregnancy" },
  { slug: "money", ko: "재물 (Money)", en: "Money" },
  { slug: "death", ko: "죽음 (Death)", en: "Death" },
  { slug: "marriage", ko: "사랑 (Love)", en: "Love" },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const previews = await getContentPreviews(POPULAR_SLUGS);
  const ordered = POPULAR_SLUGS
    .map((s) => previews.find((p) => p.slug === s))
    .filter(Boolean) as typeof previews;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden -mt-20">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/home/hero_01.png"
            alt="꿈해몽 배경"
            fill
            priority
            quality={90}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>

        {/* Floating content */}
        <div className="relative z-10 text-center px-4 max-w-4xl animate-float">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white whitespace-pre-line"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {t("tagline")}
          </h1>
          <p className="text-lg md:text-xl font-light text-slate-300 mb-12 tracking-wide">
            {t("heroSubtitle")}
          </p>

          {/* Search bar */}
          <div className="mb-16">
            <SearchBar
              locale={locale as Locale}
              placeholder={t("searchPlaceholder")}
              buttonLabel={t("searchButton")}
            />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {CATEGORY_CHIPS.map((chip) => (
              <Link
                key={chip.slug}
                href={{ pathname: "/explore/[category]", params: { category: chip.slug } }}
                locale={locale as Locale}
                className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-gold hover:text-midnight transition-all"
              >
                {locale === "ko" ? chip.ko : chip.en}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-40">
          <div className="w-px h-16 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ── Popular Dreams ── */}
      <section className="py-24 bg-midnight">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-12 text-center">
            <span className="text-gold text-xs uppercase tracking-widest font-bold">
              Trending Interpretation
            </span>
            <h2
              className="text-3xl font-bold mt-2 text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {t("popularDreams")}
            </h2>
          </div>

          <div className="space-y-6">
            {ordered.map((preview, i) => (
              <>
                <DreamCard key={preview.slug} preview={preview} locale={locale as Locale} />
                {(i + 1) % 6 === 0 && i < ordered.length - 1 && (
                  <AdSlot key={`ad-${i}`} />
                )}
              </>
            ))}
          </div>

          {/* View all CTA */}
          <div className="pt-12 text-center">
            <Link
              href="/explore"
              locale={locale as Locale}
              className="inline-block px-8 py-3 border border-white/20 text-sm tracking-widest hover:bg-white hover:text-midnight transition-all duration-300"
            >
              {t("exploreCta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

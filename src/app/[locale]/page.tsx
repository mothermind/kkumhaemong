import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getContentPreviews, getTopDreamsByViews } from "@/lib/content";
import { DreamCard } from "@/components/dream/DreamCard";
import { SearchBar } from "@/components/home/SearchBar";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const isKo = locale === "ko";
  const canonical = isKo ? "https://www.kkumhaemong.com/ko" : "https://www.kkumhaemong.com/en";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: {
        ko: "https://www.kkumhaemong.com/ko",
        en: "https://www.kkumhaemong.com/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonical,
      siteName: "꿈해몽 Kkumhaemong",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.jpg"],
    },
  };
}

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
  { slug: "animals", ko: "동물", en: "Animals" },
  { slug: "actions", ko: "행동", en: "Actions" },
  { slug: "pregnancy", ko: "태몽", en: "Pregnancy" },
  { slug: "money", ko: "재물", en: "Money" },
  { slug: "death", ko: "죽음", en: "Death" },
  { slug: "marriage", ko: "사랑", en: "Love" },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  // Use live view counts if available; fall back to curated list for cold start
  let ordered = await getTopDreamsByViews(18);
  if (ordered.length < 6) {
    const previews = await getContentPreviews(POPULAR_SLUGS);
    ordered = POPULAR_SLUGS
      .map((s) => previews.find((p) => p.slug === s))
      .filter(Boolean) as typeof previews;
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center -mt-20">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/home/hero_05.png"
            alt="꿈해몽 배경"
            fill
            priority
            quality={90}
            className="object-cover light:brightness-110"
            sizes="100vw"
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>

        {/* Floating content */}
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white light:text-slate-900 whitespace-pre-line"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {t("tagline")}
          </h1>
          <p className="text-lg md:text-xl font-light text-slate-300 light:text-slate-900 mb-12 tracking-wide">
            {t("heroSubtitle")}
          </p>

          {/* Search bar */}
          <div className="mb-16">
            <SearchBar
              locale={locale as Locale}
              placeholder={t("searchPlaceholder")}
              placeholderShort={t("searchPlaceholderShort")}
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
                className="px-6 py-2 rounded-full border border-border bg-surface/30 light:bg-white/20 light:text-white light:border-white/30 hover:bg-gold hover:text-midnight transition-all"
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
      <section className="py-24 bg-midnight light:bg-[#f5f0e8]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-12 text-center">
            <span className="text-gold text-xs uppercase tracking-widest font-bold">
              Trending Interpretation
            </span>
            <h2
              className="text-3xl font-bold mt-2 text-text-primary"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {t("popularDreams")}
            </h2>
          </div>

          <div className="space-y-6">
            {ordered.map((preview) => (
              <DreamCard key={preview.slug} preview={preview} locale={locale as Locale} />
            ))}
          </div>

          {/* View all CTA */}
          <div className="pt-12 text-center">
            <Link
              href="/explore"
              locale={locale as Locale}
              className="inline-block px-8 py-3 border border-border text-text-primary text-sm tracking-widest hover:bg-text-primary hover:text-bg transition-all duration-300"
            >
              {t("exploreCta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

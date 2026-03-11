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
  { slug: "animals", ko: "🐍 동물꿈", en: "🐍 Animals" },
  { slug: "actions", ko: "🏃 행동꿈", en: "🏃 Actions" },
  { slug: "pregnancy", ko: "🤰 임신·태몽", en: "🤰 Pregnancy" },
  { slug: "money", ko: "💰 돈·재물", en: "💰 Money" },
  { slug: "death", ko: "⚫ 죽음꿈", en: "⚫ Death" },
  { slug: "marriage", ko: "💍 연애·결혼", en: "💍 Love" },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  // Load previews in priority order, skip missing
  const previews = await getContentPreviews(POPULAR_SLUGS);
  const ordered = POPULAR_SLUGS
    .map((s) => previews.find((p) => p.slug === s))
    .filter(Boolean) as typeof previews;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 pb-16 pt-24">
        {/* Background image */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/images/home/hero.png"
            alt="꿈해몽 배경"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Gradient overlay — top dark for header contrast, center lighter for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-900/60 to-stone-950/80" />
        </div>

        {/* Hero content */}
        <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
          <h1
            className="text-[2.4rem] font-bold leading-tight text-white sm:text-[3rem]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {t("tagline")}
          </h1>
          <p className="text-sm text-white/60 sm:text-base">{t("subtitle")}</p>
          <SearchBar
            locale={locale as Locale}
            placeholder={t("searchPlaceholder")}
            buttonLabel={t("searchButton")}
          />
        </div>

        {/* Category chips at bottom of hero */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORY_CHIPS.map((chip) => (
              <Link
                key={chip.slug}
                href={{ pathname: "/explore/[category]", params: { category: chip.slug } }}
                locale={locale as Locale}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm transition hover:border-amber-400/60 hover:bg-white/15 hover:text-white"
              >
                {locale === "ko" ? chip.ko : chip.en}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Dreams ── */}
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h2
          className="mb-6 text-[1.4rem] font-bold text-stone-900 dark:text-stone-100"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {t("popularDreams")}
        </h2>

        <div className="space-y-3">
          {ordered.map((preview, i) => (
            <>
              <DreamCard key={preview.slug} preview={preview} locale={locale as Locale} />
              {/* Ad every 6 items */}
              {(i + 1) % 6 === 0 && i < ordered.length - 1 && (
                <AdSlot key={`ad-${i}`} />
              )}
            </>
          ))}
        </div>

        {/* CTA to explorer */}
        <div className="mt-10 text-center">
          <Link
            href="/explore"
            locale={locale as Locale}
            className="inline-block rounded-xl border border-amber-300 px-6 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-50 dark:border-amber-800/50 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            {t("exploreCta")}
          </Link>
        </div>
      </section>
    </>
  );
}

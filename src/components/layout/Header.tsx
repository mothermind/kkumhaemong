"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/95 backdrop-blur-sm dark:border-stone-800/60 dark:bg-stone-950/95">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-amber-800 dark:text-amber-200" style={{ fontFamily: 'var(--font-serif)' }}>꿈해몽</span>
          {locale === "en" && (
            <span className="hidden text-sm text-stone-400 sm:block">
              Korean Dream Dictionary
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link href="/" className="text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
            {t("home")}
          </Link>
          <Link
            href={{ pathname: "/category/[category]", params: { category: "animals" } }}
            className="text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            {t("categories")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle locale={locale} />
        </div>
      </div>
    </header>
  );
}

function LanguageToggle({ locale }: { locale: Locale }) {
  const t = useTranslations("language");
  const pathname = usePathname();
  const params = useParams();
  const targetLocale: Locale = locale === "ko" ? "en" : "ko";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let href: any = pathname;
  if (params.slug) {
    href = { pathname: "/dream/[slug]", params: { slug: params.slug } };
  } else if (params.category) {
    href = { pathname: "/category/[category]", params: { category: params.category } };
  }

  return (
    <Link
      href={href}
      locale={targetLocale}
      className="rounded-full border border-stone-300 px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-amber-500 hover:text-amber-800 dark:border-stone-700 dark:text-stone-400 dark:hover:border-amber-700/60 dark:hover:text-amber-200"
    >
      <span className="opacity-60">{t("current")}</span>
      <span className="mx-1 opacity-30">·</span>
      <span>{t("toggle")}</span>
    </Link>
  );
}

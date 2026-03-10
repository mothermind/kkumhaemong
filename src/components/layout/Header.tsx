"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-indigo-600">꿈해몽</span>
          {locale === "en" && (
            <span className="hidden text-sm text-gray-500 sm:block">
              Korean Dream Dictionary
            </span>
          )}
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link
            href="/"
            className="text-gray-600 transition-colors hover:text-indigo-600"
          >
            {t("home")}
          </Link>
          <Link
            href={{ pathname: "/category/[category]", params: { category: "animals" } }}
            className="text-gray-600 transition-colors hover:text-indigo-600"
          >
            {t("categories")}
          </Link>
        </nav>

        {/* Language toggle */}
        <LanguageToggle locale={locale} />
      </div>
    </header>
  );
}

function LanguageToggle({ locale }: { locale: Locale }) {
  const t = useTranslations("language");
  const pathname = usePathname();
  const targetLocale: Locale = locale === "ko" ? "en" : "ko";

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={pathname as any}
      locale={targetLocale}
      className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-400 hover:text-indigo-600"
    >
      <span className="text-xs opacity-60">{t("current")}</span>
      <span className="text-gray-300">·</span>
      <span>{t("toggle")}</span>
    </Link>
  );
}

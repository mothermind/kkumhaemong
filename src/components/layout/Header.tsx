"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">꿈해몽</span>
          {locale === "en" && (
            <span className="hidden text-sm text-gray-400 sm:block">
              Korean Dream Dictionary
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link href="/" className="text-gray-400 transition-colors hover:text-white">
            {t("home")}
          </Link>
          <Link
            href={{ pathname: "/category/[category]", params: { category: "animals" } }}
            className="text-gray-400 transition-colors hover:text-white"
          >
            {t("categories")}
          </Link>
        </nav>

        <LanguageToggle locale={locale} />
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
      className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-white/40 hover:text-white"
    >
      <span className="opacity-60">{t("current")}</span>
      <span className="mx-1 text-white/20">·</span>
      <span>{t("toggle")}</span>
    </Link>
  );
}

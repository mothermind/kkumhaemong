"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");

  return (
    <header className="fixed top-0 w-full z-50 bg-midnight/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-2xl font-bold tracking-widest text-white" style={{ fontFamily: "var(--font-serif)" }}>
              꿈해몽
            </span>
            <span className="text-[10px] font-light tracking-normal opacity-60 uppercase mt-0.5">
              Kkumhaemong
            </span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link
              href="/explore"
              className="text-sm font-medium text-slate-300 hover:text-gold transition-colors"
            >
              {t("explore")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <LanguageToggle locale={locale} />
          <ThemeToggle />
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
  let href: any = pathname; // next-intl typed pathname requires `any` for dynamic routes
  if (params.slug) {
    href = { pathname: "/dream/[slug]", params: { slug: params.slug } };
  } else if (params.category) {
    href = { pathname: "/category/[category]", params: { category: params.category } };
  }

  return (
    <Link
      href={href}
      locale={targetLocale}
      className="text-xs border border-white/20 px-3 py-1.5 rounded hover:border-gold transition-all text-slate-300 hover:text-gold"
    >
      <span className="opacity-60">{t("current")}</span>
      <span className="mx-1 opacity-30">/</span>
      <span>{t("toggle")}</span>
    </Link>
  );
}

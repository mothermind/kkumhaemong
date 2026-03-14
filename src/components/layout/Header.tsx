"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-midnight/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: logo + desktop nav */}
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

        {/* Right: language toggle + theme + hamburger */}
        <div className="flex items-center gap-3">
          <LanguageToggle locale={locale} />
          <ThemeToggle />
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-midnight/95 backdrop-blur-md border-t border-white/5 px-6 py-4">
          <Link
            href="/explore"
            onClick={() => setMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-gold transition-colors py-2"
          >
            {t("explore")}
          </Link>
        </div>
      )}
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
      className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-gold hover:text-gold"
    >
      <span className="opacity-60">{t("current")}</span>
      <span className="mx-1 opacity-30">·</span>
      <span>{t("toggle")}</span>
    </Link>
  );
}

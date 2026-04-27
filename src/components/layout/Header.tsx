"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ThemeToggle } from "./ThemeToggle";
import { SearchModal } from "./SearchModal";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const tHome = useTranslations("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "k") return;
      if (!e.metaKey && !e.ctrlKey) return;
      // Don't hijack when user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      const isEditable = (e.target as HTMLElement).isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || isEditable) return;
      e.preventDefault();
      setSearchOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-midnight/80 light:bg-[#fdf8f1]/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-12">
            <Link href="/" className="flex flex-col leading-none">
              <span className="text-2xl font-bold tracking-widest text-text-primary" style={{ fontFamily: "var(--font-serif)" }}>
                꿈해몽
              </span>
              <span className="text-[10px] font-light tracking-normal opacity-60 uppercase mt-0.5">
                Kkumhaemong
              </span>
            </Link>
            <nav className="hidden md:flex gap-8">
              <Link
                href="/explore"
                className="text-sm font-bold text-text-secondary hover:text-gold transition-colors"
              >
                {t("explore")}
              </Link>
            </nav>
          </div>

          {/* Right: search icon + language toggle + theme + hamburger */}
          <div className="flex items-center gap-2">
            {/* Search icon button */}
            <button
              ref={searchTriggerRef}
              onClick={() => setSearchOpen(true)}
              aria-label={t("search")}
              className="p-2.5 rounded-full hover:bg-black/10 transition-colors text-text-secondary min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <LanguageToggle locale={locale} />
            <ThemeToggle />

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-full hover:bg-black/10 transition-colors text-text-secondary"
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
          <div className="md:hidden bg-midnight/95 light:bg-[#fdf8f1] backdrop-blur-md border-t border-border px-6 py-4">
            <Link
              href="/explore"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-bold text-text-secondary hover:text-gold transition-colors py-2"
            >
              {t("explore")}
            </Link>
          </div>
        )}
      </header>

      <SearchModal
        isOpen={searchOpen}
        onClose={closeSearch}
        locale={locale}
        placeholder={tHome("searchPlaceholder")}
        placeholderShort={tHome("searchPlaceholderShort")}
        buttonLabel={tHome("searchButton")}
      />
    </>
  );
}

function LanguageToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const params = useParams();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let href: any = pathname;
  if (params.slug) {
    href = { pathname: "/dream/[slug]", params: { slug: params.slug } };
  } else if (params.category) {
    href = { pathname: "/category/[category]", params: { category: params.category } };
  }

  const isKo = locale === "ko";

  return (
    <div className="flex items-center gap-0 rounded-full border border-border overflow-hidden text-xs font-semibold">
      <Link
        href={isKo ? pathname : href}
        locale="ko"
        className={`px-2.5 py-1.5 transition-colors ${
          isKo
            ? "bg-gold text-midnight"
            : "text-text-secondary opacity-50 hover:opacity-75"
        }`}
      >
        KO
      </Link>
      <span className="text-border select-none">|</span>
      <Link
        href={isKo ? href : pathname}
        locale="en"
        className={`px-2.5 py-1.5 transition-colors ${
          !isKo
            ? "bg-gold text-midnight"
            : "text-text-secondary opacity-50 hover:opacity-75"
        }`}
      >
        EN
      </Link>
    </div>
  );
}

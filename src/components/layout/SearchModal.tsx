"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { SearchBar } from "@/components/home/SearchBar";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  placeholder: string;
  placeholderShort: string;
  buttonLabel: string;
};

// Popular dream entries shown on mobile when search input is empty.
// koreanSlug drives /ko/ URLs; slug drives /en/ URLs.
const POPULAR_DREAMS = [
  {
    koreanSlug: "isa-haneun-kkum",
    slug: "moving-house-dream",
    labelKo: "이사하는 꿈",
    labelEn: "Moving House Dream",
  },
  {
    koreanSlug: "songarak-banji-kkum",
    slug: "ring-on-finger-dream",
    labelKo: "손가락 반지 끼는 꿈",
    labelEn: "Ring on Finger Dream",
  },
  {
    koreanSlug: "jeol-haneun-kkum",
    slug: "bowing-dream",
    labelKo: "절하는 꿈",
    labelEn: "Bowing Dream",
  },
  {
    koreanSlug: "beolle-mom-gieodanineun-kkum",
    slug: "bugs-crawling-body-dream",
    labelKo: "벌레 몸에 기어다니는 꿈",
    labelEn: "Bugs on Body Dream",
  },
  {
    koreanSlug: "dari-jallineun-kkum",
    slug: "leg-amputation-dream",
    labelKo: "다리 잘리는 꿈",
    labelEn: "Leg Cut Dream",
  },
  {
    koreanSlug: "sseunami-kkum",
    slug: "tsunami-dream",
    labelKo: "쓰나미 꿈",
    labelEn: "Tsunami Dream",
  },
] as const;

export function SearchModal({ isOpen, onClose, locale, placeholder, placeholderShort, buttonLabel }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  // Track whether mobile search has a query — controls popular dreams visibility
  const [mobileQuery, setMobileQuery] = useState("");

  // Reset query state when modal closes (cleanup runs on isOpen false → true transition)
  useEffect(() => {
    if (isOpen) return () => setMobileQuery("");
  }, [isOpen]);

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Focus the search input when modal opens
  useEffect(() => {
    if (!isOpen) return;
    // Small delay to ensure the element is visible before focusing
    const id = setTimeout(() => {
      const input = modalRef.current?.querySelector<HTMLInputElement>("input[type='text']");
      input?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [isOpen]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!isOpen) return null;

  const showPopular = mobileQuery.trim() === "";
  const popularSectionLabel = locale === "ko" ? "인기 꿈" : "Popular Dreams";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-start justify-center"
      aria-modal="true"
      role="dialog"
      aria-label={locale === "ko" ? "검색" : "Search"}
    >
      {/* Backdrop — desktop only (mobile is full-screen, no backdrop) */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden md:block"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        onKeyDown={handleKeyDown}
        className={[
          // Mobile: full-screen, slide up
          "fixed inset-0 flex flex-col bg-midnight light:bg-[#fdf8f1] md:static md:inset-auto",
          // Desktop: centered card, max width, top margin
          "md:relative md:mt-24 md:w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl md:border md:border-border",
          "animate-[slideUp_200ms_ease-out] md:animate-[fadeIn_150ms_ease-out]",
        ].join(" ")}
      >
        {/* ── Mobile header bar (56px / h-14) ── */}
        <div className="flex items-center h-14 px-2 border-b border-border md:hidden shrink-0">
          {/* X close button — 44×44 touch target */}
          <button
            onClick={onClose}
            aria-label={locale === "ko" ? "닫기" : "Close"}
            className="w-11 h-11 flex items-center justify-center rounded-full text-text-secondary hover:bg-white/10 light:hover:bg-black/10 transition-colors shrink-0"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Center title */}
          <span className="flex-1 text-center text-base font-semibold text-text-primary">
            {locale === "ko" ? "검색" : "Search"}
          </span>

          {/* Right spacer — mirrors X button width for visual balance */}
          <div className="w-11 h-11 shrink-0" aria-hidden="true" />
        </div>

        {/* ── Mobile: search input + popular dreams ── */}
        <div className="md:hidden flex flex-col px-4 pt-3">
          <SearchBar
            locale={locale}
            placeholder={placeholderShort}
            placeholderShort={placeholderShort}
            buttonLabel={buttonLabel}
            onQueryChange={setMobileQuery}
          />

          {/* Popular dreams — visible only when input is empty */}
          {showPopular && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-1 px-1">
                {popularSectionLabel}
              </p>
              <ul>
                {POPULAR_DREAMS.map((dream) => {
                  const label = locale === "ko" ? dream.labelKo : dream.labelEn;
                  const dreamSlug = locale === "ko" ? dream.koreanSlug : dream.slug;
                  return (
                    <li key={dream.slug}>
                      <Link
                        href={{ pathname: "/dream/[slug]", params: { slug: dreamSlug } }}
                        locale={locale}
                        onClick={onClose}
                        className="flex items-center gap-3 px-1 h-11 text-sm text-text-primary hover:text-gold active:text-gold transition-colors"
                      >
                        <svg
                          className="h-4 w-4 shrink-0 text-text-subtle"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="truncate">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* ── Desktop layout (unchanged) ── */}
        <div className="hidden md:block p-4">
          <SearchBar
            locale={locale}
            placeholder={placeholder}
            placeholderShort={placeholderShort}
            buttonLabel={buttonLabel}
          />
        </div>
      </div>
    </div>
  );
}

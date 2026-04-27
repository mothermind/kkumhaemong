"use client";

import { useEffect, useRef, useCallback } from "react";
import { SearchBar } from "@/components/home/SearchBar";
import type { Locale } from "@/i18n/routing";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  placeholder: string;
  placeholderShort: string;
  buttonLabel: string;
};

export function SearchModal({ isOpen, onClose, locale, placeholder, placeholderShort, buttonLabel }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
        {/* Mobile header bar */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2 md:hidden border-b border-border">
          <div className="flex-1">
            <SearchBar
              locale={locale}
              placeholder={placeholder}
              placeholderShort={placeholderShort}
              buttonLabel={buttonLabel}
            />
          </div>
          <button
            onClick={onClose}
            aria-label={locale === "ko" ? "닫기" : "Close"}
            className="shrink-0 p-2 rounded-full text-text-secondary hover:bg-black/10 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Desktop layout */}
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

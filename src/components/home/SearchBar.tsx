"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = {
  locale: Locale;
  placeholder: string;
  placeholderShort: string;
  buttonLabel: string;
};

export function SearchBar({ locale, placeholder, placeholderShort }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const slug = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    router.push({ pathname: "/dream/[slug]", params: { slug } });
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholderShort}
        className="md:hidden w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full py-5 pl-8 pr-16 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="hidden md:block w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full py-5 px-8 text-white text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
      />
      <button
        type="submit"
        aria-label={locale === "ko" ? "검색" : "Search"}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gold hover:text-white transition-colors"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}

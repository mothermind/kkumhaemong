"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = {
  locale: Locale;
  placeholder: string;
  buttonLabel: string;
};

export function SearchBar({ locale, placeholder, buttonLabel }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const slug = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    router.push({ pathname: "/dream/[slug]", params: { slug } });
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-base text-white placeholder-white/40 backdrop-blur-sm outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-400 active:bg-amber-600"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}

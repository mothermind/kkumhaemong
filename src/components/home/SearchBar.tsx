"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { track } from "@/lib/track";

type IndexEntry = {
  slug: string;
  koreanSlug: string;
  titleKo: string;
  titleEn: string;
  tagsKo: string[];
  badgeType: "auspicious" | "inauspicious" | "neutral";
  hero: string | null;
};

type Props = {
  locale: Locale;
  placeholder: string;
  placeholderShort: string;
  buttonLabel: string;
  onQueryChange?: (query: string) => void;
};

const BADGE_STYLES = {
  auspicious: "bg-green-500/20 text-green-300 light:text-green-700 light:bg-green-500/15",
  inauspicious: "bg-red-500/20 text-red-300 light:text-red-700 light:bg-red-500/15",
  neutral: "bg-white/10 text-text-muted light:bg-black/8",
};

const BADGE_LABELS = {
  auspicious: { ko: "길몽", en: "Auspicious" },
  inauspicious: { ko: "흉몽", en: "Inauspicious" },
  neutral: { ko: "중립", en: "Neutral" },
};

// Korean postposition suffixes — strip from end of each token before matching
const KO_PARTICLES =
  /(?:에게서|한테서|으로부터|로부터|에게|한테|께서|에서|으로|부터|까지|이랑|와|과|를|을|는|은|가|이|도|만|로|의|서)$/;

function stripParticle(word: string): string {
  return word.replace(KO_PARTICLES, "");
}

function tokenizeKo(q: string): string[] {
  return q
    .trim()
    .split(/\s+/)
    .map(stripParticle)
    .filter((t) => t.length > 0);
}

function scoreKo(entry: IndexEntry, tokens: string[]): number {
  const title = entry.titleKo;
  const searchable = title + " " + entry.tagsKo.join(" ");

  const allMatch = tokens.every((t) => searchable.includes(t));
  if (!allMatch) return 0;

  const titleMatches = tokens.filter((t) => title.includes(t)).length;
  return 50 + titleMatches * 20;
}

function scoreEn(entry: IndexEntry, q: string): number {
  const title = entry.titleEn.toLowerCase();
  const qn = q.toLowerCase();
  if (title === qn) return 100;
  if (title.startsWith(qn)) return 80;
  if (title.includes(qn)) return 60;
  return 0;
}

function score(entry: IndexEntry, q: string, locale: Locale): number {
  if (!q) return 0;
  if (locale === "ko") {
    const tokens = tokenizeKo(q);
    return tokens.length > 0 ? scoreKo(entry, tokens) : 0;
  }
  return scoreEn(entry, q);
}

/** Highlight matching substrings in the title */
function highlightMatch(title: string, query: string, locale: Locale) {
  if (!query.trim()) return title;

  const tokens =
    locale === "ko"
      ? tokenizeKo(query)
      : [query.trim().toLowerCase()];

  if (tokens.length === 0) return title;

  // Build a regex that matches any token
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, locale === "ko" ? "g" : "gi");
  const parts = title.split(pattern);

  return parts.map((part, i) => {
    const isMatch = tokens.some((t) =>
      locale === "ko" ? part.includes(t) : part.toLowerCase() === t.toLowerCase()
    );
    return isMatch ? (
      <span key={i} className="text-gold font-semibold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

export function SearchBar({ locale, placeholder, placeholderShort, buttonLabel, onQueryChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IndexEntry[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);
  const router = useRouter();
  const indexRef = useRef<IndexEntry[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Lazy-load index on first keystroke
  const loadIndex = useCallback(async () => {
    if (indexRef.current) return;
    setLoading(true);
    try {
      const res = await fetch("/search-index.json");
      indexRef.current = await res.json();
    } finally {
      setLoading(false);
    }
  }, []);

  // Search whenever query changes
  useEffect(() => {
    const q = query.trim();
    if (!q || !indexRef.current) {
      setResults([]);
      setOpen(q.length > 0 && loading); // keep open if loading
      return;
    }
    const scored = indexRef.current
      .map((e) => ({ entry: e, s: score(e, q, locale) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.entry);
    setResults(scored);
    setActiveIdx(-1);
    setOpen(true);
  }, [query, locale, loading]);

  // Click outside to close
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  function navigate(entry: IndexEntry) {
    const title = locale === "ko" ? entry.titleKo : entry.titleEn;
    setNavigatingSlug(entry.slug);
    setQuery(title);
    setOpen(false);

    // entry.slug is always the canonical english slug — safe for aggregation
    // regardless of which locale's route (koreanSlug vs slug) is navigated to.
    track({ type: "search_result_click", slug: entry.slug, locale });

    const slug = locale === "ko" ? entry.koreanSlug : entry.slug;
    // Brief pause so the user sees the selected title in the input
    setTimeout(() => {
      router.push({ pathname: "/dream/[slug]", params: { slug } }, { locale });
    }, 250);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onQueryChange?.(val);
    if (val.trim()) loadIndex();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIdx >= 0 ? results[activeIdx] : results[0];
      if (target) navigate(target);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) track({ type: "search_submit", locale });
    if (results[0]) navigate(results[activeIdx >= 0 ? activeIdx : 0]);
  }

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && !loading && indexRef.current && results.length === 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Search icon (left) */}
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 light:text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 || noResults) setOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-white/10 light:bg-black/8 backdrop-blur-xl border border-white/20 light:border-border rounded-full py-5 pl-12 pr-14 text-text-primary placeholder-white/40 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-base hidden md:block"
            autoComplete="off"
          />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 || noResults) setOpen(true);
            }}
            placeholder={placeholderShort}
            className="w-full bg-white/10 light:bg-black/8 backdrop-blur-xl border border-white/20 light:border-border rounded-full py-5 pl-12 pr-14 text-text-primary placeholder-white/40 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-base md:hidden"
            autoComplete="off"
          />

          {/* Clear button (right) — shows when typing */}
          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white/40 light:text-slate-400 hover:text-white light:hover:text-slate-700 hover:bg-white/10 light:hover:bg-black/10 transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 w-full rounded-2xl overflow-hidden shadow-2xl z-50 border border-border bg-[#0d1520]/95 light:bg-[#fffdf9]/95 backdrop-blur-xl animate-[slideDown_150ms_ease-out]"
        >
          {/* Loading state */}
          {loading && (
            <div className="px-5 py-4 flex items-center gap-3 text-text-muted text-sm">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {locale === "ko" ? "검색 준비 중..." : "Loading search..."}
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="px-5 py-4 text-text-muted text-sm">
              {locale === "ko"
                ? `"${query.trim()}"에 대한 결과가 없습니다`
                : `No results for "${query.trim()}"`}
            </div>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <ul ref={listRef} className="py-1 max-h-[400px] overflow-y-auto overscroll-contain">
              {results.map((entry, i) => {
                const title = locale === "ko" ? entry.titleKo : entry.titleEn;
                const badge = BADGE_LABELS[entry.badgeType][locale];
                const isActive = i === activeIdx;
                const isNavigating = navigatingSlug === entry.slug;

                return (
                  <li key={entry.slug}>
                    <button
                      type="button"
                      onMouseDown={() => navigate(entry)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors duration-100 ${
                        isNavigating
                          ? "bg-gold/20"
                          : isActive
                            ? "bg-white/8 light:bg-black/6"
                            : ""
                      }`}
                    >
                      {/* Title + badge */}
                      <div className="flex-1 min-w-0 flex items-center gap-2.5">
                        <p className="text-sm text-text-primary truncate leading-snug">
                          {highlightMatch(title, query, locale)}
                        </p>
                        <span
                          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${BADGE_STYLES[entry.badgeType]}`}
                        >
                          {badge}
                        </span>
                      </div>
                      {/* Arrow */}
                      <svg
                        className={`w-4 h-4 shrink-0 transition-all duration-100 ${
                          isActive ? "text-gold translate-x-0.5" : "text-text-subtle"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Keyboard hint — desktop only (no physical keyboard on mobile) */}
          {results.length > 0 && (
            <div className="px-5 py-2 border-t border-border text-[11px] text-text-subtle hidden md:flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/8 light:bg-black/8 font-mono text-[10px]">↑↓</kbd>
                {locale === "ko" ? "이동" : "navigate"}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/8 light:bg-black/8 font-mono text-[10px]">↵</kbd>
                {locale === "ko" ? "선택" : "select"}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/8 light:bg-black/8 font-mono text-[10px]">esc</kbd>
                {locale === "ko" ? "닫기" : "close"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

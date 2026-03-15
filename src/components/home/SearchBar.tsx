"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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
};

const BADGE_STYLES = {
  auspicious: "bg-green-500/20 text-green-300",
  inauspicious: "bg-red-500/20 text-red-300",
  neutral: "bg-black/10 text-text-muted",
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

  // All tokens must match (AND logic) — handles multi-word queries like "개 물리는"
  const allMatch = tokens.every((t) => searchable.includes(t));
  if (!allMatch) return 0;

  // Score by how well the title matches (more tokens matched in title = better rank)
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

export function SearchBar({ locale, placeholder, placeholderShort, buttonLabel }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IndexEntry[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const indexRef = useRef<IndexEntry[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-load index on first keystroke
  const loadIndex = useCallback(async () => {
    if (indexRef.current) return;
    const res = await fetch("/search-index.json");
    indexRef.current = await res.json();
  }, []);

  // Search whenever query changes
  useEffect(() => {
    const q = query.trim();
    if (!q || !indexRef.current) {
      setResults([]);
      setOpen(false);
      return;
    }
    const scored = indexRef.current
      .map((e) => ({ entry: e, s: score(e, q, locale) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((x) => x.entry);
    setResults(scored);
    setActiveIdx(-1);
    setOpen(scored.length > 0);
  }, [query, locale]);

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

  function navigate(entry: IndexEntry) {
    const slug = locale === "ko" ? entry.koreanSlug : entry.slug;
    router.push({ pathname: "/dream/[slug]", params: { slug } }, { locale });
    setOpen(false);
    setQuery("");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
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
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results[0]) navigate(results[activeIdx >= 0 ? activeIdx : 0]);
  }

  const inputClass =
    "w-full bg-white/10 light:bg-black/8 backdrop-blur-xl border border-white/20 light:border-border rounded-full py-5 pl-8 pr-16 text-text-primary placeholder-white/50 light:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all";

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholderShort}
          className={`md:hidden text-sm ${inputClass}`}
          autoComplete="off"
        />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={`hidden md:block text-base ${inputClass}`}
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label={buttonLabel}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gold hover:text-white transition-colors"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-[#0d1520] light:bg-[#fffdf9] border border-border rounded-2xl overflow-hidden shadow-2xl z-50">
          {results.map((entry, i) => {
            const title = locale === "ko" ? entry.titleKo : entry.titleEn;
            const badge = BADGE_LABELS[entry.badgeType][locale];
            return (
              <li key={entry.slug}>
                <button
                  type="button"
                  onMouseDown={() => navigate(entry)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i === activeIdx ? "bg-black/10" : "hover:bg-black/5"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                    {entry.hero && (
                      <Image
                        src={entry.hero}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
                  </div>
                  {/* Title + badge */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate leading-snug">{title}</p>
                    {badge && (
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${BADGE_STYLES[entry.badgeType]}`}>
                        {badge}
                      </span>
                    )}
                  </div>
                  {/* Arrow */}
                  <svg className="w-4 h-4 text-text-subtle shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

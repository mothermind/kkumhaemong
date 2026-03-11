"use client";

import { useEffect, useState } from "react";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="w-[60px] h-[30px]" />;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex items-center w-[60px] h-[30px] rounded-full border border-stone-300 bg-stone-100 p-[3px] transition-colors dark:border-stone-700 dark:bg-stone-900"
    >
      {/* Sliding thumb */}
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm border border-stone-200 transition-all duration-300 dark:bg-stone-700 dark:border-stone-600 ${isDark ? "left-[33px]" : "left-[3px]"}`}
      />

      {/* Sun icon — left */}
      <span className={`relative z-10 flex w-[27px] items-center justify-center transition-colors ${!isDark ? "text-amber-500" : "text-stone-500"}`}>
        <SunIcon />
      </span>

      {/* Moon icon — right */}
      <span className={`relative z-10 flex w-[27px] items-center justify-center transition-colors ${isDark ? "text-indigo-400" : "text-stone-400"}`}>
        <MoonIcon />
      </span>
    </button>
  );
}

"use client";

import { useState, useMemo } from "react";
import { track } from "@/lib/track";

type Props = {
  slug: string;
  locale: string;
};

// Simple deterministic hash from string → number
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// Seeded pseudo-random number generator (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateNumbers(slug: string): [number, number, number] {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const seed = hashCode(`${slug}::${dateStr}`);
  const rng = mulberry32(seed);

  const nums = new Set<number>();
  while (nums.size < 3) {
    nums.add(Math.floor(rng() * 45) + 1);
  }
  return [...nums] as [number, number, number];
}

const LABELS = {
  ko: ["행운", "주의", "기회"] as const,
  en: ["Luck", "Caution", "Opportunity"] as const,
};

const ORB_STYLES = [
  {
    bg: "radial-gradient(circle at 35% 30%, #fcd34d 0%, #f59e0b 40%, #b45309 100%)",
    shadow: "0 4px 20px rgba(245,158,11,0.4), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
    text: "text-white",
    label: "text-amber-400 light:text-amber-600",
  },
  {
    bg: "radial-gradient(circle at 35% 30%, #fda4af 0%, #e11d48 40%, #881337 100%)",
    shadow: "0 4px 20px rgba(225,29,72,0.4), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
    text: "text-white",
    label: "text-rose-400 light:text-rose-600",
  },
  {
    bg: "radial-gradient(circle at 35% 30%, #6ee7b7 0%, #059669 40%, #064e3b 100%)",
    shadow: "0 4px 20px rgba(5,150,105,0.4), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
    text: "text-white",
    label: "text-emerald-400 light:text-emerald-600",
  },
];

export function LuckyNumbers({ slug, locale }: Props) {
  const [revealed, setRevealed] = useState(false);
  const numbers = useMemo(() => generateNumbers(slug), [slug]);
  const labels = locale === "ko" ? LABELS.ko : LABELS.en;

  return (
    <section className="mt-16 scroll-mt-20">
      <div className="rounded-2xl border border-border bg-surface/30 light:bg-black/[0.02] px-6 py-8 text-center">
        <h3
          className="text-lg font-bold text-text-primary mb-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {locale === "ko" ? "오늘의 꿈 숫자" : "Today's Dream Numbers"}
        </h3>
        <p className="text-xs text-text-muted mb-6">
          {locale === "ko"
            ? "이 꿈의 상징과 오늘의 운세를 결합하여 생성된 숫자입니다"
            : "Numbers generated from this dream's symbolism combined with today's fortune"}
        </p>

        {revealed ? (
          <div className="flex justify-center gap-6 sm:gap-8">
            {numbers.map((num, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2.5 animate-[bounceIn_0.5s_ease-out_both]"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <span className={`text-[11px] font-bold uppercase tracking-widest ${ORB_STYLES[i].label}`}>
                  {labels[i]}
                </span>
                <div className="relative">
                  {/* Orb */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${ORB_STYLES[i].text} select-none`}
                    style={{
                      background: ORB_STYLES[i].bg,
                      boxShadow: ORB_STYLES[i].shadow,
                    }}
                  >
                    <span className="text-2xl sm:text-3xl font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      {num}
                    </span>
                  </div>
                  {/* Shine highlight */}
                  <div
                    className="absolute top-1.5 left-3 w-6 h-3 sm:w-8 sm:h-4 rounded-full opacity-40 pointer-events-none"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => {
              setRevealed(true);
              track({ type: "lucky_reveal", slug, locale });
            }}
            className="inline-block px-8 py-3 border border-border text-text-primary text-sm tracking-widest hover:bg-text-primary hover:text-bg transition-all duration-300"
          >
            {locale === "ko" ? "행운의 숫자 뽑기" : "REVEAL LUCKY NUMBERS"}
          </button>
        )}

        {revealed && (
          <p className="mt-4 text-[10px] text-text-subtle">
            {locale === "ko"
              ? "매일 자정에 새로운 숫자가 생성됩니다"
              : "New numbers are generated daily at midnight"}
          </p>
        )}
      </div>
    </section>
  );
}

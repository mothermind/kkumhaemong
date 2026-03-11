"use client";

import { useState } from "react";

type FAQ = { question: string; answer: string };
type Props = { id: string; heading: string; faqs: FAQ[] };

export function DreamFAQ({ id, heading, faqs }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  if (!faqs?.length) return null;

  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <h2
        className="text-[1.6rem] font-bold tracking-tight text-stone-900 mb-6 dark:text-stone-100"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {heading}
      </h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className={`rounded-xl border transition-colors ${
              open === i
                ? "border-amber-300 dark:border-amber-800/50"
                : "border-stone-200 dark:border-stone-800/60"
            }`}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-start justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-stone-700 leading-relaxed pr-4 dark:text-stone-200">{faq.question}</span>
              <span className={`shrink-0 mt-0.5 text-base transition-colors ${open === i ? "text-amber-600 dark:text-amber-500" : "text-stone-400 dark:text-stone-600"}`}>
                {open === i ? "−" : "+"}
              </span>
            </button>
            {open === i && (
              <p className="px-5 pb-5 text-sm leading-[1.85] text-stone-500 dark:text-stone-400">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

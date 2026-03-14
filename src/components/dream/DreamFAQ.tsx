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
        className="text-[1.6rem] font-bold tracking-tight text-text-primary mb-6"
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
                ? "border-gold/40"
                : "border-border"
            }`}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-start justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-text-primary leading-relaxed pr-4">{faq.question}</span>
              <span className={`shrink-0 mt-0.5 text-base transition-colors ${open === i ? "text-gold" : "text-text-subtle"}`}>
                {open === i ? "−" : "+"}
              </span>
            </button>
            {open === i && (
              <p className="px-5 pb-5 text-sm leading-[1.85] text-text-muted">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";

type FAQ = { question: string; answer: string };
type Props = { id: string; heading: string; faqs: FAQ[] };

export function DreamFAQ({ id, heading, faqs }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  if (!faqs?.length) return null;

  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-100 mb-6">{heading}</h2>
      <div className="divide-y divide-white/10">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between py-[1.15rem] text-left text-sm font-medium text-gray-200 hover:text-gray-100 transition-colors"
            >
              <span>{faq.question}</span>
              <span className="ml-4 shrink-0 text-gray-600">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <p className="pb-5 text-sm leading-[1.8] text-gray-400">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";

type FAQ = {
  question: string;
  answer: string;
};

type Props = {
  heading: string;
  faqs: FAQ[];
};

export function DreamFAQ({ heading, faqs }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  if (!faqs?.length) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-5 text-xl font-semibold">{heading}</h2>
      <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <span>{faq.question}</span>
              <span className="ml-4 shrink-0 text-gray-400">
                {open === i ? "−" : "+"}
              </span>
            </button>
            {open === i && (
              <div className="bg-gray-50 px-5 pb-4 pt-1 text-sm leading-relaxed text-gray-700">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

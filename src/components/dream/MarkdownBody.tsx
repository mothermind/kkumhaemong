"use client";

import ReactMarkdown from "react-markdown";

type Props = {
  children: string;
  className?: string;
};

export function MarkdownBody({ children, className = "" }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="text-[17px] text-stone-600 leading-[1.85] tracking-[-0.01em] mb-5 last:mb-0 dark:text-stone-300">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-amber-900 bg-amber-100 px-[3px] py-[1px] rounded-sm dark:text-amber-200 dark:bg-amber-400/10">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-stone-700 dark:text-stone-200">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-5 space-y-2 text-stone-600 text-[17px] leading-[1.85] dark:text-stone-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 space-y-2 text-stone-600 text-[17px] leading-[1.85] list-decimal list-outside ml-5 dark:text-stone-300">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.85] flex gap-2 before:content-['·'] before:text-amber-600 before:shrink-0 before:mt-0.5 dark:before:text-amber-600">{children}</li>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold text-stone-800 mt-10 mb-4 dark:text-stone-100" style={{ fontFamily: 'var(--font-serif)' }}>{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-amber-700/80 dark:text-amber-600/80">
              {children}
            </h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-[3px] border-amber-500/50 bg-amber-50 py-4 px-5 text-stone-600 rounded-r-xl my-8 italic dark:border-amber-700/50 dark:bg-amber-950/20 dark:text-stone-400">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

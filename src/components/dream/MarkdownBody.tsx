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
            <p className="text-[17px] text-text-secondary leading-[1.85] tracking-[-0.01em] mb-5 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gold bg-gold/10 px-[3px] py-[1px] rounded-sm">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-text-primary">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-5 space-y-2 text-text-secondary text-[17px] leading-[1.85]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 space-y-2 text-text-secondary text-[17px] leading-[1.85] list-decimal list-outside ml-5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.85] flex gap-2 before:content-['·'] before:text-gold before:shrink-0 before:mt-0.5">{children}</li>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold text-text-primary mt-10 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-gold/70">
              {children}
            </h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-[3px] border-gold/40 bg-gold/5 py-4 px-5 text-text-muted rounded-r-xl my-8 italic">
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

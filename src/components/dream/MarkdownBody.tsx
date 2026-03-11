"use client";

import ReactMarkdown from "react-markdown";

type Props = {
  children: string;
  className?: string;
};

/**
 * Renders LLM-generated Markdown content with Tailwind styling.
 * Used for all body text fields in dream articles (sections, variations,
 * culturalContext, westernContext, intro, conclusion).
 *
 * Supports: paragraphs, bold, italic, unordered lists, ordered lists.
 * Images are NOT handled here — use imageRef + next/image in parent components.
 */
export function MarkdownBody({ children, className = "" }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="text-[17px] text-gray-300 leading-[1.8] tracking-[-0.01em] mb-6 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-200">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-2 mb-6 text-gray-300 text-[17px] leading-[1.8]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-2 mb-6 text-gray-300 text-[17px] leading-[1.8]">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.8]">{children}</li>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium text-gray-100 mt-10 mb-4">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {children}
            </h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-[3px] border-gray-600 bg-gradient-to-r from-white/[0.04] to-transparent py-4 px-5 text-gray-400 rounded-r-lg my-8">
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

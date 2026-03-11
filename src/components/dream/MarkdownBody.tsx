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
            <p className="mb-[1.05rem] last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {children}
            </h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-gray-300 pl-4 text-gray-600 italic">
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

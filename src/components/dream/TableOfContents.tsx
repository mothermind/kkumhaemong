type TocItem = { id: string; label: string };

type Props = {
  items: TocItem[];
  locale: string;
};

export function TableOfContents({ items, locale }: Props) {
  if (!items.length) return null;

  return (
    <nav className="mb-10 rounded-xl border border-white/10 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {locale === "ko" ? "목차" : "Contents"}
      </p>
      <ol className="space-y-1.5">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-baseline gap-3">
            <span className="w-5 shrink-0 text-right text-xs text-gray-600">{i + 1}</span>
            <a
              href={`#${item.id}`}
              className="text-sm text-gray-400 hover:text-white transition-colors leading-snug"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

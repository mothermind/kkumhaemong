type TocItem = { id: string; label: string };
type Props = { items: TocItem[]; locale: string };

export function TableOfContents({ items, locale }: Props) {
  if (!items.length) return null;

  return (
    <nav className="mb-12 rounded-xl border border-stone-200 px-6 py-5 dark:border-stone-800/60">
      <p
        className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-700/80 dark:text-amber-600/80"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {locale === "ko" ? "목차" : "Contents"}
      </p>
      <ol className="space-y-[0.35rem]">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-baseline gap-3">
            <span className="w-5 shrink-0 text-right text-xs text-amber-600/70 font-medium dark:text-amber-700/70">{i + 1}</span>
            <a
              href={`#${item.id}`}
              className="text-sm leading-relaxed text-stone-500 transition-colors hover:text-amber-800 dark:text-stone-400 dark:hover:text-amber-200"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

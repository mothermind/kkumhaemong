type TocItem = { id: string; label: string };
type Props = { items: TocItem[]; locale: string };

export function TableOfContents({ items, locale }: Props) {
  if (!items.length) return null;

  return (
    <nav className="mb-12 rounded-xl border border-border bg-white/[0.03] light:bg-black/[0.03] px-6 py-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold/70">
        {locale === "ko" ? "목차" : "Contents"}
      </p>
      <ol className="space-y-[0.35rem]">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-baseline gap-3">
            <span className="w-5 shrink-0 text-right text-xs text-gold/50 font-medium">{i + 1}</span>
            <a
              href={`#${item.id}`}
              className="text-sm leading-relaxed text-text-muted transition-colors hover:text-gold"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

import { MarkdownBody } from "./MarkdownBody";

type Variation = { keyword: string; heading: string; body: string };
type Props = { id: string; heading: string; variations: Variation[] };

export function DreamVariations({ id, heading, variations }: Props) {
  if (!variations?.length) return null;

  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <h2
        className="text-[1.6rem] font-bold tracking-tight text-stone-900 mb-8 dark:text-stone-100"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {heading}
      </h2>
      <div className="space-y-4">
        {variations.map((v, i) => (
          <div key={i} className="rounded-xl border border-stone-200 px-6 py-5 dark:border-stone-800/60">
            <h3
              className="text-[1.1rem] font-bold text-amber-800 mb-3 dark:text-amber-200"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {v.heading}
            </h3>
            <MarkdownBody className="">{v.body}</MarkdownBody>
          </div>
        ))}
      </div>
    </section>
  );
}

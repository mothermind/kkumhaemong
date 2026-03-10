import { MarkdownBody } from "./MarkdownBody";

type Variation = { keyword: string; heading: string; body: string };
type Props = { id: string; heading: string; variations: Variation[] };

export function DreamVariations({ id, heading, variations }: Props) {
  if (!variations?.length) return null;

  return (
    <section id={id} className="mt-14 scroll-mt-20">
      {/* Section label */}
      <span className="inline-block mb-2 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide bg-white/5 text-gray-500">
        상황별 해몽
      </span>
      <h2 className="font-serif-ko mb-8 text-2xl font-semibold text-white">{heading}</h2>
      <div className="space-y-8">
        {variations.map((v, i) => (
          <div key={i} className="border-l border-white/10 pl-5">
            <h3 className="mb-2 text-base font-semibold text-gray-200">{v.heading}</h3>
            <MarkdownBody className="text-gray-500 leading-7 text-sm">{v.body}</MarkdownBody>
          </div>
        ))}
      </div>
    </section>
  );
}

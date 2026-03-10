import { MarkdownBody } from "./MarkdownBody";

type Variation = { keyword: string; heading: string; body: string };
type Props = { id: string; heading: string; variations: Variation[] };

export function DreamVariations({ id, heading, variations }: Props) {
  if (!variations?.length) return null;

  return (
    <section id={id} className="mt-[72px] scroll-mt-20">
      <h2 className="mb-8 text-[22px] font-semibold tracking-tight text-white">{heading}</h2>
      <div className="space-y-8">
        {variations.map((v, i) => (
          <div key={i} className="mt-8 border-l-[2.5px] border-white/20 pl-5">
            <h3 className="mb-2 text-[19px] font-semibold tracking-tight text-gray-100">{v.heading}</h3>
            <MarkdownBody className="text-gray-500 leading-7 text-sm">{v.body}</MarkdownBody>
          </div>
        ))}
      </div>
    </section>
  );
}

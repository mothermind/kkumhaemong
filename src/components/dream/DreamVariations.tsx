import { MarkdownBody } from "./MarkdownBody";

type Variation = { keyword: string; heading: string; body: string };
type Props = { id: string; heading: string; variations: Variation[] };

export function DreamVariations({ id, heading, variations }: Props) {
  if (!variations?.length) return null;

  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-100 mb-6">{heading}</h2>
      <div className="space-y-8">
        {variations.map((v, i) => (
          <div key={i} className="mt-8 border-l-[2.5px] border-white/20 pl-5">
            <h3 className="text-xl font-medium text-gray-100 mb-2">{v.heading}</h3>
            <MarkdownBody className="">{v.body}</MarkdownBody>
          </div>
        ))}
      </div>
    </section>
  );
}

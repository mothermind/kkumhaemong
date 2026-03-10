import { MarkdownBody } from "./MarkdownBody";

type Variation = {
  keyword: string;
  heading: string;
  body: string;
};

type Props = {
  heading: string;
  variations: Variation[];
};

export function DreamVariations({ heading, variations }: Props) {
  if (!variations?.length) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-5 text-xl font-semibold">{heading}</h2>
      <div className="space-y-6">
        {variations.map((v, i) => (
          <div key={i}>
            <h3 className="mb-2 text-base font-semibold text-indigo-700">
              {v.heading}
            </h3>
            <MarkdownBody className="text-gray-700">{v.body}</MarkdownBody>
          </div>
        ))}
      </div>
    </section>
  );
}

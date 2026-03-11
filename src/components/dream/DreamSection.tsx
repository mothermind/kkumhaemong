import Image from "next/image";
import { MarkdownBody } from "./MarkdownBody";

const TYPE_COLOR = {
  auspicious: "text-emerald-400",
  inauspicious: "text-rose-400",
  neutral: "text-gray-100",
} as const;

type Props = {
  id: string;
  heading: string;
  body: string;
  type: string;
  image?: string;
};

export function DreamSection({ id, heading, body, type, image }: Props) {
  const color = TYPE_COLOR[type as keyof typeof TYPE_COLOR] ?? TYPE_COLOR.neutral;

  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <h2 className={`text-2xl font-semibold tracking-tight mb-6 ${color}`}>
        {heading}
      </h2>
      {image && (
        <div className="relative mb-6 w-full overflow-hidden rounded-xl aspect-[3/2]">
          <Image
            src={image}
            alt={heading}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 680px"
          />
        </div>
      )}
      <MarkdownBody className="">{body}</MarkdownBody>
    </section>
  );
}

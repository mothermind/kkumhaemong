import Image from "next/image";
import { MarkdownBody } from "./MarkdownBody";

const TYPE_META = {
  auspicious: { label: "길몽", labelEn: "Auspicious", color: "text-emerald-400", tag: "bg-emerald-400/10 text-emerald-400" },
  inauspicious: { label: "흉몽", labelEn: "Inauspicious", color: "text-red-400", tag: "bg-red-400/10 text-red-400" },
  neutral: { label: "중립", labelEn: "Neutral", color: "text-gray-300", tag: "bg-white/5 text-gray-400" },
} as const;

type Props = {
  id: string;
  heading: string;
  body: string;
  type: string;
  image?: string;
  locale?: string;
};

export function DreamSection({ id, heading, body, type, image, locale }: Props) {
  const meta = TYPE_META[type as keyof typeof TYPE_META] ?? TYPE_META.neutral;
  const tagLabel = locale === "en" ? meta.labelEn : meta.label;

  return (
    <section id={id} className="mt-[72px] scroll-mt-20">
      {/* Type tag */}
      <span className={`inline-block mb-3 rounded-full px-3 py-[0.28rem] text-xs font-semibold tracking-wide ${meta.tag}`}>
        {tagLabel}
      </span>
      {/* Section heading */}
      <h2 className={`font-serif-ko mb-5 text-[22px] font-semibold leading-snug tracking-tight ${meta.color}`}>
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
      <MarkdownBody className="text-gray-400 leading-8">{body}</MarkdownBody>
    </section>
  );
}

import Image from "next/image";
import { MarkdownBody } from "./MarkdownBody";

const TYPE_STYLES = {
  auspicious: {
    heading: "text-green-400",
    badge: "bg-green-500/20 text-green-400 border border-green-500/30",
    label: "길몽",
  },
  inauspicious: {
    heading: "text-red-400",
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    label: "흉몽",
  },
  neutral: {
    heading: "text-white",
    badge: "bg-white/10 text-slate-400 border border-white/10",
    label: "중립",
  },
} as const;

type Props = {
  id: string;
  heading: string;
  body: string;
  type: string;
  image?: string;
};

export function DreamSection({ id, heading, body, type, image }: Props) {
  const styles = TYPE_STYLES[type as keyof typeof TYPE_STYLES] ?? TYPE_STYLES.neutral;

  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <div className="flex items-center gap-3 mb-5">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-wider ${styles.badge}`}>
          {styles.label}
        </span>
      </div>
      <h2
        className={`text-[1.6rem] font-bold leading-snug tracking-tight mb-6 ${styles.heading}`}
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {heading}
      </h2>
      {image && (
        <div className="relative mb-7 w-full overflow-hidden rounded-xl aspect-[3/2]">
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

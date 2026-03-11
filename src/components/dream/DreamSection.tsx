import Image from "next/image";
import { MarkdownBody } from "./MarkdownBody";

const TYPE_STYLES = {
  auspicious: {
    heading: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-700/40",
    label: "길몽",
  },
  inauspicious: {
    heading: "text-rose-600 dark:text-rose-300",
    badge: "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-700/40",
    label: "흉몽",
  },
  neutral: {
    heading: "text-stone-800 dark:text-stone-100",
    badge: "bg-stone-100 text-stone-500 border border-stone-200 dark:bg-stone-700/40 dark:text-stone-400 dark:border-stone-600/40",
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

import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { MarkdownBody } from "./MarkdownBody";

type Props = {
  title: string;
  intro: string;
  heroImage?: string;
  locale: Locale;
};

export function DreamHero({ title, intro, heroImage, locale: _locale }: Props) {
  return (
    <div className="mb-2">
      {heroImage ? (
        <div className="relative mb-10 w-full overflow-hidden rounded-xl aspect-square sm:aspect-video">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 640px) 100vw, 768px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent dark:from-stone-950/60" />
        </div>
      ) : (
        <div className="mb-10 w-full rounded-xl bg-stone-200/60 aspect-square sm:aspect-video dark:bg-stone-800/40" />
      )}

      <h1
        className="text-[2rem] sm:text-[2.5rem] font-bold text-stone-900 leading-[1.3] tracking-tight text-balance mb-5 dark:text-stone-100"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </h1>

      <div className="mt-5 mb-10 pb-10 border-b border-stone-200 dark:border-stone-800">
        <MarkdownBody className="text-[18px] sm:text-[19px] leading-[1.9] [&_p]:text-stone-700 [&_p]:dark:text-stone-200">
          {intro}
        </MarkdownBody>
      </div>
    </div>
  );
}

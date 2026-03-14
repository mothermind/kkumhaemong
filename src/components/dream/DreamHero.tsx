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
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
        </div>
      ) : (
        <div className="mb-10 w-full rounded-xl bg-white/5 aspect-square sm:aspect-video" />
      )}

      <h1
        className="text-[2rem] sm:text-[2.5rem] font-bold text-white leading-[1.3] tracking-tight text-balance mb-5"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </h1>

      <div className="mt-5 mb-10 pb-10 border-b border-white/10">
        <MarkdownBody className="text-[18px] sm:text-[19px] leading-[1.9] [&_p]:text-slate-300">
          {intro}
        </MarkdownBody>
      </div>
    </div>
  );
}

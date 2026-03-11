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
        <div className="relative mb-8 w-full overflow-hidden rounded-2xl aspect-square sm:aspect-video">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 640px) 100vw, 768px"
          />
        </div>
      ) : (
        <div className="mb-8 w-full rounded-2xl bg-white/5 aspect-square sm:aspect-video" />
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 tracking-tight text-balance mb-6">
        {title}
      </h1>

      <div className="mt-6 mb-12 pb-8 border-b border-white/10">
        <MarkdownBody className="text-lg sm:text-[19px] text-gray-200 font-medium leading-[1.8]">
          {intro}
        </MarkdownBody>
      </div>
    </div>
  );
}

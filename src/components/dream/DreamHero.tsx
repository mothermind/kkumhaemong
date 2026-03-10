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

      <h1 className="mb-5 text-3xl font-bold leading-snug tracking-tight text-white sm:text-4xl">
        {title}
      </h1>

      <MarkdownBody className="text-lg leading-9 text-gray-200">
        {intro}
      </MarkdownBody>
    </div>
  );
}

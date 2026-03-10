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
    <div className="mb-8">
      {/*
        Single 3:2 image from Midjourney.
        Mobile: 1:1 container → crops sides, keeps centered subject.
        Desktop: 16:9 container → crops top/bottom slightly.
        object-position: center ensures the focal point is always visible.
      */}
      {heroImage ? (
        <div className="relative mb-6 w-full overflow-hidden rounded-2xl aspect-square sm:aspect-video">
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
        <div className="mb-6 w-full rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 aspect-square sm:aspect-video" />
      )}

      <h1 className="mb-4 text-2xl font-bold leading-snug sm:text-3xl">
        {title}
      </h1>

      <MarkdownBody className="text-base leading-relaxed text-gray-700 sm:text-lg">
        {intro}
      </MarkdownBody>
    </div>
  );
}

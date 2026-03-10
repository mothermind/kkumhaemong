import Image from "next/image";
import type { Locale } from "@/i18n/routing";

type Props = {
  title: string;
  intro: string;
  heroImage?: string;
  locale: Locale;
};

export function DreamHero({ title, intro, heroImage, locale }: Props) {
  return (
    <div className="mb-8">
      {/* Hero image */}
      {heroImage ? (
        <div className="relative mb-6 h-56 w-full overflow-hidden rounded-2xl sm:h-72">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      ) : (
        <div className="mb-6 h-56 w-full rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 sm:h-72" />
      )}

      {/* Title */}
      <h1 className="mb-4 text-2xl font-bold leading-snug sm:text-3xl">
        {title}
      </h1>

      {/* Intro */}
      <p className="text-base leading-relaxed text-gray-700 sm:text-lg">
        {intro}
      </p>
    </div>
  );
}

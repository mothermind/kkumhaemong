"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/track";

type Props = {
  href: string;
  title: string;
  hero?: string;
  trackSlug: string;
  locale: string;
};

/** Related-dream card as a client component so it can fire related_click on navigation. */
export function RelatedDreamLink({ href, title, hero, trackSlug, locale }: Props) {
  return (
    <Link
      href={{ pathname: "/dream/[slug]", params: { slug: href } }}
      onClick={() => track({ type: "related_click", slug: trackSlug, locale })}
      className="group rounded-xl border border-border bg-surface/20 light:bg-black/[0.03] p-3 transition-all hover:border-gold/30 hover:bg-surface/40 light:hover:bg-black/[0.06]"
    >
      {hero && (
        <div className="relative mb-3 h-20 w-full overflow-hidden rounded-lg bg-white/10">
          <Image
            src={hero}
            alt={title}
            fill
            className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        </div>
      )}
      <p className="text-sm font-medium text-text-muted leading-snug transition-colors group-hover:text-gold">
        {title}
      </p>
    </Link>
  );
}

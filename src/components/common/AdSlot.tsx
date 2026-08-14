"use client";

import { useEffect, useRef, useState } from "react";

export type AdSlotName = "in-content-1" | "in-content-2" | "end";

type Props = {
  slot: AdSlotName;
  locale: string;
};

/**
 * Ad network waterfall order per locale.
 *
 * /ko/ = AdFit primary, AdSense fill (99.2% of referrals are Naver — AdFit's
 * exact audience). /en/ = AdSense only (AdFit is KR-centric).
 *
 * AdFit-primary is provisional pending a revenue A/B once both networks are
 * approved — swap this single constant to flip the waterfall order on /ko/.
 * See memory/topics/kkumhaemong/ads-strategy.md, 2026-08-14 amendments #4.
 */
const AD_NETWORK_ORDER: Record<string, Array<"adfit" | "adsense">> = {
  ko: ["adfit", "adsense"],
  en: ["adsense"],
};

// Reserved min-heights protect CLS while no network script is loaded — these
// are NOT live ad calls, just a placeholder box sized to the responsive
// in-content unit the real network will eventually render. Mobile-first sizes
// per the ads strategy doc (~250-280px mobile, ~100-250px desktop), tightened
// slightly for the `end` slot since it competes with Related Dreams below it.
const SLOT_MIN_HEIGHT: Record<AdSlotName, string> = {
  "in-content-1": "min-h-[280px] sm:min-h-[250px] lg:min-h-[200px]",
  "in-content-2": "min-h-[280px] sm:min-h-[250px] lg:min-h-[200px]",
  end: "min-h-[250px] sm:min-h-[220px] lg:min-h-[100px]",
};

export function AdSlot({ slot, locale }: Props) {
  // Hard gate: unset in production → this component renders null and the
  // site is visually unchanged after deploy. Do not wire network scripts
  // outside this flag — networks are not approved yet.
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  // in-content-1 renders eagerly (above the fold soon after intro); the
  // other two lazy-render via IntersectionObserver so they don't cost
  // anything until the reader scrolls near them. Computed lazily so the
  // no-IntersectionObserver fallback doesn't need a synchronous setState
  // inside the effect body.
  const [visible, setVisible] = useState(
    () => slot === "in-content-1" || typeof IntersectionObserver === "undefined"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adsEnabled || visible) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [adsEnabled, visible]);

  if (!adsEnabled) return null;

  const networks = AD_NETWORK_ORDER[locale] ?? AD_NETWORK_ORDER.en;

  return (
    <div
      ref={containerRef}
      data-ad-slot={slot}
      data-ad-network-order={networks.join(",")}
      className={`w-full ${SLOT_MIN_HEIGHT[slot]} flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/10 light:bg-black/[0.02]`}
    >
      {/* Korean ad-labeling norms require a clear "광고" label on native/in-content units. */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">
        {locale === "ko" ? "광고" : "AD"}
      </span>
      {visible && (
        <span className="text-xs text-text-subtle">
          {/*
            Network injection point. Once AdFit/AdSense are approved, render
            the primary network from `networks[0]` here (e.g. <AdFitUnit /> or
            <AdSenseUnit />), with the second entry as fill. Keep this whole
            branch behind `adsEnabled` — no script tags outside this gate.

            Consent contract (src/lib/consent.ts): before loading any network
            script here, gate on `getConsent() === "granted"`. Visitors who
            have not yet decided (getConsent() === null) or who declined
            should not trigger a network ad-script fetch. See the site-wide
            cookie-consent banner (CookieConsent.tsx) for how the choice is
            captured and persisted (localStorage key "ad-consent", no cookie).
          */}
          {locale === "ko" ? "광고 준비 중" : "Ad space reserved"}
        </span>
      )}
    </div>
  );
}

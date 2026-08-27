"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getConsent, subscribeConsent } from "@/lib/consent";

export type AdSlotName = "in-content-1" | "in-content-2" | "end";
type Network = "adfit" | "adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

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
const AD_NETWORK_ORDER: Record<string, Network[]> = {
  ko: ["adfit", "adsense"],
  en: ["adsense"],
};

/**
 * Per-network consent gating.
 *
 * AdFit is mid 매체 심사 (media review, held 2026-08-19 — "설치 후 심사 진행
 * 가능", i.e. Kakao only reviews once the snippet is live). Kakao's reviewer
 * never opens the cookie banner, so gating the AdFit snippet behind consent
 * would make it invisible to review and fail it again. AdFit therefore loads
 * unconditionally once `NEXT_PUBLIC_ADS_ENABLED=true` and a unit id is set —
 * KR PIPA's cookie/localStorage requirement is notice-based and the banner
 * itself satisfies notice; the AdFit snippet sets no cookie of its own.
 * AdSense stays consent-gated (GDPR-relevant, /en/ international audience).
 * Revisit this table once AdFit clears review.
 */
const NETWORK_REQUIRES_CONSENT: Record<Network, boolean> = {
  adfit: false,
  adsense: true,
};

// Fixed banner sizes — AdFit web has no responsive/native unit, fixed sizes
// only (160x600, 250x250, 300x250, 320x100, 320x50, 728x90). Reused for the
// AdSense in-article units too so both networks fill the identical box.
const SLOT_SIZE: Record<AdSlotName, { width: number; height: number }> = {
  "in-content-1": { width: 320, height: 100 },
  "in-content-2": { width: 300, height: 250 },
  end: { width: 320, height: 100 },
};

// Static process.env.NEXT_PUBLIC_* reads — Next.js inlines these at build
// time via literal source-text replacement, so each one must be written out
// (no dynamic `process.env[key]` lookups, those resolve to undefined in the
// browser bundle).
const ADFIT_UNIT: Record<AdSlotName, string | undefined> = {
  "in-content-1": process.env.NEXT_PUBLIC_ADFIT_UNIT_IN_CONTENT_1,
  "in-content-2": process.env.NEXT_PUBLIC_ADFIT_UNIT_IN_CONTENT_2,
  end: process.env.NEXT_PUBLIC_ADFIT_UNIT_END,
};

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

const ADSENSE_SLOT: Record<AdSlotName, string | undefined> = {
  "in-content-1": process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT_1,
  "in-content-2": process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT_2,
  end: process.env.NEXT_PUBLIC_ADSENSE_SLOT_END,
};

/**
 * Two-phase CLS strategy for AdFit, see CLAUDE.md "Ads" section.
 *
 * Phase 1 (pre-approval, this flag unset/false): the box collapses to the
 * `<ins>`'s own natural size, i.e. zero, until an ad fills — matching
 * AdFit's own `display:none`-then-reveal snippet behavior. A permanently
 * reserved empty box would be dead whitespace on the live site while Kakao's
 * reviewer is looking at it.
 *
 * Phase 2 (post-approval, flip to true): the wrapper reserves the exact
 * pixel box up front so a slow/failed ad request can't shift layout.
 */
const ADFIT_RESERVE_SPACE = process.env.NEXT_PUBLIC_ADFIT_RESERVE_SPACE === "true";

let adfitScriptRequested = false;
function ensureAdFitScript() {
  if (adfitScriptRequested || typeof document === "undefined") return;
  adfitScriptRequested = true;
  if (document.getElementById("kakao-adfit-script")) return;
  const script = document.createElement("script");
  script.id = "kakao-adfit-script";
  script.async = true;
  script.src = "//t1.kakaocdn.net/kas/static/ba.min.js";
  document.body.appendChild(script);
}

type Props = {
  slot: AdSlotName;
  locale: string;
};

export function AdSlot({ slot, locale }: Props) {
  // Hard gate: unset in production → this component renders null and the
  // site is visually unchanged after deploy. Do not wire network scripts
  // outside this flag — neither network is fully approved yet.
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  // Reactive to consent changes made via the cookie banner in the same tab
  // (see subscribeConsent in src/lib/consent.ts) — no reload required for
  // AdSense slots to activate once the visitor grants consent. AdFit does
  // not read this (see NETWORK_REQUIRES_CONSENT above).
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);

  const networks = AD_NETWORK_ORDER[locale] ?? AD_NETWORK_ORDER.en;
  const { width, height } = SLOT_SIZE[slot];

  const adfitConfigured = Boolean(ADFIT_UNIT[slot]);
  const adsenseConfigured = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT[slot]);
  const adsenseReady =
    adsenseConfigured && (!NETWORK_REQUIRES_CONSENT.adsense || consent === "granted");

  const primary: Network | undefined = networks.find((network) =>
    network === "adfit" ? adfitConfigured : adsenseReady
  );
  // Only meaningful when primary === "adfit" — whether AdSense can pick up
  // the NO-AD callback if AdFit fails to fill (see onfail effect below).
  const canFallbackToAdsense =
    primary === "adfit" && networks.includes("adsense") && adsenseReady;

  // AdFit must be present in the DOM on initial render (media review needs
  // to see installed ad code without scrolling) — no IntersectionObserver
  // lazy-render for it. AdSense-only slots keep the original lazy behavior:
  // in-content-1 renders eagerly, the other two wait until near-viewport.
  const adfitEligible = networks[0] === "adfit" && adfitConfigured;
  const [visible, setVisible] = useState(
    () =>
      adfitEligible ||
      slot === "in-content-1" ||
      typeof IntersectionObserver === "undefined"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [adfitFilled, setAdfitFilled] = useState(false);
  const adsensePushed = useRef(false);

  const onFailName = `__adfitOnFail_${slot.replace(/-/g, "_")}`;

  useEffect(() => {
    // adfitEligible slots are already `visible` from the useState initializer
    // above (deterministic from static props/env, never flips after mount),
    // so this effect only ever needs to set up IO for the adsense-lazy path.
    if (!adsEnabled || visible || adfitEligible) return;
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
  }, [adsEnabled, visible, adfitEligible]);

  // Load ba.min.js once per page (not once per slot), regardless of consent
  // — see NETWORK_REQUIRES_CONSENT above.
  useEffect(() => {
    if (!adsEnabled || primary !== "adfit") return;
    ensureAdFitScript();
  }, [adsEnabled, primary]);

  // NO-AD callback (§1.2 of the AdFit Web SDK guide, data-ad-onfail): fires
  // when AdFit has no fill or the request fails. When AdSense is configured
  // and consented, inject an AdSense unit into the same box — this is
  // Kakao's own documented waterfall pattern (their guide's example injects
  // an adsbygoogle <ins> from this exact callback). Re-registered whenever
  // consent/config changes so a late "granted" click is picked up without
  // reload.
  useEffect(() => {
    if (!adsEnabled || primary !== "adfit") return;
    const globalWindow = window as unknown as Record<string, (elm: HTMLElement) => void>;
    globalWindow[onFailName] = (elm: HTMLElement) => {
      if (!canFallbackToAdsense || !ADSENSE_CLIENT || !ADSENSE_SLOT[slot]) return;
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "inline-block";
      ins.style.width = `${width}px`;
      ins.style.height = `${height}px`;
      ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
      ins.setAttribute("data-ad-slot", ADSENSE_SLOT[slot]!);
      elm.appendChild(ins);
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    };
    return () => {
      delete globalWindow[onFailName];
    };
  }, [adsEnabled, primary, canFallbackToAdsense, slot, onFailName, width, height]);

  // Label visibility for the AdFit branch: before approval (ADFIT_RESERVE_SPACE
  // unset) we don't want a "광고" label sitting over empty space, so only show
  // it once an ad has actually revealed (AdFit's snippet flips the <ins>'s
  // inline `display:none` off on fill — watch for that). After approval, the
  // box is reserved anyway, so show the label immediately.
  useEffect(() => {
    if (primary !== "adfit" || ADFIT_RESERVE_SPACE) return;
    const el = insRef.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      if (el.style.display !== "none") setAdfitFilled(true);
    });
    observer.observe(el, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [primary]);

  // Push the standalone AdSense unit (locale === "en", or ko when AdFit is
  // not configured) once it mounts.
  useEffect(() => {
    if (!adsEnabled || primary !== "adsense" || !visible || adsensePushed.current) return;
    adsensePushed.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // adsbygoogle.js not loaded yet (consent just granted) — the queued
      // push is picked up once AdSenseLoader's script finishes loading.
    }
  }, [adsEnabled, primary, visible]);

  if (!adsEnabled || !primary || !visible) return null;

  const showLabel = primary === "adsense" || ADFIT_RESERVE_SPACE || adfitFilled;
  const reserveBox = primary === "adsense" || ADFIT_RESERVE_SPACE;

  return (
    <div
      ref={containerRef}
      data-ad-slot={slot}
      data-ad-network={primary}
      className="w-full flex flex-col items-center justify-center gap-1"
      style={reserveBox ? { minHeight: height } : undefined}
    >
      {showLabel && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">
          {locale === "ko" ? "광고" : "AD"}
        </span>
      )}
      {primary === "adfit" ? (
        <ins
          ref={insRef}
          className="kakao_ad_area"
          style={{ display: "none", width, height }}
          data-ad-unit={ADFIT_UNIT[slot]}
          data-ad-width={String(width)}
          data-ad-height={String(height)}
          data-ad-onfail={onFailName}
        />
      ) : (
        <ins
          className="adsbygoogle"
          style={{ display: "inline-block", width, height }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT[slot]}
        />
      )}
    </div>
  );
}

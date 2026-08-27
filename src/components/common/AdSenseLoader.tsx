"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getConsent, subscribeConsent } from "@/lib/consent";

// Site-wide AdSense loader script. Unlike AdFit (see AdSlot.tsx), AdSense
// remains fully consent-gated — it is GDPR-relevant for the /en/
// international audience and is not under a live-installation review
// requirement the way AdFit currently is. Mounted once in the locale
// layout; reactive to consent so a same-session "동의" click activates it
// without a reload.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

let adsenseScriptRequested = false;
function ensureAdSenseScript(client: string) {
  if (adsenseScriptRequested || typeof document === "undefined") return;
  adsenseScriptRequested = true;
  if (document.getElementById("adsbygoogle-script")) return;
  const script = document.createElement("script");
  script.id = "adsbygoogle-script";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(script);
}

export function AdSenseLoader() {
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);

  useEffect(() => {
    if (!adsEnabled || !ADSENSE_CLIENT || consent !== "granted") return;
    ensureAdSenseScript(ADSENSE_CLIENT);
  }, [adsEnabled, consent]);

  return null;
}

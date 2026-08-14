"use client";

import { useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { setConsent, shouldPromptConsent } from "@/lib/consent";

const COPY: Record<Locale, {
  message: string;
  linkLabel: string;
  accept: string;
  decline: string;
  ariaLabel: string;
}> = {
  ko: {
    message: "이 사이트는 서비스 개선 및 광고를 위해 쿠키를 사용합니다.",
    linkLabel: "개인정보처리방침",
    accept: "동의",
    decline: "거부",
    ariaLabel: "쿠키 사용 동의 안내",
  },
  en: {
    message: "This site uses cookies to improve the service and show ads.",
    linkLabel: "Privacy Policy",
    accept: "Accept",
    decline: "Decline",
    ariaLabel: "Cookie consent notice",
  },
};

// No-op subscription: the stored choice only ever changes from this
// component's own button handlers, which flip `dismissed` directly instead
// of relying on store change notifications.
function subscribe() {
  return () => {};
}

// Server render always assumes "don't show yet" — the real answer depends on
// localStorage, which doesn't exist on the server. useSyncExternalStore
// reconciles this safely on hydration without a manual effect + setState.
function getServerSnapshot() {
  return false;
}

function useShouldPromptConsent(): boolean {
  return useSyncExternalStore(subscribe, shouldPromptConsent, getServerSnapshot);
}

export function CookieConsent({ locale }: { locale: Locale }) {
  const shouldPrompt = useShouldPromptConsent();
  const [dismissed, setDismissed] = useState(false);
  const copy = COPY[locale] ?? COPY.en;

  if (!shouldPrompt || dismissed) return null;

  function handleChoice(value: "granted" | "denied") {
    setConsent(value);
    setDismissed(true);
  }

  return (
    <div
      role="dialog"
      aria-label={copy.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-[70] px-4 pt-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-midnight/95 light:bg-[#fdf8f1]/95 backdrop-blur-md shadow-lg px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-text-secondary">
          {copy.message}{" "}
          <Link href="/privacy-policy" className="text-gold hover:underline">
            {copy.linkLabel}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => handleChoice("denied")}
            className="min-h-[44px] rounded-full border border-border px-4 py-2 text-sm font-bold text-text-secondary transition-colors hover:border-gold hover:text-gold"
          >
            {copy.decline}
          </button>
          <button
            type="button"
            onClick={() => handleChoice("granted")}
            className="min-h-[44px] rounded-full bg-gold px-4 py-2 text-sm font-bold text-midnight transition-opacity hover:opacity-90"
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

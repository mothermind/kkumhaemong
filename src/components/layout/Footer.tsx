"use client";

import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

export function Footer({ locale: _locale }: { locale: Locale }) {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-stone-200 dark:border-stone-800/60">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-200" style={{ fontFamily: 'var(--font-serif)' }}>꿈해몽</p>
            <p className="mt-0.5 text-sm text-stone-500">{t("description")}</p>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-600">{t("copyright", { year })}</p>
        </div>
        <p className="mt-6 text-center text-xs text-stone-400 dark:text-stone-600">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}

"use client";

import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

export function Footer({ locale: _locale }: { locale: Locale }) {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-white">꿈해몽</p>
            <p className="mt-0.5 text-sm text-gray-500">{t("description")}</p>
          </div>
          <p className="text-xs text-gray-600">{t("copyright", { year })}</p>
        </div>
        <p className="mt-6 text-center text-xs text-gray-600">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}

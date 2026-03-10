"use client";

import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-indigo-600">꿈해몽</p>
            <p className="mt-0.5 text-sm text-gray-500">{t("description")}</p>
          </div>
          <p className="text-xs text-gray-400">
            {t("copyright", { year })}
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          {t("disclaimer")}
        </p>
      </div>
    </footer>
  );
}

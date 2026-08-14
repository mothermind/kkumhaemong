"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const CONTACT_EMAIL = "jinju.askme@gmail.com";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#080e1c] light:bg-[#fdf8f1] border-t border-border py-12">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-4">
        <Link href="/" className="flex flex-col items-center leading-none">
          <span
            className="text-lg font-bold tracking-widest text-text-primary"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            꿈해몽
          </span>
          <span className="text-[10px] font-light tracking-normal opacity-60 uppercase mt-1">
            {t("tagline")}
          </span>
        </Link>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          {CONTACT_EMAIL}
        </a>

        <div className="mt-4 pt-4 border-t border-border w-full flex flex-col items-center gap-2">
          <p className="text-[10px] text-text-subtle uppercase tracking-widest">
            {t("copyright", { year })}
          </p>
          <Link
            href="/privacy-policy"
            className="text-[10px] text-text-subtle uppercase tracking-widest hover:text-text-muted transition-colors"
          >
            {t("privacyPolicy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

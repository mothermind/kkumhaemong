"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#080e1c] light:bg-[#fdf8f1] border-t border-border py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand — spans 2 cols */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex flex-col leading-none mb-6 inline-flex">
              <span className="text-xl font-bold tracking-widest text-text-primary" style={{ fontFamily: "var(--font-serif)" }}>
                꿈해몽
              </span>
              <span className="text-[10px] font-light tracking-normal opacity-60 uppercase mt-1">
                Kkumhaemong
              </span>
            </Link>
            <p className="text-text-muted text-sm max-w-sm leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-6">
              {locale === "ko" ? "안내" : "Legal"}
            </h4>
            <ul className="text-sm text-text-muted space-y-4">
              <li>
                <Link href="/about" className="hover:text-text-primary transition-colors">
                  {locale === "ko" ? "사이트 소개" : "About"}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-text-primary transition-colors">
                  {locale === "ko" ? "문의하기" : "Contact"}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-text-primary transition-colors">
                  {locale === "ko" ? "개인정보처리방침" : "Privacy Policy"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Service */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-6">
              {locale === "ko" ? "서비스" : "Service"}
            </h4>
            <ul className="text-sm text-text-muted space-y-4">
              <li>
                <Link href="/explore" className="hover:text-text-primary transition-colors">
                  {locale === "ko" ? "꿈해몽 백과" : "Dream Encyclopedia"}
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-text-primary transition-colors">
                  {locale === "ko" ? "카테고리 탐색" : "Browse Categories"}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-text-subtle uppercase tracking-widest">
            {t("copyright", { year })}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-text-subtle font-light italic">
            {t("disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}

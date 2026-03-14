"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-indigo-deep border-t border-white/5 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand — spans 2 cols */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex flex-col leading-none mb-6 inline-flex">
              <span className="text-xl font-bold tracking-widest text-white" style={{ fontFamily: "var(--font-serif)" }}>
                꿈해몽
              </span>
              <span className="text-[10px] font-light tracking-normal opacity-60 uppercase mt-1">
                Kkumhaemong
              </span>
            </Link>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Service */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-6">
              {locale === "ko" ? "서비스" : "Service"}
            </h4>
            <ul className="text-sm text-slate-400 space-y-4">
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  {locale === "ko" ? "꿈해몽 백과" : "Dream Encyclopedia"}
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  {locale === "ko" ? "카테고리 탐색" : "Browse Categories"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-6">
              {locale === "ko" ? "안내" : "Info"}
            </h4>
            <ul className="text-sm text-slate-400 space-y-4">
              <li>
                <span className="text-slate-600">
                  {locale === "ko" ? "개인정보처리방침" : "Privacy Policy"}
                </span>
              </li>
              <li>
                <span className="text-slate-600">
                  {locale === "ko" ? "이용약관" : "Terms of Service"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            {t("copyright", { year })}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-700 font-light italic">
            {t("disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}

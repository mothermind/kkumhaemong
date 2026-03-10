"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useState } from "react";
import { use } from "react";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  return <HomePageClient locale={locale as Locale} />;
}

function HomePageClient({ locale }: { locale: Locale }) {
  const t = useTranslations("home");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const slug = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    router.push({ pathname: "/dream/[slug]", params: { slug } });
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <h1 className="mb-8 text-3xl font-bold text-white sm:text-4xl">
        {locale === "ko" ? "꿈해몽" : "Dream Dictionary"}
      </h1>
      <form onSubmit={handleSearch} className="w-full max-w-md">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locale === "ko" ? "꿈 검색... (예: 뱀꿈, 돼지꿈)" : "Search dreams... (e.g. snake, flying)"}
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-500 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
          />
          <button
            type="submit"
            className="rounded-lg bg-white px-5 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100"
          >
            {locale === "ko" ? "검색" : "Search"}
          </button>
        </div>
      </form>
    </div>
  );
}

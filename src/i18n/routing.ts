import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"] as const,
  defaultLocale: "ko",
  pathnames: {
    "/": "/",
    "/dream/[slug]": {
      ko: "/꿈해몽/[slug]",
      en: "/dream/[slug]",
    },
    "/category/[category]": {
      ko: "/카테고리/[category]",
      en: "/category/[category]",
    },
    "/explore": {
      ko: "/탐색",
      en: "/explore",
    },
    "/explore/[category]": {
      ko: "/탐색/[category]",
      en: "/explore/[category]",
    },
  },
});

export type Locale = (typeof routing.locales)[number];

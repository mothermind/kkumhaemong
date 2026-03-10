import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        // Naver bot — explicitly allow everything
        userAgent: "Yeti",
        allow: "/",
      },
    ],
    sitemap: "https://kkumhaemong.com/sitemap.xml",
  };
}

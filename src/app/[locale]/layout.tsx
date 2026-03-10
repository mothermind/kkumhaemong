import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Noto_Sans_KR } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-latin",
});

const notoSansKR = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  variable: "--font-korean",
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kkumhaemong.com"),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geist.variable} ${notoSansKR.variable}`}
    >
      <body
        className={`min-h-screen bg-background text-foreground ${
          locale === "ko" ? "font-[family-name:var(--font-korean)]" : "font-[family-name:var(--font-latin)]"
        }`}
      >
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale as Locale} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

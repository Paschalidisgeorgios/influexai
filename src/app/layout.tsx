import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, Fraunces, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { getTenantFromHeaders, tenantToBranding } from "@/lib/tenant";
import { TenantBrandingStyles } from "@/components/tenant-branding-styles";
import { TenantProvider } from "@/components/tenant-provider";
import { ObsidianShell } from "@/components/ui/ObsidianShell";
import { PwaBootstrap } from "@/components/pwa/PwaBootstrap";
import {
  buildHreflangAlternates,
  getHomeSeo,
  openGraphImageUrl,
  OPEN_GRAPH_LOCALE,
  parseKeywords,
  SEO_BASE_URL,
  localizedUrl,
} from "@/lib/seo";
import type { Locale } from "@/lib/locale";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: "400",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const home = getHomeSeo(locale);
  const canonical = localizedUrl("/", locale);
  const ogImage = openGraphImageUrl(locale);

  return {
    metadataBase: new URL(SEO_BASE_URL),
    title: home.title,
    description: home.description,
    keywords: parseKeywords(home.keywords),
    authors: [{ name: "InfluexAI GmbH" }],
    manifest: "/manifest.json",
    robots: { index: true, follow: true },
    alternates: buildHreflangAlternates("/"),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
    },
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALE[locale],
      url: canonical,
      siteName: "InfluexAI",
      title: home.title,
      description: home.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: home.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: home.title,
      description: home.description,
      images: [ogImage],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "InfluexAI",
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#B4FF00",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRTL = locale === "ar";
  const tenant = await getTenantFromHeaders();
  const branding = tenantToBranding(tenant);
  const isTenantRoute = !!tenant;

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${bebasNeue.variable} ${dmSans.variable} ${fraunces.variable} ${notoSansArabic.variable} dark`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#B4FF00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <TenantBrandingStyles tenant={tenant} />
      </head>
      <body
        className={`min-h-screen antialiased overflow-x-hidden text-[#F0EFE8] ${isRTL ? "font-[family-name:var(--font-arabic)]" : ""}`}
        style={{
          background: "var(--background)",
          color: "var(--white, #F0EFE8)",
        }}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TenantProvider branding={branding} isTenantRoute={isTenantRoute}>
            <ObsidianShell />
            <PwaBootstrap />
            {children}
          </TenantProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

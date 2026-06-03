import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: "400",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InfluexAI — Dein KI-Charakter. Deine Welt.",
    template: "%s | InfluexAI",
  },
  description:
    "Erstelle deinen KI-Influencer, streame live ohne Gesicht und generiere Produkt-Ads die konvertieren. Das KI-Creator & Brand-Studio 2026.",
  keywords: [
    "KI Influencer",
    "AI Creator",
    "Face Swap Live",
    "KI Charakter",
    "Produkt Werbung KI",
    "InfluexAI",
  ],
  authors: [{ name: "InfluexAI GmbH" }],
  manifest: "/manifest.json",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#060608",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${dmSans.variable} dark`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="InfluexAI" />
      </head>
      <body className="min-h-screen bg-[#060608] text-[#F0EFE8] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

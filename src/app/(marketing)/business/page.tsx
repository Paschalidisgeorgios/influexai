import type { Metadata } from "next";
import { BusinessLandingPage } from "@/components/marketing/BusinessLandingPage";

export const metadata: Metadata = {
  title: "InfluexAI für Brands & Businesses — Content ohne Agentur",
  description:
    "Erstelle professionelle Werbung, Kampagnen und Social Content vollautomatisch. Ab 9,99€/Monat. Keine Agentur nötig.",
  openGraph: {
    title: "InfluexAI für Brands & Businesses — Content ohne Agentur",
    description:
      "Erstelle professionelle Werbung, Kampagnen und Social Content vollautomatisch. Ab 9,99€/Monat. Keine Agentur nötig.",
    type: "website",
  },
};

export default function BusinessPage() {
  return <BusinessLandingPage />;
}

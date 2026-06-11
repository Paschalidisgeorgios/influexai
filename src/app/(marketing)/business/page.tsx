import type { Metadata } from "next";
import { BusinessLandingPage } from "@/components/marketing/BusinessLandingPage";

export const metadata: Metadata = {
  title: "InfluexAI für Marken & Business | KI-Content ohne Agentur",
  description:
    "Erstelle professionelle Werbung, Social Content und Kampagnen vollautomatisch mit deiner eigenen KI — für Marken, Teams und Agenturen.",
  openGraph: {
    title: "InfluexAI für Marken & Business",
    description:
      "KI-Content für deine Marke. Ohne Agentur. Werbung, Social Content und Kampagnen auf Autopilot.",
    type: "website",
  },
};

export default function BusinessPage() {
  return <BusinessLandingPage />;
}

import type { Metadata } from "next";
import { PricingPreviewPage } from "@/components/landing-v2/PricingPreviewPage";

export const metadata: Metadata = {
  title: "Pricing Preview | InfluexAI",
  description: "Interne Vorschau der neuen Pricing-Seite im Landing-V2-Design.",
  robots: { index: false, follow: false },
};

export default function DesignPricingPreviewPage() {
  return <PricingPreviewPage />;
}

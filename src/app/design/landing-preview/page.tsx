import type { Metadata } from "next";
import { LandingPreviewPage } from "@/components/landing-v2/LandingPreviewPage";

export const metadata: Metadata = {
  title: "Landing Preview | InfluexAI",
  description: "Interne Vorschau der neuen InfluexAI Landingpage.",
  robots: { index: false, follow: false },
};

export default function DesignLandingPreviewPage() {
  return <LandingPreviewPage />;
}

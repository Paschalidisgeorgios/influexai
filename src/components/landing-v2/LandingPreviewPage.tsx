"use client";

import "@/styles/landing-v2.css";

import { LandingV2Nav } from "./sections/LandingV2Nav";
import { LandingV2Hero } from "./sections/LandingV2Hero";
import { LandingV2ScrollStory } from "./sections/LandingV2ScrollStory";
import { LandingV2ProductionPaths } from "./sections/LandingV2ProductionPaths";
import { LandingV2StudioPreview } from "./sections/LandingV2StudioPreview";
import { LandingV2Proof } from "./sections/LandingV2Proof";
import { LandingV2PricingTeaser } from "./sections/LandingV2PricingTeaser";
import { LandingV2FinalCta } from "./sections/LandingV2FinalCta";
import { LandingV2Footer } from "./sections/LandingV2Footer";
import { LandingMotionProvider } from "./LandingMotionProvider";

export function LandingPreviewPage() {
  return (
    <LandingMotionProvider>
    <div className="landing-v2-root min-h-screen overflow-x-clip">
      <div className="landing-v2-preview-banner landing-v2-preview-banner--subtle" role="status">
        Interne Vorschau — nicht die Live-Landingpage unter /
      </div>

      <LandingV2Nav />

      <main>
        <LandingV2Hero />
        <LandingV2ScrollStory />
        <LandingV2ProductionPaths />
        <LandingV2StudioPreview />
        <LandingV2Proof />
        <LandingV2PricingTeaser />
        <LandingV2FinalCta />
      </main>

      <LandingV2Footer />
    </div>
    </LandingMotionProvider>
  );
}

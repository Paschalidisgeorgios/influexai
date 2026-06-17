"use client";

import "@/styles/landing-v2.css";

import type { LandingV2Mode } from "@/lib/landing-v2-config";
import { BrandIntroProvider, useBrandIntro } from "./BrandIntroContext";
import { LandingV2BrandIntro } from "./LandingV2BrandIntro";
import { LandingV2ModeProvider, useLandingV2Links } from "./LandingV2ModeContext";
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

function LandingV2Shell() {
  const { introDismissed, chromeVisible } = useBrandIntro();
  const links = useLandingV2Links();

  const introStateClass = introDismissed
    ? "landing-v2-root--intro-complete"
    : chromeVisible
      ? "landing-v2-root--intro-chrome"
      : "landing-v2-root--intro-active";

  const modeClass =
    links.mode === "live" ? "landing-v2-root--live" : "landing-v2-root--preview";

  return (
    <div
      className={`landing-v2-root min-h-screen overflow-x-clip ${introStateClass} ${modeClass}`}
    >
      {links.landingPreviewBanner ? (
        <div className="landing-v2-preview-banner landing-v2-preview-banner--subtle" role="status">
          {links.landingPreviewBanner}
        </div>
      ) : null}

      <LandingV2Nav />
      <LandingV2BrandIntro />

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
  );
}

type LandingV2PageProps = {
  mode: LandingV2Mode;
};

export function LandingV2Page({ mode }: LandingV2PageProps) {
  return (
    <LandingMotionProvider>
      <LandingV2ModeProvider mode={mode}>
        <BrandIntroProvider>
          <LandingV2Shell />
        </BrandIntroProvider>
      </LandingV2ModeProvider>
    </LandingMotionProvider>
  );
}

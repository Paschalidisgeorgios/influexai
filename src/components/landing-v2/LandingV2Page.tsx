"use client";

import "@/styles/landing-v2.css";

import type { LandingV2Mode } from "@/lib/landing-v2-config";
import { BrandIntroProvider, useBrandIntro } from "./BrandIntroContext";
import { LandingV2BrandIntro } from "./LandingV2BrandIntro";
import { LandingV2ModeProvider, useLandingV2Links } from "./LandingV2ModeContext";
import { LandingV2Nav } from "./sections/LandingV2Nav";
import { LandingV2Hero } from "./sections/LandingV2Hero";
import { LandingV2SystemChapter } from "./sections/LandingV2SystemChapter";
import { LandingV2ScrollStory } from "./sections/LandingV2ScrollStory";
import { LandingV2ProductionPaths } from "./sections/LandingV2ProductionPaths";
import { LandingV2StudioPreview } from "./sections/LandingV2StudioPreview";
import { LandingV2ProductStory } from "./sections/LandingV2ProductStory";
import { LandingV2SocialProof } from "./sections/LandingV2SocialProof";
import { LandingV2PricingTeaser } from "./sections/LandingV2PricingTeaser";
import { LandingV2FinalCta } from "./sections/LandingV2FinalCta";
import { LandingV2Footer } from "./sections/LandingV2Footer";
import { LandingMotionProvider } from "./LandingMotionProvider";
function LandingV2Shell() {
  const { introDismissed, chromeVisible } = useBrandIntro();
  const links = useLandingV2Links();

  const introStateClass = links.enableBrandIntro
    ? introDismissed
      ? "landing-v2-page--intro-complete"
      : chromeVisible
        ? "landing-v2-page--intro-chrome"
        : "landing-v2-page--intro-active"
    : "";

  const introNavClass = links.enableBrandIntro
    ? introDismissed
      ? "landing-v2-nav--intro-complete"
      : chromeVisible
        ? "landing-v2-nav--intro-chrome"
        : "landing-v2-nav--intro-active"
    : "";

  const modeClass =
    links.mode === "live" ? "landing-v2-root--live" : "landing-v2-root--preview";

  const pageClass = `landing-v2-page ${modeClass} ${introStateClass}`.trim();
  const isPreview = links.mode === "preview";

  return (
    <>
      {links.landingPreviewBanner ? (
        <div className="landing-v2-preview-banner landing-v2-preview-banner--subtle" role="status">
          {links.landingPreviewBanner}
        </div>
      ) : null}

      <LandingV2Nav introClass={introNavClass} isPreview={isPreview} />

      <div className={pageClass}>
        <div className="landing-v2-root min-h-screen">
          {links.enableBrandIntro ? <LandingV2BrandIntro /> : null}

          <main className="landing-v2-main overflow-x-clip">
            <LandingV2Hero />
            {isPreview ? (
              <>
                <LandingV2ProductStory />
                <LandingV2SocialProof />
                <LandingV2PricingTeaser />
                <LandingV2FinalCta />
              </>
            ) : (
              <>
                <LandingV2SystemChapter />
                <LandingV2ScrollStory />
                <LandingV2ProductionPaths />
                <LandingV2StudioPreview />
                <LandingV2PricingTeaser />
              </>
            )}
          </main>

          <LandingV2Footer />
        </div>
      </div>
    </>
  );
}

type LandingV2PageProps = {
  mode: LandingV2Mode;
};

export function LandingV2Page({ mode }: LandingV2PageProps) {
  const enableBrandIntro = mode === "live";

  return (
    <LandingV2ModeProvider mode={mode}>
      <LandingMotionProvider>
        <BrandIntroProvider enabled={enableBrandIntro}>
          <LandingV2Shell />
        </BrandIntroProvider>
      </LandingMotionProvider>
    </LandingV2ModeProvider>
  );
}

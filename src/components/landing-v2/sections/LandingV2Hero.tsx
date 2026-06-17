"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { LandingV2CreatorProductionFlow } from "../ui/LandingV2CreatorProductionFlow";
import { LandingV2FlowStage } from "../ui/LandingV2FlowStage";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useHeroEntrance } from "../hooks/useHeroEntrance";
import { useBrandIntro } from "../BrandIntroContext";

const copy = LANDING_V2_COPY.hero;

export function LandingV2Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const links = useLandingV2Links();
  const isPreview = links.mode === "preview";
  const { heroReady: introHeroReady } = useBrandIntro();
  const heroReady = links.enableBrandIntro ? introHeroReady : true;

  useHeroEntrance(sectionRef, heroReady);

  return (
    <section
      ref={sectionRef}
      className={`landing-v2-hero landing-v2-hero--terminal relative min-h-[100svh] overflow-x-clip ${
        isPreview ? "landing-v2-hero--media-stage" : ""
      }`.trim()}
      aria-labelledby="lv2-hero-heading"
    >
      {!isPreview ? (
        <>
          <div className="landing-v2-hero__gradient" aria-hidden />
          <div className="landing-v2-hero__flow-silhouette-wrap">
            <LandingV2FlowStage variant="hero" className="landing-v2-hero__flow-silhouette" />
          </div>
        </>
      ) : (
        <div className="landing-v2-hero__readability-scrim" aria-hidden />
      )}

      <div className="landing-v2-hero__content landing-v2-hero__shell--offset relative z-[3] mx-auto flex min-h-[100svh] w-full max-w-[90rem] flex-col justify-end px-4 pb-8 pt-[var(--lv2-nav-offset)] sm:px-5 md:px-8 md:pb-12 lg:pb-14">
        <div className="landing-v2-hero__copy flex min-w-0 max-w-4xl flex-col">
          <p className="landing-v2-kicker landing-v2-kicker--editorial mb-4 md:mb-5" data-hero-eyebrow>
            <span className="landing-v2-kicker__dot" aria-hidden />
            {copy.eyebrow}
          </p>
          <h1
            id="lv2-hero-heading"
            className="landing-v2-headline landing-v2-hero-display landing-v2-hero__headline"
            data-hero-headline
          >
            {copy.headlineLines[0]}
            <br />
            {copy.headlineLines[1]}
            <br />
            {copy.headlineLines[2]}
          </h1>
          <p
            className="landing-v2-hero__subline mt-5 max-w-xl md:mt-6"
            data-hero-subline
          >
            {copy.subline}
          </p>
          <div className="relative z-20 mt-7 flex w-full max-w-full flex-wrap items-center gap-3 md:mt-9">
            <Link
              href={links.signup}
              className="landing-v2-btn-primary min-h-[44px] shrink-0"
              data-hero-cta
            >
              {copy.ctaPrimary}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link
              href={links.pricing}
              className="landing-v2-btn-secondary min-h-[44px] shrink-0"
              data-hero-cta
            >
              {copy.ctaSecondary}
            </Link>
          </div>
        </div>

        {isPreview ? (
          <div data-hero-flow>
            <LandingV2CreatorProductionFlow
              variant="hero"
              className="landing-v2-hero__creator-flow"
            />
          </div>
        ) : null}
      </div>

      <div className="landing-v2-hero__fade" aria-hidden />
    </section>
  );
}

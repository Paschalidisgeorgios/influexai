"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { LandingV2HeroProductPanel } from "../ui/LandingV2HeroProductPanel";
import { LandingV2HeroAmbient } from "../ui/LandingV2HeroAmbient";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useHeroEntrance } from "../hooks/useHeroEntrance";
import { useHero3DStage } from "../hooks/useHero3DStage";
import { useBrandIntro } from "../BrandIntroContext";

const copy = LANDING_V2_COPY.hero;

export function LandingV2Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backPlateRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const links = useLandingV2Links();
  const { enableCinematicScroll, enableParallax3D, isMobile } = useLandingViewport();
  const { heroReady } = useBrandIntro();

  useHeroEntrance(sectionRef, heroReady);
  useHero3DStage({
    sectionRef,
    stageRef,
    panelRef,
    backPlateRef,
    ambientRef,
    enableParallax: enableCinematicScroll,
    enableMouse: enableParallax3D,
  });

  return (
    <section
      ref={sectionRef}
      className="landing-v2-hero landing-v2-hero--editorial relative min-h-[90vh] overflow-x-clip md:min-h-screen"
      aria-labelledby="lv2-hero-heading"
    >
      <LandingV2HeroAmbient ambientRef={ambientRef} />

      <div className="landing-v2-hero__fade" aria-hidden />

      <div className="relative z-10 mx-auto grid min-h-[inherit] w-full max-w-[90rem] grid-cols-1 items-stretch gap-10 px-4 pb-16 pt-28 sm:px-5 md:px-8 md:pb-20 md:pt-36 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14 lg:pb-24">
        <div className="landing-v2-hero__copy flex min-w-0 max-w-4xl flex-col justify-center">
          <p className="landing-v2-kicker landing-v2-kicker--editorial mb-5" data-hero-eyebrow>
            <span className="landing-v2-kicker__dot" aria-hidden />
            {copy.eyebrow}
          </p>
          <h1
            id="lv2-hero-heading"
            className="landing-v2-headline landing-v2-hero-display landing-v2-hero__headline text-[var(--lv2-text-light)]"
            data-hero-headline
          >
            {copy.headlineLines[0]}
            <br />
            {copy.headlineLines[1]}
            <br />
            {copy.headlineLines[2]}
          </h1>
          <p
            className="landing-v2-hero__subline mt-6 max-w-xl text-[clamp(1rem,2.2vw,1.125rem)] leading-relaxed text-white/62"
            data-hero-subline
          >
            {copy.subline}
          </p>
          <div className="relative z-20 mt-8 flex w-full max-w-full flex-wrap items-center gap-3 md:mt-10">
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

        <div
          ref={stageRef}
          className={`landing-v2-hero-stage landing-v2-hero-stage--editorial w-full min-w-0 max-w-full ${
            enableCinematicScroll ? "landing-v2-scene-3d" : ""
          }`}
        >
          <div className="landing-v2-scene-3d__rig landing-v2-hero-stage__rig h-full min-h-[inherit]">
            {enableCinematicScroll ? (
              <>
                <div
                  ref={backPlateRef}
                  className="landing-v2-hero-stage__back-plate landing-v2-panel-3d"
                  aria-hidden
                />
                <div
                  className="landing-v2-hero-stage__depth landing-v2-panel-3d"
                  aria-hidden
                />
              </>
            ) : null}
            <div
              ref={panelRef}
              data-hero-panel
              className={`landing-v2-hero-stage__panel landing-v2-hero-stage__panel--editorial ${
                enableCinematicScroll ? "landing-v2-panel-3d" : ""
              }`}
            >
              <LandingV2HeroProductPanel variant={isMobile ? "compact" : "stage"} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

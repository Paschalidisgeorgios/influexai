"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { LandingV2FlowStage } from "../ui/LandingV2FlowStage";
import { LandingV2HeroVideoBackground } from "../ui/LandingV2HeroVideoBackground";
import { useHeroEntrance } from "../hooks/useHeroEntrance";
import { useBrandIntro } from "../BrandIntroContext";

const copy = LANDING_V2_COPY.hero;

function renderMotionLine() {
  return (
    <span className="landing-v2-hero__headline-line" data-hero-headline-line>
      <span className="landing-v2-hero__headline-word" data-hero-headline-word>
        wird
      </span>{" "}
      <span className="landing-v2-hero__motion-wrap" data-hero-motion-signal>
        <span className="landing-v2-hero-rotate__keyword" data-hero-motion-word>
          {copy.primaryHeadlineHighlight}
        </span>
        <span className="landing-v2-hero__motion-line" data-hero-motion-line aria-hidden />
      </span>
      <span className="landing-v2-hero__headline-word" data-hero-headline-word>
        .
      </span>
    </span>
  );
}

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
      className={`landing-v2-hero landing-v2-hero--terminal relative min-h-[100svh] ${
        isPreview ? "landing-v2-hero--video-bg overflow-hidden" : "overflow-x-clip"
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
        <>
          <LandingV2HeroVideoBackground sectionRef={sectionRef} />
          <div className="landing-v2-hero__readability-scrim" aria-hidden />
        </>
      )}

      <div className="landing-v2-hero__content landing-v2-hero__shell--offset landing-v2-hero__content--preview-stage relative z-[3] mx-auto flex min-h-[100svh] w-full max-w-[90rem] flex-col justify-center gap-6 px-4 pb-8 pt-[var(--lv2-nav-offset)] sm:px-5 md:gap-8 md:px-8 md:pb-10 lg:pb-12">
        <div className="landing-v2-hero__copy flex min-w-0 max-w-4xl flex-col">
          {isPreview ? (
            <h1
              id="lv2-hero-heading"
              className="landing-v2-hero-headline landing-v2-hero__headline landing-v2-hero__headline--primary landing-v2-hero__headline--stack"
              data-hero-headline
            >
              {copy.primaryHeadlineLines.slice(0, 3).map((line) => (
                <span
                  key={line}
                  className="landing-v2-hero__headline-line"
                  data-hero-headline-line
                  data-hero-headline-split="words"
                >
                  {line}
                </span>
              ))}
              {renderMotionLine()}
            </h1>
          ) : (
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
          )}
          <p
            className="landing-v2-hero__subline mt-4 md:mt-5"
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
      </div>

      <div className="landing-v2-hero__fade" aria-hidden />
    </section>
  );
}

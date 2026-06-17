"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useBrandIntro } from "./BrandIntroContext";
import { useLandingViewport } from "./hooks/useLandingViewport";
import { useBrandIntroReveal } from "./hooks/useBrandIntroReveal";

const copy = LANDING_V2_COPY.brandIntro;

export function LandingV2BrandIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const signalsRef = useRef<HTMLDivElement>(null);
  const fragmentsRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const { markHeroReady } = useBrandIntro();
  const { isMobile, ready, reduceMotion } = useLandingViewport();

  useBrandIntroReveal(
    {
      section: sectionRef,
      logo: logoRef,
      mask: maskRef,
      signals: signalsRef,
      fragments: fragmentsRef,
      hint: hintRef,
      stage: stageRef,
    },
    {
      enabled: ready,
      isMobile,
      onRevealReady: markHeroReady,
    }
  );

  const modeClass = reduceMotion
    ? "landing-v2-brand-intro--reduced"
    : isMobile
      ? "landing-v2-brand-intro--mobile"
      : "landing-v2-brand-intro--desktop";

  return (
    <section
      ref={sectionRef}
      className={`landing-v2-brand-intro ${modeClass}`}
      aria-label="InfluexAI Markeneinstieg"
    >
      <div ref={stageRef} className="landing-v2-brand-intro__stage">
        <div className="landing-v2-brand-intro__grid" aria-hidden />
        <div className="landing-v2-brand-intro__noise" aria-hidden />
        <div className="landing-v2-brand-intro__vignette" aria-hidden />

        <div ref={maskRef} className="landing-v2-brand-intro__mask" aria-hidden>
          <div className="landing-v2-brand-intro__mask-glow" />
        </div>

        <div ref={signalsRef} className="landing-v2-brand-intro__signals" aria-hidden>
          <span data-brand-signal className="landing-v2-brand-intro__signal landing-v2-brand-intro__signal--a" />
          <span data-brand-signal className="landing-v2-brand-intro__signal landing-v2-brand-intro__signal--b" />
          <span data-brand-signal className="landing-v2-brand-intro__signal landing-v2-brand-intro__signal--c" />
        </div>

        <div ref={logoRef} className="landing-v2-brand-intro__logo-wrap">
          <p className="landing-v2-brand-intro__logo" aria-hidden="true">
            <span className="landing-v2-brand-intro__logo-mark">Influex</span>
            <span className="landing-v2-brand-intro__logo-ai">AI</span>
          </p>
          <span className="sr-only">InfluexAI</span>
        </div>

        <div ref={fragmentsRef} className="landing-v2-brand-intro__fragments" aria-hidden>
          <span data-brand-fragment className="landing-v2-brand-intro__fragment" />
          <span data-brand-fragment className="landing-v2-brand-intro__fragment landing-v2-brand-intro__fragment--offset" />
          <span data-brand-fragment className="landing-v2-brand-intro__fragment landing-v2-brand-intro__fragment--wide" />
        </div>

        {!isMobile && !reduceMotion ? (
          <div ref={hintRef} className="landing-v2-brand-intro__hint" aria-hidden>
            <span className="landing-v2-brand-intro__hint-dot" />
            <span className="landing-v2-brand-intro__hint-line" />
            <span className="sr-only">{copy.scrollHint}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

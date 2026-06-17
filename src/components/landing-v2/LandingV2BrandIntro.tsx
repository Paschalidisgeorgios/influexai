"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useBrandIntro } from "./BrandIntroContext";
import { useLandingViewport } from "./hooks/useLandingViewport";
import { useBrandIntroOverlay } from "./hooks/useBrandIntroOverlay";

export function LandingV2BrandIntro() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const signalsRef = useRef<HTMLDivElement>(null);
  const fragmentsRef = useRef<HTMLDivElement>(null);
  const [logoError, setLogoError] = useState(false);
  const { introDismissed, markHeroReady, dismissIntro, markChromeVisible } = useBrandIntro();
  const { isMobile, ready, reduceMotion } = useLandingViewport();

  useBrandIntroOverlay(
    {
      overlay: overlayRef,
      logo: logoRef,
      mask: maskRef,
      signals: signalsRef,
      fragments: fragmentsRef,
    },
    {
      enabled: ready && !introDismissed,
      isMobile,
      onHeroReady: markHeroReady,
      onDismiss: dismissIntro,
      onChromeVisible: markChromeVisible,
    }
  );

  if (introDismissed) return null;

  const modeClass = reduceMotion
    ? "landing-v2-brand-intro--reduced"
    : isMobile
      ? "landing-v2-brand-intro--mobile"
      : "landing-v2-brand-intro--desktop";

  return (
    <div
      ref={overlayRef}
      className={`landing-v2-brand-intro ${modeClass}`}
      aria-hidden={introDismissed}
      aria-label="InfluexAI Markeneinstieg"
    >
      <div className="landing-v2-brand-intro__stage">
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
          <div className="landing-v2-brand-intro__logo-halo" aria-hidden />
          {!logoError ? (
            <Image
              src={LANDING_V2_ASSETS.brandLogo}
              alt="InfluexAI"
              width={560}
              height={168}
              className="landing-v2-brand-intro__logo-img"
              priority
              onError={() => setLogoError(true)}
            />
          ) : (
            <p className="landing-v2-brand-intro__logo-fallback" aria-hidden="true">
              <span className="landing-v2-brand-intro__logo-fallback-mark">Influex</span>
              <span className="landing-v2-brand-intro__logo-fallback-ai">AI</span>
            </p>
          )}
        </div>

        <div ref={fragmentsRef} className="landing-v2-brand-intro__fragments" aria-hidden>
          <span data-brand-fragment className="landing-v2-brand-intro__fragment" />
          <span data-brand-fragment className="landing-v2-brand-intro__fragment landing-v2-brand-intro__fragment--offset" />
          <span data-brand-fragment className="landing-v2-brand-intro__fragment landing-v2-brand-intro__fragment--wide" />
        </div>
      </div>
    </div>
  );
}

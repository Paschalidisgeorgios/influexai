"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LandingV2AssetImage, LandingV2AssetVideo } from "../ui/LandingV2Asset";
import { useLandingReveal } from "../hooks/useLandingReveal";

export function LandingV2Proof() {
  const sectionRef = useRef<HTMLElement>(null);
  useLandingReveal(sectionRef);

  return (
    <section
      id="proof"
      ref={sectionRef}
      className="landing-v2-section"
      aria-labelledby="lv2-proof-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3" data-lv2-reveal>
          <span className="landing-v2-kicker__dot" aria-hidden />
          Outputs
        </p>
        <h2
          id="lv2-proof-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          Kampagnenfähige Assets — neutral gezeigt
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-reveal>
          Beispiel-Outputs aus dem Produktionsworkflow. Keine Testimonials, keine erfundenen
          Kennzahlen.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="landing-v2-ivory-stage p-4 md:p-5" data-lv2-reveal>
            <p className="mb-3 text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
              Beispiel — Visual
            </p>
            <LandingV2AssetImage slot={LANDING_V2_ASSETS.proofImage} />
          </article>

          <article className="landing-v2-ivory-stage p-4 md:p-5" data-lv2-reveal>
            <p className="mb-3 text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
              Beispiel — Motion
            </p>
            <LandingV2AssetVideo
              webm={LANDING_V2_ASSETS.outputVideo.webm}
              mp4={LANDING_V2_ASSETS.outputVideo.mp4}
              poster={LANDING_V2_ASSETS.outputVideo.poster}
              studioWebm={LANDING_V2_ASSETS.outputVideo.studioWebm}
              studioMp4={LANDING_V2_ASSETS.outputVideo.studioMp4}
              studioPoster={LANDING_V2_ASSETS.outputVideo.studioPoster}
              label="Motion Output"
            />
          </article>
        </div>
      </div>
    </section>
  );
}

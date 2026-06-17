"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LandingV2AssetImage, LandingV2AssetVideo } from "../ui/LandingV2Asset";
import { useLandingReveal } from "../hooks/useLandingReveal";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useProof3DScene } from "../hooks/useProof3DScene";

function ProofCard({
  label,
  children,
  proofKey,
  enable3D,
}: {
  label: string;
  children: React.ReactNode;
  proofKey: "visual" | "motion";
  enable3D: boolean;
}) {
  return (
    <article
      {...(proofKey === "visual"
        ? { "data-proof-visual": true }
        : { "data-proof-motion": true })}
      className={`landing-v2-proof-card landing-v2-ivory-stage p-4 md:p-5 ${
        enable3D ? "landing-v2-panel-3d" : ""
      }`}
      data-lv2-reveal
    >
      <p className="mb-3 text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
        {label}
      </p>
      {children}
    </article>
  );
}

export function LandingV2Proof() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const { enable3D } = useLandingViewport();

  useLandingReveal(sectionRef);
  useProof3DScene(sectionRef, sceneRef, enable3D);

  return (
    <section
      id="proof"
      ref={sectionRef}
      className="landing-v2-section overflow-hidden"
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
          Asset Preview — neutral gezeigt
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-reveal>
          Beispiel-Outputs aus dem Produktionsworkflow. Keine Testimonials, keine Kennzahlen.
        </p>

        <div
          ref={sceneRef}
          className={`landing-v2-proof-scene ${enable3D ? "landing-v2-scene-3d" : ""}`}
        >
          <div
            className={`landing-v2-proof-scene__rig ${
              enable3D ? "landing-v2-scene-3d__rig" : ""
            }`}
          >
            <ProofCard label="Campaign Visual" proofKey="visual" enable3D={enable3D}>
              <LandingV2AssetImage slot={LANDING_V2_ASSETS.proofImage} />
            </ProofCard>

            <ProofCard label="Motion Draft" proofKey="motion" enable3D={enable3D}>
              <LandingV2AssetVideo
                webm={LANDING_V2_ASSETS.outputVideo.webm}
                mp4={LANDING_V2_ASSETS.outputVideo.mp4}
                poster={LANDING_V2_ASSETS.outputVideo.poster}
                placeholderLabel={LANDING_V2_ASSETS.outputVideo.placeholderLabel}
                variant="motion-draft"
              />
            </ProofCard>
          </div>
        </div>
      </div>
    </section>
  );
}

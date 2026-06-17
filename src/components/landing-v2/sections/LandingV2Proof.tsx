"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2AssetImage, LandingV2AssetVideo } from "../ui/LandingV2Asset";
import { LandingV2Placeholder } from "../ui/LandingV2Placeholder";
import { useLandingReveal } from "../hooks/useLandingReveal";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useProof3DScene } from "../hooks/useProof3DScene";

const copy = LANDING_V2_COPY.outputs;

const PLACEHOLDER_VARIANT = {
  "campaign-visual": "campaign-visual",
  "motion-draft": "motion-draft",
  "hook-direction": "agent",
  "asset-library": "gallery",
} as const;

function OutputCard({
  card,
  enable3D,
  proofKey,
}: {
  card: (typeof copy.cards)[number];
  enable3D: boolean;
  proofKey?: "visual" | "motion";
}) {
  return (
    <article
      {...(proofKey === "visual"
        ? { "data-proof-visual": true }
        : proofKey === "motion"
          ? { "data-proof-motion": true }
          : {})}
      className={`landing-v2-proof-card landing-v2-ivory-stage flex h-full flex-col p-4 md:p-5 ${
        enable3D && proofKey ? "landing-v2-panel-3d" : ""
      }`}
      data-lv2-reveal
    >
      <p className="mb-2 text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
        {card.label}
      </p>
      <div className="mb-3 min-h-[10rem] flex-1">
        {card.kind === "image" ? (
          <LandingV2AssetImage slot={LANDING_V2_ASSETS.proofImage} />
        ) : card.kind === "video" ? (
          <LandingV2AssetVideo
            webm={LANDING_V2_ASSETS.outputVideo.webm}
            mp4={LANDING_V2_ASSETS.outputVideo.mp4}
            poster={LANDING_V2_ASSETS.outputVideo.poster}
            placeholderLabel={LANDING_V2_ASSETS.outputVideo.placeholderLabel}
            variant="motion-draft"
          />
        ) : (
          <LandingV2Placeholder
            variant={PLACEHOLDER_VARIANT[card.id as keyof typeof PLACEHOLDER_VARIANT] ?? "studio"}
            label={card.label}
            aspectClassName="aspect-[16/10] min-h-[10rem]"
          />
        )}
      </div>
      <p className="text-sm leading-relaxed text-[var(--lv2-text-muted)]">{card.description}</p>
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
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-proof-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          {copy.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-reveal>
          {copy.subline}
        </p>

        <div
          ref={sceneRef}
          className={`landing-v2-proof-scene landing-v2-proof-scene--quad ${
            enable3D ? "landing-v2-scene-3d" : ""
          }`}
        >
          <div
            className={`landing-v2-proof-scene__rig landing-v2-proof-scene__rig--quad ${
              enable3D ? "landing-v2-scene-3d__rig" : ""
            }`}
          >
            {copy.cards.map((card) => (
              <OutputCard
                key={card.id}
                card={card}
                enable3D={enable3D}
                proofKey={
                  card.id === "campaign-visual"
                    ? "visual"
                    : card.id === "motion-draft"
                      ? "motion"
                      : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

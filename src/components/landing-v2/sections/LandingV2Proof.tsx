"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2AssetImage, LandingV2AssetVideo } from "../ui/LandingV2Asset";
import { LandingV2Placeholder } from "../ui/LandingV2Placeholder";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useGalleryParallax } from "../hooks/useGalleryParallax";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";

const copy = LANDING_V2_COPY.outputs;

const PLACEHOLDER_VARIANT = {
  "campaign-visual": "campaign-visual",
  "motion-draft": "motion-draft",
  "hook-direction": "agent",
  "asset-library": "gallery",
} as const;

const GALLERY_SPAN = [
  "landing-v2-gallery__item--wide",
  "landing-v2-gallery__item--tall",
  "landing-v2-gallery__item--tall",
  "landing-v2-gallery__item--wide",
] as const;

function GalleryItem({
  card,
  spanClass,
}: {
  card: (typeof copy.cards)[number];
  spanClass: string;
}) {
  return (
    <figure className={`landing-v2-gallery__item ${spanClass}`} data-gallery-item>
      <div className="landing-v2-gallery__frame" data-gallery-visual>
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
            aspectClassName="aspect-[16/10] min-h-full h-full"
            className="landing-v2-placeholder--dark h-full min-h-[12rem]"
          />
        )}
      </div>
      <figcaption className="landing-v2-gallery__caption">
        <span className="landing-v2-gallery__label">{card.label}</span>
        <span className="landing-v2-gallery__desc">{card.description}</span>
      </figcaption>
    </figure>
  );
}

export function LandingV2Proof() {
  const sectionRef = useRef<HTMLElement>(null);
  const { enableCinematicScroll } = useLandingViewport();
  const { enablePreviewMotion } = useLandingV2Links();
  useSectionDramaturgy(sectionRef);
  useGalleryParallax(sectionRef, enableCinematicScroll && enablePreviewMotion);

  return (
    <section
      id="proof"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--editorial overflow-hidden"
      aria-labelledby="lv2-proof-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        <p className="landing-v2-kicker mb-4" data-lv2-eyebrow>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-proof-heading"
          className="landing-v2-headline landing-v2-editorial-title text-[var(--lv2-text-light)]"
        >
          {copy.headlineLines.map((line) => (
            <span key={line} className="block" data-lv2-headline-line>
              {line}
            </span>
          ))}
        </h2>
        <p className="landing-v2-editorial-lead mt-4 max-w-2xl text-white/55" data-lv2-subline>
          {copy.subline}
        </p>

        <div className="landing-v2-gallery mt-12 md:mt-16">
          {copy.cards.map((card, index) => (
            <GalleryItem
              key={card.id}
              card={card}
              spanClass={GALLERY_SPAN[index] ?? "landing-v2-gallery__item--wide"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

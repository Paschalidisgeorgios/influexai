"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";

const chapterCopy = LANDING_V2_COPY.chapters.pricing;
const copy = LANDING_V2_COPY.pricing;

export function LandingV2PricingTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const links = useLandingV2Links();
  const isPreview = links.mode === "preview";
  useSectionDramaturgy(sectionRef);

  if (isPreview) {
    return (
      <section
        id="pricing"
        ref={sectionRef}
        className="landing-v2-section landing-v2-section--terminal-pricing"
        aria-labelledby="lv2-pricing-heading"
      >
        <div className="landing-v2-terminal-pricing mx-auto w-full max-w-[90rem]">
          <div className="landing-v2-terminal-pricing__panel">
            <p className="landing-v2-terminal-story__number" data-lv2-eyebrow>
              {chapterCopy.number}
            </p>
            <h2
              id="lv2-pricing-heading"
              className="landing-v2-terminal-pricing__headline"
              data-lv2-headline-line
            >
              {copy.headline}
            </h2>
            <p className="landing-v2-terminal-story__body landing-v2-terminal-pricing__body" data-lv2-subline>
              {copy.subline}
            </p>
            <div className="landing-v2-terminal-pricing__row" aria-hidden>
              <span>Pläne</span>
              <span>Details</span>
              <span>Studio-Zugang</span>
            </div>
            <Link href={links.pricing} className="landing-v2-btn-secondary landing-v2-terminal-pricing__cta" data-lv2-stagger>
              {copy.cta}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--chapter landing-v2-section--pricing"
      aria-labelledby="lv2-pricing-heading"
    >
      <div className="landing-v2-chapter mx-auto max-w-3xl">
        <div className="landing-v2-pricing-chapter">
          <LandingV2ChapterMarker
            number={chapterCopy.number}
            label={chapterCopy.label}
            className="justify-center"
          />
          <h2
            id="lv2-pricing-heading"
            className="landing-v2-headline landing-v2-editorial-title mt-5 text-center text-[var(--lv2-text-light)]"
          >
            <span className="block" data-lv2-headline-line>
              {chapterCopy.headline}
            </span>
          </h2>
          <p className="landing-v2-editorial-lead mx-auto mt-4 max-w-lg text-center" data-lv2-subline>
            {chapterCopy.body}
          </p>
          <div className="mt-8 flex justify-center">
            <Link href={links.pricing} className="landing-v2-btn-primary">
              {chapterCopy.cta}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

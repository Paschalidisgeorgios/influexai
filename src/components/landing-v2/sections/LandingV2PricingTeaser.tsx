"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";

const chapterCopy = LANDING_V2_COPY.chapters.pricing;

export function LandingV2PricingTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const links = useLandingV2Links();
  useSectionDramaturgy(sectionRef);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--editorial landing-v2-section--pricing"
      aria-labelledby="lv2-pricing-heading"
    >
      <div className="mx-auto max-w-3xl">
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

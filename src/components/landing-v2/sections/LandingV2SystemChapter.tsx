"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const copy = LANDING_V2_COPY.chapters.system;

export function LandingV2SystemChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  useSectionDramaturgy(sectionRef);

  return (
    <section
      id="system"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--system landing-v2-section--editorial"
      aria-labelledby="lv2-system-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="landing-v2-system-chapter">
          <LandingV2ChapterMarker number={copy.number} label={copy.label} />
          <div className="landing-v2-system-chapter__body">
            <h2
              id="lv2-system-heading"
              className="landing-v2-headline landing-v2-editorial-title text-[var(--lv2-text-light)]"
            >
              <span className="block" data-lv2-headline-line>
                {copy.headline}
              </span>
            </h2>
            <p className="landing-v2-editorial-lead mt-5 max-w-2xl" data-lv2-subline>
              {copy.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

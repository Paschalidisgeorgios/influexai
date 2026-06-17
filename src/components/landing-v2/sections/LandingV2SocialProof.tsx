"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useSocialProofCounter } from "../hooks/useSocialProofCounter";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const copy = LANDING_V2_COPY.socialProof;

export function LandingV2SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  useSectionDramaturgy(sectionRef);
  useSocialProofCounter(sectionRef);

  return (
    <section
      id="proof"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--social-proof"
      aria-label="System-Fakten"
    >
      <div className="landing-v2-social-proof mx-auto w-full max-w-[90rem]">
        <ul className="landing-v2-social-proof__list">
          {copy.items.map((item) => (
            <li key={item.label} className="landing-v2-social-proof__item" data-lv2-stagger>
              <span
                className="landing-v2-social-proof__value"
                data-proof-value={item.value}
                aria-label={String(item.value)}
              >
                {item.value}
              </span>
              <p className="landing-v2-social-proof__label">{item.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

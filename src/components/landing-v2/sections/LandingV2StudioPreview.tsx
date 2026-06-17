"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LandingV2AssetImage } from "../ui/LandingV2Asset";
import { useLandingReveal } from "../hooks/useLandingReveal";

const STUDIO_COPY: Record<string, string> = {
  studio: "Überblick über laufende Produktionen und den nächsten Schritt im Studio.",
  tools: "Kompakter Tools Hub — aktive Produktionswerkzeuge ohne Tool-Wand.",
  agent: "Briefing strukturieren und den Produktionspfad vorbereiten.",
  gallery: "Outputs sammeln, vergleichen und für die nächste Kampagne nutzen.",
};

export function LandingV2StudioPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  useLandingReveal(sectionRef);

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="landing-v2-section"
      aria-labelledby="lv2-studio-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3" data-lv2-reveal>
          <span className="landing-v2-kicker__dot" aria-hidden />
          Studio
        </p>
        <h2
          id="lv2-studio-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          Eine Produktionswelt — vier Kernflächen
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-reveal>
          Cockpit, Tools, Agent und Galerie arbeiten zusammen — ohne Card-in-Card-Chaos.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {LANDING_V2_ASSETS.products.map((slot) => (
            <article
              key={slot.id}
              className="landing-v2-ivory-stage overflow-hidden p-4 md:p-5"
              data-lv2-reveal
            >
              <div className="landing-v2-product-tile">
                <LandingV2AssetImage slot={slot} />
              </div>
              <h3 className="landing-v2-headline mt-4 text-xl">{slot.label}</h3>
              <p className="mt-1 text-sm text-[var(--lv2-text-muted)]">
                {STUDIO_COPY[slot.id]}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

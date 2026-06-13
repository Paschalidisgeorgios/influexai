"use client";

import type { LandingGlowSection } from "@/lib/landing-section-glow";

type LandingSectionGlowBackgroundProps = {
  activeSection: LandingGlowSection | null;
};

const GLOW_LAYERS: {
  section: LandingGlowSection;
  className: string;
}[] = [
  {
    section: "create",
    className:
      "landing-section-glow-blob landing-section-glow-blob--create left-1/2 top-[38%] h-[min(72vw,680px)] w-[min(72vw,680px)] -translate-x-1/2",
  },
  {
    section: "visuals",
    className:
      "landing-section-glow-blob landing-section-glow-blob--visuals right-[8%] top-[42%] h-[min(68vw,620px)] w-[min(68vw,620px)]",
  },
  {
    section: "video",
    className:
      "landing-section-glow-blob landing-section-glow-blob--video left-1/2 top-[45%] h-[min(88vw,820px)] w-[min(88vw,820px)] -translate-x-1/2 blur-[140px]",
  },
  {
    section: "pricing",
    className:
      "landing-section-glow-blob landing-section-glow-blob--pricing left-1/2 top-[48%] h-[min(64vw,580px)] w-[min(80vw,720px)] -translate-x-1/2",
  },
];

export function LandingSectionGlowBackground({
  activeSection,
}: LandingSectionGlowBackgroundProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {GLOW_LAYERS.map(({ section, className }) => (
        <div
          key={section}
          className={`${className} transition-opacity duration-1000 ease-in-out ${
            activeSection === section ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="landing-section-glow-vignette absolute inset-0" />
    </div>
  );
}

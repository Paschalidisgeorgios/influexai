"use client";

import { LANDING_HERO_2026 } from "@/lib/landing-copy-2026";

export function HeroKineticHeadline() {
  return (
    <>
      <h1 className="mb-4 font-sans text-3xl font-extrabold leading-[1.12] tracking-tight text-white antialiased sm:text-4xl md:mb-5 md:text-5xl lg:text-6xl">
        {LANDING_HERO_2026.headline}
      </h1>
      <p
        className="mx-auto mb-6 max-w-xl text-base leading-relaxed text-white/80 md:mx-0 md:text-lg"
        style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
      >
        {LANDING_HERO_2026.subheadline}
      </p>
    </>
  );
}

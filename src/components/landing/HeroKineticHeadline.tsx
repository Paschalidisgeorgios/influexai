"use client";

import { LANDING_HERO_2026 } from "@/lib/landing-copy-2026";

export function HeroKineticHeadline() {
  return (
    <>
      <h1 className="mb-4 text-balance font-sans text-[clamp(1.65rem,5.5vw,3.75rem)] font-extrabold leading-[1.12] tracking-tight text-white antialiased [text-shadow:0_2px_24px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.9)] md:mb-5">
        {LANDING_HERO_2026.headline}
      </h1>
      <p
        className="mx-auto mb-6 max-w-xl text-balance text-base leading-relaxed text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] md:mx-0 md:text-lg"
        style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
      >
        {LANDING_HERO_2026.subheadline}
      </p>
    </>
  );
}

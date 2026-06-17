"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2AssetVideo } from "../ui/LandingV2Asset";
import { useLandingReveal } from "../hooks/useLandingReveal";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useHero3DStage } from "../hooks/useHero3DStage";

const copy = LANDING_V2_COPY.hero;

export function LandingV2Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backPlateRef = useRef<HTMLDivElement>(null);
  const { enable3D } = useLandingViewport();

  useLandingReveal(sectionRef);
  useHero3DStage({
    sectionRef,
    stageRef,
    panelRef,
    backPlateRef,
    enabled: enable3D,
  });

  return (
    <section
      ref={sectionRef}
      className="landing-v2-section relative overflow-hidden pt-28 md:pt-36"
      aria-labelledby="lv2-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-0 h-[min(70vw,520px)] w-[min(90vw,900px)] -translate-x-1/2 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse, rgba(180,255,0,0.06) 0%, transparent 68%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="landing-v2-kicker mb-5" data-lv2-reveal>
            <span className="landing-v2-kicker__dot" aria-hidden />
            {copy.eyebrow}
          </p>
          <h1
            id="lv2-hero-heading"
            className="landing-v2-headline text-[clamp(2.25rem,6vw,4.25rem)] text-[var(--lv2-text-light)]"
            data-lv2-reveal
          >
            {copy.headline}
          </h1>
          <p
            className="mt-5 max-w-xl text-[clamp(1rem,2.2vw,1.15rem)] leading-relaxed text-white/62"
            data-lv2-reveal
          >
            {copy.subline}
          </p>
          <ul
            className="mt-5 flex flex-wrap gap-2"
            data-lv2-reveal
            aria-label="Zielgruppen"
          >
            {copy.chips.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/55"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3" data-lv2-reveal>
            <Link href="/auth/sign-up" className="landing-v2-btn-primary">
              {copy.ctaPrimary}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href="/pricing" className="landing-v2-btn-secondary">
              {copy.ctaSecondary}
            </Link>
          </div>
        </div>

        <div
          ref={stageRef}
          className={`landing-v2-hero-stage ${enable3D ? "landing-v2-scene-3d" : ""}`}
          data-lv2-reveal
        >
          <div className="landing-v2-scene-3d__rig landing-v2-hero-stage__rig h-full min-h-[inherit]">
            {enable3D ? (
              <>
                <div
                  ref={backPlateRef}
                  className="landing-v2-hero-stage__back-plate landing-v2-panel-3d"
                  aria-hidden
                />
                <div
                  className="landing-v2-hero-stage__glow landing-v2-panel-3d"
                  aria-hidden
                />
              </>
            ) : null}
            <div
              ref={panelRef}
              className={`landing-v2-hero-stage__panel landing-v2-ivory-stage overflow-hidden ${
                enable3D ? "landing-v2-panel-3d" : ""
              }`}
            >
              <LandingV2AssetVideo
                webm={LANDING_V2_ASSETS.hero.webm}
                mp4={LANDING_V2_ASSETS.hero.mp4}
                poster={LANDING_V2_ASSETS.hero.poster}
                placeholderLabel={LANDING_V2_ASSETS.hero.placeholderLabel}
                variant="hero"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

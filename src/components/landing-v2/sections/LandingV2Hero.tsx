"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LandingV2AssetVideo } from "../ui/LandingV2Asset";
import { useLandingReveal } from "../hooks/useLandingReveal";

export function LandingV2Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  useLandingReveal(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="landing-v2-section relative pt-28 md:pt-36"
      aria-labelledby="lv2-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-0 h-[min(70vw,520px)] w-[min(90vw,900px)] -translate-x-1/2 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse, rgba(180,255,0,0.08) 0%, transparent 68%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="landing-v2-kicker mb-5" data-lv2-reveal>
            <span className="landing-v2-kicker__dot" aria-hidden />
            Creator Production System
          </p>
          <h1
            id="lv2-hero-heading"
            className="landing-v2-headline text-[clamp(2.25rem,6vw,4.25rem)] text-[var(--lv2-text-light)]"
            data-lv2-reveal
          >
            Das Creator Production System für Kampagnen, Visuals und Motion.
          </h1>
          <p
            className="mt-5 max-w-xl text-[clamp(1rem,2.2vw,1.15rem)] leading-relaxed text-white/62"
            data-lv2-reveal
          >
            Plane Hooks, erstelle Bilder und verwandle Ideen in kampagnenfähige Assets — in
            einem Studio statt in zehn einzelnen Tools.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3" data-lv2-reveal>
            <Link href="/auth/sign-up" className="landing-v2-btn-primary">
              Studio starten
              <ArrowRight size={18} aria-hidden />
            </Link>
            <a href="#pricing" className="landing-v2-btn-secondary">
              Preise ansehen
            </a>
          </div>
        </div>

        <div className="landing-v2-ivory-stage overflow-hidden p-2 md:p-3" data-lv2-reveal>
          <LandingV2AssetVideo
            webm={LANDING_V2_ASSETS.hero.webm}
            mp4={LANDING_V2_ASSETS.hero.mp4}
            poster={LANDING_V2_ASSETS.hero.poster}
            studioWebm={LANDING_V2_ASSETS.hero.studioWebm}
            studioMp4={LANDING_V2_ASSETS.hero.studioMp4}
            studioPoster={LANDING_V2_ASSETS.hero.studioPoster}
            label="Studio Preview"
          />
        </div>
      </div>
    </section>
  );
}

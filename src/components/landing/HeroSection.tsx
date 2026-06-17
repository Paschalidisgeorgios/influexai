"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const HEADLINE_LINES = [
  ["Create", "campaign-ready"],
  ["assets", "from", "one", "idea."],
] as const;

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const words = gsap.utils.toArray<HTMLElement>("[data-hero-word]");
      const subline = sectionRef.current?.querySelector("[data-hero-subline]");
      const ctas = sectionRef.current?.querySelectorAll("[data-hero-cta]");
      const scrollHint = sectionRef.current?.querySelector("[data-hero-scroll]");

      gsap.set(words, { opacity: 0, y: 60 });
      if (subline) gsap.set(subline, { opacity: 0 });
      if (ctas?.length) gsap.set(ctas, { opacity: 0, scale: 0.8 });
      if (scrollHint) gsap.set(scrollHint, { opacity: 0, y: 8 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.to(words, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.07,
        onComplete: () => {
          gsap.set(words, { clearProps: "transform" });
        },
      });

      if (subline) {
        tl.to(subline, { opacity: 1, duration: 0.7 }, "-=0.25");
      }

      if (ctas?.length) {
        tl.to(
          ctas,
          {
            opacity: 1,
            scale: 1,
            duration: 0.55,
            stagger: 0.08,
            ease: "power3.out",
            onComplete: () => {
              gsap.set(ctas, { clearProps: "transform" });
            },
          },
          "-=0.35"
        );
      }

      if (scrollHint) {
        tl.to(scrollHint, { opacity: 1, y: 0, duration: 0.5 }, "-=0.15");
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center bg-[#09090b] px-5 pt-24 pb-20 text-center"
      aria-labelledby="terminal-hero-heading"
    >
      <p className="mb-8 font-mono text-[11px] tracking-[0.2em] text-white/25 uppercase">
        INFLUEXAI — AI CREATOR PRODUCTION OS
      </p>

      <h1
        id="terminal-hero-heading"
        className="max-w-[14ch] text-[clamp(40px,10vw,64px)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white md:max-w-none md:text-[clamp(52px,7vw,108px)]"
      >
        {HEADLINE_LINES.map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            {line.map((word) => (
              <span key={word} className="mr-[0.28em] inline-block" data-hero-word>
                {word}
              </span>
            ))}
          </span>
        ))}
      </h1>

      <p
        data-hero-subline
        className="mx-auto mt-6 max-w-[520px] text-lg font-light leading-[1.7] text-white/45"
      >
        Images, videos, hooks and full campaigns — generated inside one cinematic
        workspace.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/auth/sign-up"
          data-hero-cta
          className="inline-flex items-center rounded-[10px] bg-[#b4ff00] px-8 py-4 text-[15px] font-semibold text-[#09090b] transition-opacity hover:opacity-90"
        >
          Kostenlos starten →
        </Link>
        <Link
          href="/demo"
          data-hero-cta
          className="inline-flex items-center rounded-[10px] border border-white/15 px-8 py-4 text-[15px] font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white/80"
        >
          Demo ansehen
        </Link>
      </div>

      <div
        data-hero-scroll
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase">
          Scroll
        </span>
        <span className="terminal-scroll-arrow block h-3 w-3 rotate-45 border-r border-b border-white/35" />
      </div>
    </section>
  );
}

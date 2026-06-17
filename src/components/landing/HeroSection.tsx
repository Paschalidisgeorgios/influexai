"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const HEADLINE_WORDS =
  "Create campaign-ready assets from one idea.".split(" ");

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const label = sectionRef.current?.querySelector("[data-hero-label]");
      const words = gsap.utils.toArray<HTMLElement>("[data-hero-word]");
      const subline = sectionRef.current?.querySelector("[data-hero-subline]");
      const ctas = sectionRef.current?.querySelectorAll("[data-hero-cta]");
      const scrollHint = sectionRef.current?.querySelector("[data-hero-scroll]");

      if (label) gsap.set(label, { opacity: 0, y: 20 });
      gsap.set(words, { opacity: 0, y: 60 });
      if (subline) gsap.set(subline, { opacity: 0 });
      if (ctas?.length) gsap.set(ctas, { opacity: 0, y: 16 });
      if (scrollHint) gsap.set(scrollHint, { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      if (label) {
        tl.to(label, { opacity: 1, y: 0, duration: 0.7 }, 0.2);
      }

      tl.to(
        words,
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.07,
        },
        0.5
      );

      if (subline) {
        tl.to(subline, { opacity: 1, duration: 0.8 }, 1.2);
      }

      if (ctas?.length) {
        tl.to(
          ctas,
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
          1.6
        );
      }

      if (scrollHint) {
        tl.to(scrollHint, { opacity: 1, duration: 0.5 }, 1.9);
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] flex min-h-screen flex-col items-center justify-center px-6 text-center md:px-12"
      aria-labelledby="hero-heading"
    >
      <p
        data-hero-label
        className="mb-8 font-mono text-[11px] tracking-[0.2em] text-white/25 uppercase"
      >
        INFLUEXAI — AI CREATOR PRODUCTION OS
      </p>

      <h1
        id="hero-heading"
        className="max-w-[900px] text-[clamp(40px,10vw,64px)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white md:text-[clamp(52px,7vw,108px)]"
      >
        {HEADLINE_WORDS.map((word, index) => (
          <span key={`${word}-${index}`} className="mr-[0.28em] inline-block overflow-hidden align-top">
            <span data-hero-word className="inline-block">
              {word}
            </span>
          </span>
        ))}
      </h1>

      <p
        data-hero-subline
        className="mx-auto mt-7 max-w-[520px] text-[clamp(15px,1.5vw,18px)] font-light leading-[1.75] text-white/45"
      >
        Images, videos, hooks and full campaigns — generated inside one cinematic
        workspace.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/auth/sign-up"
          data-hero-cta
          className="inline-flex items-center rounded-lg bg-[#b4ff00] px-8 py-[15px] text-[15px] font-bold text-[#09090b] transition-transform hover:-translate-y-0.5"
        >
          Kostenlos starten →
        </Link>
        <Link
          href="/demo"
          data-hero-cta
          className="inline-flex items-center rounded-lg border border-white/15 px-8 py-[15px] text-[15px] text-white/60 transition-colors hover:border-white/30 hover:text-white/80"
        >
          Demo ansehen
        </Link>
      </div>

      <div
        data-hero-scroll
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase">
          Scroll
        </span>
        <span className="terminal-scroll-arrow block h-3 w-3 rotate-45 border-r border-b border-white/30" />
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function TerminalCtaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const headline = sectionRef.current?.querySelector("[data-cta-headline]");
      const subline = sectionRef.current?.querySelector("[data-cta-subline]");
      const button = sectionRef.current?.querySelector("[data-cta-button]");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      if (headline) {
        tl.fromTo(headline, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.85 });
      }
      if (subline) {
        tl.fromTo(subline, { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.35");
      }
      if (button) {
        tl.fromTo(
          button,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.55,
            onComplete: () => {
              gsap.set(button, { clearProps: "transform" });
            },
          },
          "-=0.25"
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex min-h-[88svh] items-center justify-center overflow-hidden bg-[#09090b] px-5 py-24"
      aria-labelledby="terminal-final-cta"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(180,255,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2
          id="terminal-final-cta"
          data-cta-headline
          className="text-[clamp(64px,9vw,140px)] font-extrabold leading-[0.95] tracking-[-0.05em] text-white"
        >
          Start creating.
        </h2>
        <p data-cta-subline className="mt-5 text-lg font-light text-white/30">
          Join 10,000+ creators.
        </p>
        <Link
          href="/auth/sign-up"
          data-cta-button
          className="mt-10 inline-flex rounded-[10px] bg-[#b4ff00] px-10 py-[18px] text-base font-bold text-[#09090b] transition-opacity hover:opacity-90"
        >
          Kostenlos starten →
        </Link>
      </div>
    </section>
  );
}

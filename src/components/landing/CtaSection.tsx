"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const headline = sectionRef.current?.querySelector("[data-cta-headline]");
      if (!headline) return;

      gsap.fromTo(
        headline,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-24 text-center"
      aria-labelledby="final-cta"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(180,255,0,0.05) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10">
        <h2
          id="final-cta"
          data-cta-headline
          className="text-[clamp(48px,12vw,80px)] font-extrabold leading-none tracking-[-0.05em] text-white md:text-[clamp(64px,9vw,140px)]"
        >
          Start creating.
        </h2>
        <p className="mt-4 text-base text-white/30">Join 10,000+ creators.</p>
        <Link
          href="/auth/sign-up"
          className="mt-10 inline-flex rounded-lg bg-[#b4ff00] px-11 py-[18px] text-base font-bold text-[#09090b] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(180,255,0,0.25)]"
        >
          Kostenlos starten →
        </Link>
      </div>
    </section>
  );
}

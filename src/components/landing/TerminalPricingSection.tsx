"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PLANS = [
  { name: "STARTER", price: "9,99€/Mon", credits: "50 Credits", href: "/auth/sign-up" },
  { name: "CREATOR", price: "49€/Mon", credits: "300 Credits", href: "/auth/sign-up" },
  { name: "PRO", price: "99€/Mon", credits: "800 Credits", href: "/auth/sign-up" },
] as const;

export function TerminalPricingSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-pricing-row]");
      gsap.set(rows, { opacity: 0, y: 36 });

      ScrollTrigger.batch(rows, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            onComplete: () => {
              gsap.set(batch, { clearProps: "transform" });
            },
          });
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative z-10 bg-[#09090b] px-5 py-20 md:px-10 md:py-28"
      aria-labelledby="terminal-pricing-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="terminal-pricing-heading"
          className="mb-12 text-[clamp(40px,5vw,72px)] font-extrabold tracking-[-0.04em] text-white"
        >
          Simple pricing.
        </h2>

        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                data-pricing-row
                className="grid grid-cols-[1.2fr_1fr_1fr_auto] items-center gap-4 border-b border-white/[0.06] py-5 text-sm md:text-base"
              >
                <span className="font-semibold tracking-wide text-white">{plan.name}</span>
                <span className="text-white/55">{plan.price}</span>
                <span className="text-white/55">{plan.credits}</span>
                <Link
                  href={plan.href}
                  className="text-right font-medium text-[#b4ff00] hover:opacity-80"
                >
                  Starten →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

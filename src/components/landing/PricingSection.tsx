"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PLANS = [
  {
    name: "Starter",
    credits: "50 Credits / Monat",
    price: "9,99€",
    accent: false,
    href: "/auth/sign-up",
  },
  {
    name: "Creator",
    credits: "300 Credits / Monat",
    price: "49€",
    accent: false,
    bold: true,
    href: "/auth/sign-up",
  },
  {
    name: "Pro",
    credits: "800 Credits / Monat",
    price: "99€",
    accent: true,
    href: "/auth/sign-up",
  },
] as const;

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-pricing-row]");
      gsap.set(rows, { opacity: 0, y: 32 });

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
      className="relative z-[1] px-6 py-[120px] md:px-20"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-[1000px]">
        <h2
          id="pricing-heading"
          className="mb-[60px] text-[clamp(40px,5vw,72px)] font-extrabold tracking-[-0.04em] text-white"
        >
          Simple pricing.
        </h2>

        <div className="overflow-x-auto">
          <div className="min-w-[640px] border-t border-white/[0.06]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-white/[0.06] py-4 font-mono text-[11px] tracking-[0.15em] text-white/25 uppercase">
              <span>Plan</span>
              <span>Credits</span>
              <span>Preis</span>
              <span>Start</span>
            </div>

            {PLANS.map((plan) => (
              <div
                key={plan.name}
                data-pricing-row
                className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-b border-white/[0.06] py-7 text-sm"
              >
                <span
                  className={`${
                    plan.accent
                      ? "font-medium text-[#b4ff00]"
                      : "bold" in plan && plan.bold
                        ? "font-medium text-white"
                        : "text-white/70"
                  }`}
                >
                  {plan.name}
                </span>
                <span className="text-white/45">{plan.credits}</span>
                <span className="text-white/70">{plan.price}</span>
                <Link
                  href={plan.href}
                  className="text-white/60 transition-colors hover:text-[#b4ff00]"
                >
                  → Starten
                </Link>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-white/30">
          Credits verfallen nicht · Keine versteckten Kosten · Jederzeit kündbar
        </p>
      </div>
    </section>
  );
}

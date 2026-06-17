"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  {
    value: 10000,
    suffix: "+",
    label: "Creator weltweit",
    accent: false,
    format: "de" as const,
  },
  {
    value: 60,
    suffix: "",
    unit: "Sek.",
    label: "bis zur ersten Preview",
    accent: false,
    format: "plain" as const,
  },
  {
    value: 98,
    suffix: "",
    label: "Lighthouse Score",
    accent: true,
    format: "plain" as const,
  },
] as const;

function formatNumber(value: number, format: "de" | "plain") {
  if (format === "de") {
    return new Intl.NumberFormat("de-DE").format(Math.round(value));
  }
  return String(Math.round(value));
}

export default function NumbersSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const values = gsap.utils.toArray<HTMLElement>("[data-stat-value]");

      values.forEach((el) => {
        const target = Number(el.dataset.statTarget ?? "0");
        const format = el.dataset.statFormat === "de" ? "de" : "plain";
        const suffix = el.dataset.statSuffix ?? "";
        const unit = el.dataset.statUnit ?? "";
        const state = { value: 0 };

        gsap.to(state, {
          value: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            once: true,
          },
          onUpdate: () => {
            const formatted = formatNumber(state.value, format);
            el.textContent = unit
              ? `${formatted} ${unit}`
              : `${formatted}${suffix}`;
          },
          onComplete: () => {
            const formatted = formatNumber(target, format);
            el.textContent = unit
              ? `${formatted} ${unit}`
              : `${formatted}${suffix}`;
          },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] border-y border-white/[0.06] px-6 py-20 md:px-12"
      aria-label="Key metrics"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 divide-y divide-white/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
        {STATS.map((stat) => (
          <article
            key={stat.label}
            className="px-0 py-10 text-center md:px-8 md:py-0 md:text-left"
          >
            <p
              data-stat-value
              data-stat-target={stat.value}
              data-stat-format={stat.format}
              data-stat-suffix={stat.suffix ?? ""}
              data-stat-unit={"unit" in stat ? stat.unit : ""}
              className={`text-[clamp(48px,6vw,88px)] font-extrabold leading-none tracking-[-0.03em] tabular-nums ${
                stat.accent ? "text-[#b4ff00]" : "text-white"
              }`}
            >
              0
            </p>
            <p className="mt-2 text-[13px] text-white/35">{stat.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

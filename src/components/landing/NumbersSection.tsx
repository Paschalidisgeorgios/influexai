"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: 10000, suffix: "+", label: "Nutzer weltweit", format: "de" as const },
  { value: 60, suffix: "", label: "Sekunden bis Preview", format: "plain" as const },
  { value: 98, suffix: "", label: "Lighthouse Score", format: "plain" as const },
] as const;

function formatNumber(value: number, format: "de" | "plain") {
  if (format === "de") {
    return new Intl.NumberFormat("de-DE").format(Math.round(value));
  }
  return String(Math.round(value));
}

export function NumbersSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-stat-item]");
      const values = gsap.utils.toArray<HTMLElement>("[data-stat-value]");

      gsap.set(items, { opacity: 0, y: 40 });

      ScrollTrigger.batch(items, {
        start: "top 82%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: "power3.out",
            onComplete: () => {
              gsap.set(batch, { clearProps: "transform" });
            },
          });
        },
      });

      values.forEach((el) => {
        const target = Number(el.dataset.statTarget ?? "0");
        const format = el.dataset.statFormat === "de" ? "de" : "plain";
        const suffix = el.dataset.statSuffix ?? "";
        const state = { value: 0 };

        gsap.to(state, {
          value: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
          onUpdate: () => {
            el.textContent = `${formatNumber(state.value, format)}${suffix}`;
          },
          onComplete: () => {
            el.textContent = `${formatNumber(target, format)}${suffix}`;
          },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-10 border-t border-white/[0.06] bg-[#09090b] px-5 py-20 md:px-10 md:py-28"
      aria-label="Key metrics"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
        {STATS.map((stat) => (
          <article key={stat.label} data-stat-item className="text-center md:text-left">
            <p
              data-stat-value
              data-stat-target={stat.value}
              data-stat-format={stat.format}
              data-stat-suffix={stat.suffix}
              className="text-[clamp(48px,6vw,88px)] font-extrabold leading-none tracking-[-0.03em] text-white tabular-nums"
            >
              {stat.format === "de" ? "0" : "0"}
              {stat.suffix}
            </p>
            <p className="mt-3 text-base font-light text-white/35">{stat.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

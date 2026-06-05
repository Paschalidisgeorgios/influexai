"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export function WorldTransition() {
  const t = useTranslations("landingPage.worldTransition");
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="world-transition"
      aria-label={t("tagline")}
      className={`world-transition${visible ? " is-visible" : ""}`}
    >
      <div className="world-transition__glow" aria-hidden />
      <div className="world-transition__band" aria-hidden />

      <div className="world-transition__inner">
        <div className="world-transition__labels">
          <span className="world-transition__label world-transition__label--creator">
            {t("creator")}
          </span>
          <div className="world-transition__beam-wrap" aria-hidden>
            <div className="world-transition__beam" />
          </div>
          <span className="world-transition__label world-transition__label--brand">
            {t("brand")}
          </span>
        </div>

        <p className="world-transition__tagline">{t("tagline")}</p>
      </div>
    </section>
  );
}

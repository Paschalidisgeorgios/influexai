"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { LANDING_SHOWCASE_ITEMS } from "@/lib/landing-showcase-items";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { ShowcaseCard } from "./ShowcaseCard";

export function LandingShowcaseSection() {
  const t = useTranslations("landingPage.campaignStudio.showcase");
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  const scrollBy = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".showcase-card");
    const step = card ? card.offsetWidth + 20 : 320;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section
      id="showcase"
      className="campaign-light-section overflow-visible px-4 py-16 md:px-6 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-[1240px]">
        <SpringReveal>
          <span className="campaign-kicker">{t("kicker")}</span>
          <h2 className="campaign-heading mt-2 max-w-[720px]">{t("headline")}</h2>
        </SpringReveal>

        <div className="showcase-grid mt-10 lg:hidden">
          {LANDING_SHOWCASE_ITEMS.map((item, i) => (
            <SpringReveal key={item.id} delay={i * 0.05}>
              <ShowcaseCard item={item} />
            </SpringReveal>
          ))}
        </div>

        <div className="showcase-carousel mt-10 hidden lg:block">
          <div className="showcase-carousel__controls">
            <button
              type="button"
              className="showcase-carousel__btn"
              aria-label={t("scrollPrev")}
              disabled={!canScrollLeft}
              onClick={() => scrollBy("left")}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="showcase-carousel__btn"
              aria-label={t("scrollNext")}
              disabled={!canScrollRight}
              onClick={() => scrollBy("right")}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          <div
            ref={trackRef}
            className="showcase-carousel__track"
            onScroll={updateScrollState}
          >
            <div className="showcase-carousel__row">
              {LANDING_SHOWCASE_ITEMS.map((item, i) => (
                <SpringReveal
                  key={item.id}
                  delay={i * 0.04}
                  className="showcase-carousel__item"
                >
                  <ShowcaseCard item={item} />
                </SpringReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

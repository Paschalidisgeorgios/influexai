"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useLandingNavState } from "../hooks/useLandingNavState";

const copy = LANDING_V2_COPY.nav;

const NAV_SECTIONS = [
  { id: "system", label: copy.system, href: "#system" },
  { id: "story", label: copy.workflow, href: "#story" },
  { id: "studio", label: copy.studio, href: "#studio" },
  { id: "pricing", label: copy.pricing, href: null },
] as const;

export function LandingV2Nav() {
  const links = useLandingV2Links();
  const sectionIds = NAV_SECTIONS.map((item) => item.id);
  const { scrolled, progress, activeId } = useLandingNavState(sectionIds);

  return (
    <header
      className={`landing-v2-nav ${scrolled ? "landing-v2-nav--scrolled" : ""}`.trim()}
    >
      <div className="landing-v2-nav__shell">
        <div className="landing-v2-nav__inner">
          <Link
            href={links.home}
            className="landing-v2-nav__brand"
          >
            InfluexAI
          </Link>

          <nav className="landing-v2-nav__links" aria-label="Seitenabschnitte">
            {NAV_SECTIONS.map((item) => {
              const isActive = activeId === item.id;
              const className = `landing-v2-nav__link ${
                isActive ? "landing-v2-nav__link--active" : ""
              }`.trim();

              if (item.href) {
                return (
                  <a key={item.id} href={item.href} className={className}>
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={links.pricing}
                  className={className}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link href={links.signup} className="landing-v2-nav__cta">
            {copy.cta}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>

        <div
          className="landing-v2-nav__progress"
          aria-hidden
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </header>
  );
}

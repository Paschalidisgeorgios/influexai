"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useLandingNavState } from "../hooks/useLandingNavState";
import { LandingV2Logo } from "../ui/LandingV2Logo";

type LandingV2NavProps = {
  introClass?: string;
  isPreview?: boolean;
};

const copy = LANDING_V2_COPY.nav;

const LIVE_NAV_SECTIONS = [
  { id: "system", label: copy.system, href: "#system" },
  { id: "story", label: copy.workflow, href: "#story" },
  { id: "studio", label: copy.studio, href: "#studio" },
  { id: "pricing", label: copy.pricing, href: null },
] as const;

const PREVIEW_NAV_SECTIONS = [
  { id: "story", label: copy.story, href: "#story" },
  { id: "proof", label: copy.proof, href: "#proof" },
  { id: "pricing", label: copy.pricing, href: null },
] as const;

export function LandingV2Nav({ introClass = "", isPreview = false }: LandingV2NavProps) {
  const links = useLandingV2Links();
  const navSections = isPreview ? PREVIEW_NAV_SECTIONS : LIVE_NAV_SECTIONS;
  const sectionIds = navSections.map((item) => item.id);
  const { scrolled, progress, activeId } = useLandingNavState(sectionIds);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const previewClass = isPreview ? "landing-v2-nav--preview" : "";
  const headerClass = [
    "landing-v2-nav",
    previewClass,
    introClass,
    scrolled ? "landing-v2-nav--scrolled" : "landing-v2-nav--top",
  ]
    .filter(Boolean)
    .join(" ");

  const header = (
    <header
      className={headerClass}
      data-scrolled={scrolled ? "true" : "false"}
      style={
        isPreview
          ? ({ "--toolbar-progress": progress } as CSSProperties)
          : undefined
      }
    >
      <div className="landing-v2-nav__shell">
        <div className="landing-v2-nav__inner">
          <LandingV2Logo href={links.home} size="nav" />

          <nav className="landing-v2-nav__links" aria-label="Seitenabschnitte">
            {navSections.map((item) => {
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
            <ArrowRight className="landing-v2-nav__cta-icon" size={15} aria-hidden />
          </Link>

          {isPreview ? (
            <svg
              className="landing-v2-nav__progress-ring"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <rect
                className="landing-v2-nav__progress-ring-path"
                x="1.25"
                y="1.25"
                width="97.5"
                height="97.5"
                rx="48"
                ry="48"
                pathLength={1}
                transform="rotate(-90 50 50)"
              />
            </svg>
          ) : null}
        </div>

        {!isPreview ? (
          <div
            className="landing-v2-nav__progress"
            aria-hidden
            style={{ transform: `scaleX(${progress})` }}
          />
        ) : null}
      </div>
    </header>
  );

  if (!mounted) {
    return header;
  }

  return createPortal(header, document.body);
}

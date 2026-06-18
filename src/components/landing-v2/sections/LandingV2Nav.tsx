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

const NAV_SECTIONS = [
  { id: "system", label: copy.system, href: "#system" },
  { id: "story", label: copy.workflow, href: "#story" },
  { id: "studio", label: copy.studio, href: "#studio" },
  { id: "pricing", label: copy.pricing, href: null },
] as const;

export function LandingV2Nav({ introClass = "", isPreview = false }: LandingV2NavProps) {
  const links = useLandingV2Links();
  const sectionIds = NAV_SECTIONS.map((item) => item.id);
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

  const innerStyle: CSSProperties | undefined = isPreview
    ? ({ "--toolbar-scroll-progress": progress } as CSSProperties)
    : undefined;

  const header = (
    <header
      className={headerClass}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div className="landing-v2-nav__shell">
        <div className="landing-v2-nav__inner" style={innerStyle}>
          <LandingV2Logo href={links.home} size="nav" />

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
                <Link key={item.id} href={links.pricing} className={className}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {!isPreview ? (
            <Link href="/auth/sign-in" className="landing-v2-nav__signin">
              {copy.signIn}
            </Link>
          ) : null}

          <Link href={links.signup} className="landing-v2-nav__cta">
            {copy.cta}
            <ArrowRight className="landing-v2-nav__cta-icon" size={15} aria-hidden />
          </Link>

          {isPreview ? (
            <div className="landing-v2-nav__signal" aria-hidden>
              <div className="landing-v2-nav__signal-base" />
              <div className="landing-v2-nav__signal-accent" />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );

  if (!mounted) {
    return header;
  }

  return createPortal(header, document.body);
}

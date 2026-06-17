"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const { scrolled, activeId } = useLandingNavState(sectionIds);
  const [mounted, setMounted] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLElement | null>>({});
  const [signalMobile, setSignalMobile] = useState(false);
  const [signalStyle, setSignalStyle] = useState({ left: 0, width: 0 });

  const updateSignalLine = useCallback(() => {
    const inner = innerRef.current;
    if (!inner || !isPreview) return;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    setSignalMobile(mobile);

    if (mobile) return;

    const resolvedId = activeId ?? NAV_SECTIONS[0]?.id;
    const activeEl = resolvedId ? linkRefs.current[resolvedId] : null;
    const innerWidth = inner.offsetWidth;

    if (!activeEl) {
      setSignalStyle({
        left: innerWidth * 0.1,
        width: innerWidth * (scrolled ? 0.28 : 0.22),
      });
      return;
    }

    const innerRect = inner.getBoundingClientRect();
    const linkRect = activeEl.getBoundingClientRect();
    const left = linkRect.left - innerRect.left;
    const width = Math.max(linkRect.width, innerWidth * 0.08);

    setSignalStyle({ left, width });
  }, [activeId, isPreview, scrolled]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isPreview) return;

    updateSignalLine();

    const onResize = () => updateSignalLine();
    window.addEventListener("resize", onResize);

    const inner = innerRef.current;
    const observer =
      inner && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateSignalLine())
        : null;
    observer?.observe(inner!);

    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [mounted, isPreview, updateSignalLine, scrolled, activeId]);

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
    >
      <div className="landing-v2-nav__shell">
        <div className="landing-v2-nav__inner" ref={innerRef}>
          <LandingV2Logo href={links.home} size="nav" />

          <nav className="landing-v2-nav__links" aria-label="Seitenabschnitte">
            {NAV_SECTIONS.map((item) => {
              const isActive = activeId === item.id;
              const className = `landing-v2-nav__link ${
                isActive ? "landing-v2-nav__link--active" : ""
              }`.trim();

              const setLinkRef = (el: HTMLAnchorElement | null) => {
                linkRefs.current[item.id] = el;
              };

              if (item.href) {
                return (
                  <a
                    key={item.id}
                    ref={setLinkRef}
                    href={item.href}
                    className={className}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.id}
                  ref={setLinkRef}
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
            <div className="landing-v2-nav__signal" aria-hidden>
              <div className="landing-v2-nav__signal-base" />
              <div
                className={`landing-v2-nav__signal-accent${
                  signalMobile ? " landing-v2-nav__signal-accent--mobile" : ""
                }`.trim()}
                style={
                  signalMobile
                    ? undefined
                    : {
                        left: `${signalStyle.left}px`,
                        width: `${signalStyle.width}px`,
                      }
                }
              />
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

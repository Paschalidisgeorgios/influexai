"use client";

import Link from "next/link";
import { useLandingV2Links } from "../LandingV2ModeContext";

export function LandingV2Footer() {
  const links = useLandingV2Links();

  return (
    <footer className="landing-v2-footer border-t border-white/[0.06] px-6 py-10 text-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <p>
          © {new Date().getFullYear()} InfluexAI
          {links.landingFooterTagline ? ` — ${links.landingFooterTagline}` : null}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          {links.landingFooterExtraLinks.map((item) => (
            <Link key={item.href} href={item.href} className="landing-v2-footer__link">
              {item.label}
            </Link>
          ))}
          <Link href={links.pricing} className="landing-v2-footer__link">
            Preise
          </Link>
          <Link href="/impressum" className="landing-v2-footer__link">
            Impressum
          </Link>
          <Link href="/datenschutz" className="landing-v2-footer__link">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useLandingV2Links } from "../LandingV2ModeContext";

export function LandingV2Footer() {
  const links = useLandingV2Links();

  return (
    <footer className="border-t border-white/[0.06] px-6 py-10 text-sm text-white/45">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <p>
          © {new Date().getFullYear()} InfluexAI
          {links.landingFooterTagline ? ` — ${links.landingFooterTagline}` : null}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          {links.landingFooterExtraLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white/70">
              {item.label}
            </Link>
          ))}
          <Link href={links.pricing} className="hover:text-white/70">
            Preise
          </Link>
          <Link href="/impressum" className="hover:text-white/70">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-white/70">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}

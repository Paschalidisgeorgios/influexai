"use client";

import Link from "next/link";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { LandingV2Logo } from "../ui/LandingV2Logo";

export function LandingV2Footer() {
  const links = useLandingV2Links();

  return (
    <footer className="landing-v2-footer border-t border-white/[0.06] px-6 py-10 text-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row md:items-center">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <LandingV2Logo href={links.home} size="footer" />
          <p className="text-center md:text-left">
            © {new Date().getFullYear()}
            {links.landingFooterTagline ? ` — ${links.landingFooterTagline}` : null}
          </p>
        </div>
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
          <Link href="/agb" className="landing-v2-footer__link">
            AGB
          </Link>
          <Link href="/cookies" className="landing-v2-footer__link">
            Cookies
          </Link>
          <Link href="/widerruf" className="landing-v2-footer__link">
            Widerruf
          </Link>
        </nav>
      </div>
    </footer>
  );
}

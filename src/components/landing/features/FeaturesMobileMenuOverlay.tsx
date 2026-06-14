"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { NAV_LABELS_DE } from "@/lib/features-menu-i18n";

type FeaturesMobileMenuOverlayProps = {
  open: boolean;
  onClose: () => void;
  navLinks: readonly { label: string; href: string }[];
};

export function FeaturesMobileMenuOverlay({
  open,
  onClose,
  navLinks,
}: FeaturesMobileMenuOverlayProps) {
  const tNav = useTranslations("landingPage.nav");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between overflow-y-auto bg-zinc-950/95 p-6 backdrop-blur-2xl md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={NAV_LABELS_DE.menuOpen}
    >
      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <BrandWordmark href="/" onClick={onClose} />
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact glassAuth />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-zinc-900/80 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label={NAV_LABELS_DE.menuClose}
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="space-y-1 border-t border-zinc-800/60 pt-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="block min-h-11 rounded-lg border-b border-zinc-900 px-1 py-3 text-sm text-zinc-200 no-underline active:text-[#ccff00]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/auth/sign-in"
        onClick={onClose}
        className="landing-glass-btn-cta mt-6 block w-full py-3.5 text-center text-sm no-underline"
      >
        {tNav("ctaAuth")}
      </Link>
    </div>
  );
}

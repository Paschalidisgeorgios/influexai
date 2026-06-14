"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FEATURES_MEGA_MENU_SECTIONS,
  FEATURES_MEGA_PROMO,
} from "@/lib/landing-features-mega-v2";
import { useFeaturesMenuLabel, NAV_LABELS_DE } from "@/lib/features-menu-i18n";

const PANEL_CLASS =
  "hidden w-full max-w-[1100px] rounded-2xl border border-zinc-800/60 bg-zinc-950/50 shadow-2xl backdrop-blur-2xl md:block isolate";

type DesktopProps = {
  open: boolean;
  onClose: () => void;
  /** @deprecated All desktop panels use fixed viewport centering under the navbar */
  anchored?: boolean;
};

function MegaMenuColumn({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: (typeof FEATURES_MEGA_MENU_SECTIONS)[number]["items"];
  onNavigate?: () => void;
}) {
  return (
    <div className="min-w-0">
      <p className="border-b border-zinc-900 pb-2 font-mono text-[11px] tracking-widest text-zinc-400 uppercase">
        {label}
      </p>
      <ul className="mt-4 space-y-5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className="group block no-underline"
            >
              <span className="flex items-start gap-2">
                <span className="mt-0.5 text-base leading-none" aria-hidden>
                  {item.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-zinc-200 transition-colors group-hover:text-[#ccff00]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block pl-7 font-sans text-zinc-400">
                    {item.subtitle}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MegaMenuPromoTeaser({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href={FEATURES_MEGA_PROMO.href}
      onClick={onNavigate}
      className="group relative block h-full min-h-[320px] w-full cursor-pointer overflow-hidden no-underline md:min-h-0 md:w-[340px]"
    >
      <Image
        src={FEATURES_MEGA_PROMO.imageSrc}
        alt=""
        fill
        sizes="340px"
        className="object-cover grayscale brightness-[0.7] contrast-125 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 z-[1] p-6">
        <p className="font-sans text-sm leading-snug font-bold text-white">
          {FEATURES_MEGA_PROMO.prompt}
        </p>
        <span className="mt-4 inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-sans text-xs font-semibold text-white backdrop-blur-md transition-all group-hover:bg-white group-hover:text-black">
          {FEATURES_MEGA_PROMO.cta}
        </span>
      </div>
    </Link>
  );
}

export function FeaturesMegaMenuDesktop({
  open,
  onClose,
}: DesktopProps) {
  const { label } = useFeaturesMenuLabel();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] hidden cursor-default border-none bg-black/40 md:block"
        aria-label={label("close")}
        onClick={onClose}
      />
      <div
        className={`fixed top-16 left-1/2 z-[100] -translate-x-1/2 ${PANEL_CLASS}`}
        role="dialog"
        aria-modal="true"
        aria-label={label("title")}
      >
        <div className="flex flex-col md:flex-row">
          <div className="grid flex-1 grid-cols-1 gap-10 p-8 sm:grid-cols-3">
            {FEATURES_MEGA_MENU_SECTIONS.map((section) => (
              <MegaMenuColumn
                key={section.id}
                label={section.label}
                items={section.items}
                onNavigate={onClose}
              />
            ))}
          </div>

          <div className="relative border-t border-zinc-900 p-6 md:w-[340px] md:shrink-0 md:border-t-0 md:border-l">
            <MegaMenuPromoTeaser onNavigate={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}

type MobileProps = {
  onNavigate?: () => void;
};

export function FeaturesMegaMenuMobile({ onNavigate }: MobileProps) {
  const { label } = useFeaturesMenuLabel();

  return (
    <div className="features-mega-mobile md:hidden">
      <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        {label("title") || NAV_LABELS_DE.features}
      </p>
      <div className="space-y-6">
        {FEATURES_MEGA_MENU_SECTIONS.map((section) => (
          <MegaMenuColumn
            key={section.id}
            label={section.label}
            items={section.items}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800/60">
        <MegaMenuPromoTeaser onNavigate={onNavigate} />
      </div>
    </div>
  );
}

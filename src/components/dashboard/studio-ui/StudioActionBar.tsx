"use client";

import Link from "next/link";
import { cn } from "./cn";
import {
  STUDIO_ACCENT,
  STUDIO_INPUT_BG,
  STUDIO_MUTED,
  STUDIO_RADIUS,
  STUDIO_TEXT,
} from "./tokens";

type ActionProps = {
  primaryLabel: string;
  onPrimary?: () => void;
  primaryHref?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryLoadingLabel?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  hint?: string;
  className?: string;
  stickyMobile?: boolean;
};

const primaryClass = cn(
  "inline-flex min-h-[48px] flex-1 items-center justify-center px-7 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:min-w-[11rem]",
  STUDIO_RADIUS.button
);

const secondaryClass = cn(
  "inline-flex min-h-[48px] flex-1 items-center justify-center border px-7 text-sm font-medium no-underline transition-colors hover:border-black/18 sm:flex-none",
  STUDIO_RADIUS.button
);

export function StudioActionBar({
  primaryLabel,
  onPrimary,
  primaryHref,
  primaryDisabled,
  primaryLoading,
  primaryLoadingLabel = "Wird gestartet…",
  secondaryLabel = "Mit Agent vorbereiten",
  secondaryHref,
  hint,
  className,
  stickyMobile = false,
}: ActionProps) {
  const primaryStyle = { background: STUDIO_ACCENT, color: "#060608" } as const;
  const secondaryStyle = {
    borderColor: "rgba(8,8,8,0.10)",
    background: STUDIO_INPUT_BG,
    color: STUDIO_TEXT,
  } as const;

  const loadingLabel = primaryLoading ? primaryLoadingLabel : primaryLabel;

  return (
    <div
      className={cn(
        "space-y-3 pt-1",
        stickyMobile &&
          "sticky bottom-[4.75rem] z-10 -mx-0.5 border-t border-black/[0.06] bg-[rgba(250,246,238,0.96)] px-0.5 py-3 backdrop-blur-md md:static md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {primaryHref ? (
          <Link href={primaryHref} className={primaryClass} style={primaryStyle}>
            {loadingLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled || primaryLoading}
            className={primaryClass}
            style={primaryStyle}
          >
            {loadingLabel}
          </button>
        )}
        {secondaryHref ? (
          <Link href={secondaryHref} className={secondaryClass} style={secondaryStyle}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
      {hint ? (
        <p className="text-xs leading-relaxed" style={{ color: STUDIO_MUTED }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

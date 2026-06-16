"use client";

import Link from "next/link";
import { getShellCreditStyles } from "./credit-status";

export function SidebarCreditsDisplay({
  credits,
  loaded,
}: {
  credits: number;
  loaded: boolean;
}) {
  if (!loaded) {
    return (
      <span className="h-4 w-10 animate-pulse rounded bg-white/5" aria-hidden />
    );
  }

  const { text, dot, showDot } = getShellCreditStyles(credits);

  return (
    <span className="inline-flex items-center gap-2">
      {showDot ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: dot, opacity: 0.85 }}
          aria-hidden
        />
      ) : null}
      <span
        className="font-mono text-[12px] font-medium tabular-nums"
        style={{ color: text }}
      >
        {credits.toLocaleString("de-DE")}
      </span>
    </span>
  );
}

export function SidebarCreditsLink({
  credits,
  loaded,
}: {
  credits: number;
  loaded: boolean;
}) {
  return (
    <Link
      href="/dashboard/credits"
      className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03]"
    >
      <span className="text-[11px] font-medium tracking-wide text-white/40">
        Credits
      </span>
      <SidebarCreditsDisplay credits={credits} loaded={loaded} />
    </Link>
  );
}

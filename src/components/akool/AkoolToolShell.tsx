"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type AkoolToolShellProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  creditHint?: string;
  loading?: boolean;
  children: ReactNode;
  result?: ReactNode;
  generating?: boolean;
  elapsedSec?: number;
};

export function AkoolToolShell({
  icon: Icon,
  title,
  description,
  creditHint,
  loading,
  children,
  result,
  generating,
  elapsedSec = 0,
}: AkoolToolShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 md:px-6 lg:px-10">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Icon size={32} color="#B4FF00" strokeWidth={2.2} />
          <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,4vw,3rem)] tracking-wide text-[#F0EFE8]">
            {title}
          </h1>
        </div>
        <p className="text-[0.95rem] leading-relaxed text-[rgba(255,255,255,0.65)]">
          {description}
          {creditHint ? (
            <span className="ml-2 text-[#B4FF00]">· {creditHint}</span>
          ) : null}
        </p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-2xl bg-white/5" />
          <div className="h-24 rounded-2xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10">
          <div className="flex flex-col gap-5">{children}</div>
          <div className="flex min-h-[420px] flex-col gap-4 rounded-2xl border border-white/8 bg-[#060608] p-4">
            {generating ? (
              <div className="flex flex-1 flex-col justify-center gap-5 p-6">
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-full animate-pulse rounded-full bg-[#B4FF00]/60" />
                </div>
                <p className="text-center text-sm text-[#B4FF00]">
                  Wird generiert… {elapsedSec}s
                </p>
                <p className="text-center text-xs text-[rgba(255,255,255,0.45)]">
                  Bitte Tab offen lassen · typisch 30–120 Sekunden
                </p>
              </div>
            ) : (
              result ?? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <Icon size={48} color="rgba(255,255,255,0.65)" strokeWidth={1.5} />
                  <p className="text-sm text-[rgba(255,255,255,0.65)]">
                    Dein Ergebnis erscheint hier
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const akoolInputClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40 font-[family-name:var(--font-dm)]";

export const akoolLabelClass = "text-sm font-semibold text-[#F0EFE8]";

export const akoolButtonClass =
  "min-h-[48px] w-full rounded-xl bg-[#B4FF00] py-3.5 font-[family-name:var(--font-bebas)] text-xl tracking-wide text-[#060608] disabled:cursor-not-allowed disabled:opacity-45 md:w-auto";

export const akoolSelectClass = akoolInputClass;

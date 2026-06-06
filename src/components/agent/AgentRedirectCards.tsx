"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AgentRedirectOutput } from "@/lib/agent/types";

type Props = {
  redirects: AgentRedirectOutput[];
};

export function AgentRedirectCards({ redirects }: Props) {
  if (!redirects.length) return null;

  return (
    <div className="space-y-3">
      {redirects.map((r) => (
        <div
          key={`${r.tool}-${r.href}`}
          className="rounded-xl border border-white/15 bg-[#0c0c0f] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <p className="text-base font-bold text-[#F0EFE8]">
            <span className="mr-1.5" aria-hidden>
              {r.emoji}
            </span>
            {r.title}
          </p>
          <p className="mt-1.5 text-sm text-white/80">{r.headline}</p>
          <p className="mt-1 text-xs text-white/55 leading-relaxed">
            {r.description}
          </p>
          <Link
            href={r.href}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent,#B4FF00)] px-4 py-2.5 text-xs font-bold text-[#060608] hover:brightness-105 transition-all shadow-[0_0_20px_color-mix(in_srgb,var(--accent,#B4FF00)_25%,transparent)]"
          >
            Jetzt öffnen
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      ))}
    </div>
  );
}

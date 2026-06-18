"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardKicker,
  DashboardPageHeader,
  DashboardPanel,
} from "./DashboardSurface";

export type DashboardOsModuleLink = {
  label: string;
  description: string;
  href: string;
};

type DashboardOsModulePageProps = {
  kicker: string;
  title: string;
  subtitle: string;
  bullets: string[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  links?: DashboardOsModuleLink[];
  note?: string;
};

export function DashboardOsModulePage({
  kicker,
  title,
  subtitle,
  bullets,
  primaryCta,
  secondaryCta,
  links,
  note,
}: DashboardOsModulePageProps) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <DashboardPageHeader kicker={kicker} title={title} subtitle={subtitle} />

      <DashboardPanel className="mb-6">
        <ul className="space-y-3">
          {bullets.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 text-sm leading-relaxed"
              style={{ color: DASHBOARD_MUTED }}
            >
              <span style={{ color: DASHBOARD_ACCENT }} aria-hidden>
                ·
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {note ? (
          <p className="mt-5 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {note}
          </p>
        ) : null}
      </DashboardPanel>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={primaryCta.href}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold no-underline transition-opacity hover:opacity-90"
          style={{ background: DASHBOARD_ACCENT, color: "#080808" }}
        >
          {primaryCta.label}
          <ArrowRight size={16} aria-hidden />
        </Link>
        {secondaryCta ? (
          <Link
            href={secondaryCta.href}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-5 text-sm font-medium no-underline transition-colors hover:border-white/20"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              color: DASHBOARD_TEXT,
            }}
          >
            {secondaryCta.label}
          </Link>
        ) : null}
      </div>

      {links && links.length > 0 ? (
        <section aria-labelledby="dashboard-os-module-links">
          <DashboardKicker>Bereits verfügbar</DashboardKicker>
          <h2
            id="dashboard-os-module-links"
            className="mb-4 text-base font-semibold"
            style={{ color: DASHBOARD_TEXT }}
          >
            Verwandte Workflows
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-2xl border p-4 no-underline transition-colors hover:border-white/16"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: DASHBOARD_TEXT }}>
                  {link.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

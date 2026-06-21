"use client";

import Link from "next/link";
import { DashboardPrimaryNav } from "./DashboardPrimaryNav";
import { DashboardSecondaryNav } from "./DashboardSecondaryNav";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { DashboardWebsiteLink } from "./DashboardWebsiteLink";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_SHELL_BG,
  DashboardStage,
} from "./DashboardSurface";
import { STUDIO_SHELL_BG } from "../studio-ui/tokens";

export function DashboardStandaloneChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-dvh"
      style={{ background: DASHBOARD_SHELL_BG, color: "white" }}
    >
      <aside
        className="fixed left-0 top-0 z-20 hidden h-dvh w-[240px] flex-col border-r md:flex"
        style={{
          background: STUDIO_SHELL_BG,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/dashboard"
          className="mb-4 flex shrink-0 items-center gap-3 px-5 py-5 transition-opacity hover:opacity-90"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(180,255,0,0.22)",
            }}
          >
            <span
              className="text-lg font-black leading-none"
              style={{ color: DASHBOARD_ACCENT }}
            >
              I
            </span>
          </div>
          <span className="text-[14px] font-semibold tracking-wide text-white/90">
            INFLUEX<span className="text-white/55">AI</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <DashboardPrimaryNav />
          <DashboardSecondaryNav />
        </div>
        <div
          className="shrink-0 border-t px-2 py-3"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <DashboardWebsiteLink />
        </div>
      </aside>

      <main className="ml-0 flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden pb-[5rem] md:ml-[240px] md:pb-0">
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <DashboardStage>{children}</DashboardStage>
        </div>
      </main>

      <DashboardMobileNav />
    </div>
  );
}

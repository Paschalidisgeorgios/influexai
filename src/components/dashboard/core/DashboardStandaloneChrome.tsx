"use client";

import Link from "next/link";
import { DashboardPrimaryNav } from "./DashboardPrimaryNav";
import { DashboardMobileNav } from "./DashboardMobileNav";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_SHELL_BG,
  DashboardStage,
} from "./DashboardSurface";

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
          background: DASHBOARD_SHELL_BG,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/dashboard"
          className="mb-4 flex shrink-0 items-center gap-3 px-5 py-5 transition-opacity hover:opacity-85"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: DASHBOARD_ACCENT }}
          >
            <span className="text-lg font-black leading-none text-black">I</span>
          </div>
          <span className="text-[14px] font-bold tracking-wide text-white">
            INFLUEX<span style={{ color: DASHBOARD_ACCENT }}>AI</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <DashboardPrimaryNav />
        </div>
      </aside>

      <main className="ml-0 flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden pb-[4.5rem] md:ml-[240px] md:pb-0">
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <DashboardStage>{children}</DashboardStage>
        </div>
      </main>

      <DashboardMobileNav />
    </div>
  );
}

"use client";

import Link from "next/link";
import { DashboardPrimaryNav } from "./DashboardPrimaryNav";
import { DashboardMobileNav } from "./DashboardMobileNav";

export function DashboardStandaloneChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#0A0A0A", color: "white" }}
    >
      <aside
        className="fixed left-0 top-0 z-20 hidden h-screen w-[240px] flex-col border-r border-white/[0.02] md:flex"
        style={{ background: "#09090A" }}
      >
        <Link
          href="/dashboard"
          className="mb-6 flex shrink-0 items-center gap-3 px-5 py-4 transition-opacity hover:opacity-85"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "#ccff00" }}
          >
            <span className="text-lg font-black leading-none text-black">I</span>
          </div>
          <span className="text-[14px] font-bold tracking-wide text-white">
            INFLUEX<span style={{ color: "#ccff00" }}>AI</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <DashboardPrimaryNav />
        </div>
      </aside>

      <main className="ml-0 flex-1 overflow-y-auto pb-[4.5rem] md:ml-[240px] md:pb-0">
        {children}
      </main>

      <DashboardMobileNav />
    </div>
  );
}

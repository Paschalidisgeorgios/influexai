"use client";

import Link from "next/link";
import { DashboardPrimaryNav } from "./DashboardPrimaryNav";

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

      <main className="ml-0 flex-1 overflow-y-auto pb-16 md:ml-[240px] md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-white/[0.04] md:hidden"
        style={{
          background: "#09090A",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {[
          { href: "/dashboard", label: "Studio" },
          { href: "/dashboard/ki-agent", label: "Agent" },
          { href: "/dashboard/gallery", label: "Galerie" },
          { href: "/dashboard/settings", label: "Settings" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium text-white/40"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

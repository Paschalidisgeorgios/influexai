"use client";

import { glassSurfaceStaticClass } from "@/lib/glass-classes";
import { DashboardSidebarContent } from "./DashboardSidebarContent";

export function DashboardSidebar() {
  return (
    <aside
      className={`relative z-[1] hidden h-full w-[280px] shrink-0 flex-col border-r border-zinc-700/70 bg-zinc-950/75 md:flex ${glassSurfaceStaticClass}`}
    >
      <DashboardSidebarContent />
    </aside>
  );
}

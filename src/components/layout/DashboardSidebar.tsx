"use client";

import { GlobalSidebar } from "@/components/dashboard-v2/GlobalSidebar";

/** @deprecated Use GlobalSidebar — kept for DashboardMobileSidebar compat */
export function DashboardSidebar({ drawerMode = false }: { drawerMode?: boolean }) {
  return <GlobalSidebar mobile={drawerMode} />;
}

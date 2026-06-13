"use client";

import { DashboardShell } from "@/components/dashboard-v3/DashboardShell";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

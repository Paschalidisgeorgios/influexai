"use client";

import { DashboardShell } from "@/components/dashboard/core/DashboardShell";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

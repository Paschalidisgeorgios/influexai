"use client";

import { CanvasShell } from "@/components/canvas/CanvasShell";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CanvasShell>{children}</CanvasShell>;
}

"use client";

import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { WorkspaceApi } from "@/lib/dashboard-v3/useWorkspace";
import type { SmartCapsuleApi } from "@/lib/dashboard-v3/useSmartCapsule";

export type DashboardV3ContextValue = WorkspaceApi & {
  capsule: SmartCapsuleApi;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  modelSheetOpen: boolean;
  setModelSheetOpen: (open: boolean) => void;
  triggerImpulse: (amount?: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  elementRef: RefObject<HTMLDivElement | null>;
};

const DashboardV3Context = createContext<DashboardV3ContextValue | null>(null);

export function DashboardV3Provider({
  value,
  children,
}: {
  value: DashboardV3ContextValue;
  children: React.ReactNode;
}) {
  return <DashboardV3Context.Provider value={value}>{children}</DashboardV3Context.Provider>;
}

export function useDashboardV3() {
  const ctx = useContext(DashboardV3Context);
  if (!ctx) {
    throw new Error("useDashboardV3 must be used within DashboardShell");
  }
  return ctx;
}

export function useDashboardV3Optional() {
  return useContext(DashboardV3Context);
}

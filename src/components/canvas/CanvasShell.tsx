"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { BuyCreditsProvider } from "@/components/credits/BuyCreditsProvider";
import { PlanGateProvider } from "@/components/plan-gate/PlanGateProvider";
import { resolveToolIdFromPath } from "@/lib/canvas/toolApiSchema";
import { useCanvasStore } from "@/lib/canvas/canvas-store";
import { CanvasSidebar } from "./CanvasSidebar";
import { InfiniteCanvas } from "./InfiniteCanvas";

const LEGACY_CHILD_ROUTES = [
  "/dashboard/settings",
  "/dashboard/credits",
  "/dashboard/admin",
  "/dashboard/agency",
  "/dashboard/analytics",
  "/dashboard/white-label",
  "/dashboard/referral",
  "/dashboard/profile",
  "/dashboard/api",
];

interface CanvasShellProps {
  children?: React.ReactNode;
}

export function CanvasShell({ children }: CanvasShellProps) {
  const pathname = usePathname();
  const spawnControlNode = useCanvasStore((s) => s.spawnControlNode);
  const lastSpawned = useRef<string | null>(null);

  const showLegacy = LEGACY_CHILD_ROUTES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (showLegacy) return;
    const toolId = resolveToolIdFromPath(pathname);
    if (!toolId || lastSpawned.current === `${pathname}-${toolId}`) return;
    lastSpawned.current = `${pathname}-${toolId}`;
    spawnControlNode(toolId);
  }, [pathname, showLegacy, spawnControlNode]);

  if (showLegacy) {
    return (
      <BuyCreditsProvider>
        <PlanGateProvider>
          <div className="min-h-[100dvh] bg-[#030304] text-white">{children}</div>
        </PlanGateProvider>
      </BuyCreditsProvider>
    );
  }

  return (
    <BuyCreditsProvider>
      <PlanGateProvider>
        <ReactFlowProvider>
          <div className="flex h-[100dvh] w-full overflow-hidden bg-[#030304] text-white">
            <CanvasSidebar />
            <div className="relative min-w-0 flex-1">
              <InfiniteCanvas />
            </div>
          </div>
        </ReactFlowProvider>
      </PlanGateProvider>
    </BuyCreditsProvider>
  );
}

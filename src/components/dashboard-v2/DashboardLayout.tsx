"use client";

import { useState, type ReactNode } from "react";
import { BuyCreditsProvider } from "@/components/credits/BuyCreditsProvider";
import { PlanGateProvider } from "@/components/plan-gate/PlanGateProvider";
import { PushPermission } from "@/components/ui/PushPermission";
import { DashboardV2Provider, useDashboardV2 } from "@/contexts/DashboardV2Context";
import { DashboardToolProvider } from "@/contexts/DashboardToolContext";
import { GlobalSidebar } from "./GlobalSidebar";
import { ModelSelector } from "./ModelSelector";
import { WorkspaceCanvas } from "./WorkspaceCanvas";
import { SmartCapsule } from "./SmartCapsule";
import { DashboardMobileDrawer } from "./DashboardMobileDrawer";

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { capsuleMessage, capsuleFlashing, themeRgb } = useDashboardV2();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <SmartCapsule
        rgb={themeRgb}
        message={capsuleMessage}
        isFlashing={capsuleFlashing}
      />
      <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#08080a]">
        <div className="hidden md:flex">
          <GlobalSidebar />
        </div>
        <DashboardMobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <ModelSelector />
        <WorkspaceCanvas onMobileMenuToggle={() => setMobileOpen(true)}>
          {children}
        </WorkspaceCanvas>
      </div>
    </>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <BuyCreditsProvider>
      <DashboardV2Provider>
        <DashboardToolProvider>
          <PlanGateProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
            <PushPermission />
          </PlanGateProvider>
        </DashboardToolProvider>
      </DashboardV2Provider>
    </BuyCreditsProvider>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BuyCreditsProvider } from "@/components/credits/BuyCreditsProvider";
import { PlanGateProvider } from "@/components/plan-gate/PlanGateProvider";
import { PushPermission } from "@/components/ui/PushPermission";
import { DashboardToolProvider } from "@/contexts/DashboardToolContext";
import { createClient } from "@/lib/supabase/client";
import { getToolByRoute, THEME_COLORS } from "@/lib/dashboard-v3/registry";
import { DashboardV3Provider } from "@/lib/dashboard-v3/context";
import { useWorkspace } from "@/lib/dashboard-v3/useWorkspace";
import { useSmartCapsule } from "@/lib/dashboard-v3/useSmartCapsule";
import { use3DReveal } from "@/lib/dashboard-v3/use3DReveal";
import { SmartCapsule } from "./SmartCapsule";
import { GlobalSidebar } from "./GlobalSidebar";
import { ModelSelector } from "./ModelSelector";
import { WorkspaceCanvas } from "./WorkspaceCanvas";

function DashboardShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const workspace = useWorkspace();
  const capsule = useSmartCapsule();
  const { containerRef, elementRef, triggerImpulse } = use3DReveal(workspace.activeModel.id);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const prevModelIdRef = useRef(workspace.activeModelId);
  const mountedRef = useRef(false);

  const {
    activeToolId,
    activeModelId,
    activeModel,
    theme,
    setActiveToolId,
    setActiveModelId,
    setCredits,
  } = workspace;

  useEffect(() => {
    const tool = getToolByRoute(pathname);
    if (!tool) return;
    if (tool.id !== activeToolId) {
      setActiveToolId(tool.id);
    }
    if (tool.defaultModelId && pathname.startsWith(tool.route)) {
      setActiveModelId(tool.defaultModelId);
    }
  }, [pathname, activeToolId, setActiveToolId, setActiveModelId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-r", String(theme.r));
    root.style.setProperty("--theme-g", String(theme.g));
    root.style.setProperty("--theme-b", String(theme.b));
    root.style.setProperty("--dash-v3-accent", theme.hex);
    root.style.setProperty("--dash-v3-rgb", theme.rgb);
  }, [theme]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      void supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (typeof data?.credits === "number") setCredits(data.credits);
        });
    });

    const onCredits = () => {
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        void supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (typeof data?.credits === "number") setCredits(data.credits);
          });
      });
    };
    window.addEventListener("credits-updated", onCredits);
    return () => window.removeEventListener("credits-updated", onCredits);
  }, [setCredits]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      const t = window.setTimeout(() => {
        capsule.showMessage(
          "Hey... genau du vor dem Bildschirm. Klick ins Eingabefeld und sag mir wie du heißt. 👇",
          6000,
          5
        );
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [capsule]);

  useEffect(() => {
    if (prevModelIdRef.current === activeModelId) return;
    prevModelIdRef.current = activeModelId;
    const themeLabel = THEME_COLORS[activeModel.themeKey].label;
    capsule.showMessage(
      `${activeModel.name} aktiviert. ${themeLabel}. ⚡`,
      3500,
      6
    );
  }, [activeModel, activeModelId, capsule]);

  const contextValue = {
    ...workspace,
    capsule,
    sidebarOpen,
    setSidebarOpen,
    modelSheetOpen,
    setModelSheetOpen,
    triggerImpulse,
    containerRef,
    elementRef,
  };

  return (
    <DashboardV3Provider value={contextValue}>
      <SmartCapsule
        rgb={theme.rgb}
        message={capsule.displayText}
        textOpacity={capsule.textOpacity}
        isFlashing={capsule.isFlashing}
        isScrolled={capsule.isScrolled}
      />

      <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#050507]">
        <GlobalSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <ModelSelector />
          <WorkspaceCanvas>{children}</WorkspaceCanvas>
        </div>
      </div>
    </DashboardV3Provider>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <BuyCreditsProvider>
      <DashboardToolProvider>
        <PlanGateProvider>
          <DashboardShellInner>{children}</DashboardShellInner>
          <PushPermission />
        </PlanGateProvider>
      </DashboardToolProvider>
    </BuyCreditsProvider>
  );
}

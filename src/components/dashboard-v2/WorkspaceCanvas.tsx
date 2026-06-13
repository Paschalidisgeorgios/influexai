"use client";

import { useEffect, type ReactNode } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { CreditsWarningBanner } from "@/components/credits-warning-banner";
import { ReengagementBanner } from "@/components/reengagement-banner";
import { PlatformBanners } from "@/components/platform-banners";
import { PoweredByFooter } from "@/components/tenant-provider";
import { LegalFooterLinks } from "@/components/legal/LegalPageLayout";
import { PromptCapsule } from "./PromptCapsule";
import { PayloadPanel } from "./PayloadPanel";
import { useDashboardV2 } from "@/contexts/DashboardV2Context";
import { useScrollVelocity } from "@/hooks/dashboard/useScrollVelocity";

export function WorkspaceCanvas({
  children,
  onMobileMenuToggle,
}: {
  children: ReactNode;
  onMobileMenuToggle?: () => void;
}) {
  const { credits, userName, showCapsule } = useDashboardV2();
  const { shouldTrigger, markTriggered } = useScrollVelocity();

  useEffect(() => {
    if (!shouldTrigger) return;
    markTriggered();
    showCapsule(
      `Hey ${userName}, nicht so schnell! Quantenprozessoren noch am warmrechnen! 🧠`,
      4000,
      6
    );
  }, [shouldTrigger, markTriggered, showCapsule, userName]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#08080a]">
      <DashboardHeader credits={credits} onMobileMenuToggle={onMobileMenuToggle} />
      <PlatformBanners isAdmin={false} />
      {credits !== null && <CreditsWarningBanner credits={credits} />}
      <ReengagementBanner />

      <div className="dashboard-v2-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <main className="min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">{children}</main>
        <div className="shrink-0 space-y-2 border-t border-white/[0.06] px-4 py-3 sm:px-6">
          <PromptCapsule />
          <PayloadPanel />
        </div>
        <PoweredByFooter />
        <LegalFooterLinks />
      </div>
    </div>
  );
}

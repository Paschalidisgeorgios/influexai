"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BuyCreditsProvider } from "@/components/credits/BuyCreditsProvider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CreditsWarningBanner } from "@/components/credits-warning-banner";
import { ReengagementBanner } from "@/components/reengagement-banner";
import { PostGenerationUpsell } from "@/components/post-generation-upsell";
import { PlatformBanners } from "@/components/platform-banners";
import { PoweredByFooter } from "@/components/tenant-provider";
import { LegalFooterLinks } from "@/components/legal/LegalPageLayout";
import { createClient } from "@/lib/supabase/client";
import { isAdminUser, isCreditExemptEmail } from "@/lib/access";
import { isClientCreditExempt, syncClientCreditExemptFromEmail } from "@/lib/client-credits-ui";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreditExempt, setIsCreditExempt] = useState(false);
  const [creditsReady, setCreditsReady] = useState(false);
  const supabase = createClient();

  const loadCredits = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCreditsReady(true);
      return;
    }

    syncClientCreditExemptFromEmail(user.email);
    setIsCreditExempt(isCreditExemptEmail(user.email));

    const { data } = await supabase
      .from("profiles")
      .select("credits, is_admin, role")
      .eq("id", user.id)
      .single();

    if (data) {
      setCredits(data.credits ?? 0);
      setIsAdmin(
        isAdminUser({
          email: user.email,
          is_admin: data.is_admin,
          role: data.role,
        })
      );
    }
    setCreditsReady(true);
  }, [supabase]);

  useEffect(() => {
    loadCredits();
    const onUpdate = () => loadCredits();
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      if (typeof v === "number" && !isClientCreditExempt()) {
        setCredits(v);
      } else {
        loadCredits();
      }
    };
    window.addEventListener("credits-updated", onUpdate);
    window.addEventListener("optimistic-credits", onOptimistic);
    return () => {
      window.removeEventListener("credits-updated", onUpdate);
      window.removeEventListener("optimistic-credits", onOptimistic);
    };
  }, [loadCredits]);

  useEffect(() => {
    fetch("/api/track-activity", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <BuyCreditsProvider>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader credits={credits} />
        <PlatformBanners isAdmin={isAdmin} />
        {creditsReady && credits !== null && !isCreditExempt && (
          <CreditsWarningBanner credits={credits} />
        )}
        <main className="relative z-[1] flex flex-col flex-1 w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden px-4 py-2 sm:p-4 md:p-5 pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:pb-0 box-border">
          <ReengagementBanner />
          {children}
        </main>
        <PoweredByFooter />
        <LegalFooterLinks className="border-t border-white/[0.06] bg-[#060608] pb-[calc(4px+env(safe-area-inset-bottom,0px))] md:pb-0" />
        <MobileBottomNav />
        <PostGenerationUpsell />
      </div>
    </BuyCreditsProvider>
  );
}

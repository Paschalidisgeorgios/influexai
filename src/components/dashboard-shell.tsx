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
import { createClient } from "@/lib/supabase/client";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  const loadCredits = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("credits, is_admin")
      .eq("id", user.id)
      .single();

    if (data) {
      setCredits(data.credits ?? 0);
      setIsAdmin(data.is_admin ?? false);
    }
  }, [supabase]);

  useEffect(() => {
    loadCredits();
    const onUpdate = () => loadCredits();
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      if (typeof v === "number") setCredits(v);
      else loadCredits();
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
        {credits !== null && <CreditsWarningBanner credits={credits} />}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-5 pb-20 md:pb-0">
          <ReengagementBanner />
          {children}
        </main>
        <PoweredByFooter />
        <MobileBottomNav />
        <PostGenerationUpsell />
      </div>
    </BuyCreditsProvider>
  );
}

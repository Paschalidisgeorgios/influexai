"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { MotionModal } from "@/components/ui/MotionModal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { canUseFeature, type AccessUser } from "@/lib/access";
import {
  getRouteGate,
  planDisplayName,
} from "@/lib/plan-gating";
import type { SubscriptionPlanId } from "@/lib/subscription-plans";

export function PlanGateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("planGate");
  const [accessUser, setAccessUser] = useState<AccessUser>({
    plan: "free",
    role: "user",
    is_admin: false,
  });
  const [blocked, setBlocked] = useState(false);
  const [requiredPlan, setRequiredPlan] = useState<SubscriptionPlanId>("creator");

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("plan, role, is_admin")
        .eq("id", user.id)
        .single();
      if (data) {
        setAccessUser({
          plan: data.plan ?? "free",
          role: data.role ?? "user",
          is_admin: data.is_admin ?? false,
        });
      }
    };
    load();
    window.addEventListener("credits-updated", load);
    return () => window.removeEventListener("credits-updated", load);
  }, []);

  useEffect(() => {
    const gate = getRouteGate(pathname);
    if (!gate) {
      setBlocked(false);
      return;
    }
    const allowed = canUseFeature(accessUser, gate.minPlan);
    setBlocked(!allowed);
    setRequiredPlan(gate.minPlan);
  }, [pathname, accessUser]);

  return (
    <>
      <div
        className={blocked ? "pointer-events-none select-none opacity-40 blur-[1px]" : undefined}
        aria-hidden={blocked}
      >
        {children}
      </div>

      <MotionModal
        open={blocked}
        overlayClassName="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#060608]/88 backdrop-blur-sm"
        className="max-w-md w-full rounded-2xl border border-[#B4FF00]/25 bg-[#0f0f12] p-6 shadow-2xl"
      >
        <p className="text-[#B4FF00] text-xs font-bold uppercase tracking-[0.14em] mb-2">
          {t("kicker")}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-[#F0EFE8] mb-2 leading-tight">
          {t("title")}
        </h2>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          {t("body", { plan: planDisplayName(requiredPlan) })}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <AcidMotionButton href="/pricing" className="btn-acid flex-1 justify-center">
            {t("cta")}
          </AcidMotionButton>
          <Link
            href="/dashboard"
            className="btn-ghost flex-1 justify-center text-center py-2.5"
          >
            {t("back")}
          </Link>
        </div>
      </MotionModal>
    </>
  );
}

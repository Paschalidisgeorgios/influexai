"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasKiToolEntitlement, type AccessUser } from "@/lib/access";
import { hasActiveTenantMembershipFromRows } from "@/lib/agency-access";
import { routeRequiresPlan } from "@/lib/plan-gating";
import { NoPlanModal } from "./NoPlanModal";

export function PlanGateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [accessUser, setAccessUser] = useState<AccessUser>({
    plan: "free",
    role: "user",
    is_admin: false,
  });
  const [blocked, setBlocked] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasTenantToolAccess, setHasTenantToolAccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("plan, role, is_admin, tenant_id")
          .eq("id", user.id)
          .single();
        if (data) {
          setAccessUser({
            plan: data.plan ?? "free",
            role: data.role ?? "user",
            is_admin: data.is_admin ?? false,
            email: user.email,
          });

          let tenantMembership = false;
          if (data.tenant_id) {
            const { data: tenant } = await supabase
              .from("tenants")
              .select("is_active, deactivated_at")
              .eq("id", data.tenant_id)
              .maybeSingle();
            tenantMembership = hasActiveTenantMembershipFromRows(
              data.tenant_id,
              tenant
            );
          }
          setHasTenantToolAccess(tenantMembership);
        }
      } finally {
        setProfileLoaded(true);
      }
    };
    load();
    window.addEventListener("credits-updated", load);
    return () => window.removeEventListener("credits-updated", load);
  }, []);

  useEffect(() => {
    if (!profileLoaded) {
      setBlocked(false);
      return;
    }
    const needsPlan = routeRequiresPlan(pathname);
    setBlocked(
      needsPlan &&
        !hasKiToolEntitlement(accessUser, hasTenantToolAccess)
    );
  }, [pathname, accessUser, profileLoaded, hasTenantToolAccess]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <NoPlanModal open={blocked} />
      {children}
    </div>
  );
}

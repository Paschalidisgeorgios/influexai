"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasActivePlan, type AccessUser } from "@/lib/access";
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
    const needsPlan = routeRequiresPlan(pathname);
    setBlocked(needsPlan && !hasActivePlan(accessUser));
  }, [pathname, accessUser]);

  return (
    <>
      {children}
      <NoPlanModal open={blocked} />
    </>
  );
}

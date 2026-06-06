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
  const [profileLoaded, setProfileLoaded] = useState(false);

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
          .select("plan, role, is_admin")
          .eq("id", user.id)
          .single();
        if (data) {
          setAccessUser({
            plan: data.plan ?? "free",
            role: data.role ?? "user",
            is_admin: data.is_admin ?? false,
            email: user.email,
          });
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
    setBlocked(needsPlan && !hasActivePlan(accessUser));
  }, [pathname, accessUser, profileLoaded]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pointer-events-auto">
      <NoPlanModal open={blocked} />
      {children}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isPlatformAdmin, type AccessUser } from "@/lib/access";
import { syncClientCreditExemptFromEmail } from "@/lib/client-credits-ui";
import { isAdminFromEmail } from "@/utils/isAdmin";

export function usePlatformAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        syncClientCreditExemptFromEmail(null);
        setIsAdmin(false);
        setReady(true);
        return;
      }

      syncClientCreditExemptFromEmail(user.email);

      let verified = isAdminFromEmail(user.email);

      if (!verified) {
        try {
          const res = await fetch("/api/auth/is-admin");
          if (res.ok) {
            const data = (await res.json()) as { isAdmin?: boolean };
            verified = data.isAdmin === true;
          }
        } catch {
          /* offline — fall back to profile flags */
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, role, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const accessUser: AccessUser = {
        email: user.email,
        plan: profile?.plan,
        role: profile?.role,
        is_admin: profile?.is_admin,
      };

      setIsAdmin(verified || isPlatformAdmin(accessUser));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, ready };
}

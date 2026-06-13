"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getCanvasGreeting,
  resolveCanvasFirstName,
} from "@/lib/canvas/canvas-greeting";

/** Loads the creator's first name once per mount — no polling. */
export function useCanvasUserName(): string {
  const [firstName, setFirstName] = useState<string>("Creator");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled || !user) return;

      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const metaFirst =
        typeof meta?.first_name === "string"
          ? meta.first_name
          : typeof meta?.firstName === "string"
            ? meta.firstName
            : undefined;
      const metaFull =
        typeof meta?.full_name === "string" ? meta.full_name : undefined;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      setFirstName(
        resolveCanvasFirstName({
          firstName: metaFirst,
          fullName: profile?.full_name ?? metaFull,
          email: user.email,
        })
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return firstName;
}

export function useCanvasGreeting() {
  const firstName = useCanvasUserName();
  return useMemo(() => getCanvasGreeting(firstName), [firstName]);
}

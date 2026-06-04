"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const OPTIMISTIC_CREDITS_EVENT = "optimistic-credits";

export function useUserCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [optimistic, setOptimistic] = useState<number | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    if (data) setCredits(data.credits ?? 0);
  }, [supabase]);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      setOptimistic(typeof v === "number" ? v : null);
    };
    window.addEventListener("credits-updated", onUpdate);
    window.addEventListener(OPTIMISTIC_CREDITS_EVENT, onOptimistic);
    return () => {
      window.removeEventListener("credits-updated", onUpdate);
      window.removeEventListener(OPTIMISTIC_CREDITS_EVENT, onOptimistic);
    };
  }, [load]);

  return {
    credits: optimistic ?? credits,
    rawCredits: credits,
    reload: load,
  };
}

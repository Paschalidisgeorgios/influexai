"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.replace("/auth/sign-in");
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={loading}
      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.82rem] font-medium text-white/65 transition-colors hover:border-white/16 hover:bg-white/[0.06] hover:text-white/85 disabled:opacity-50"
    >
      {loading ? "Abmelden…" : "Abmelden"}
    </button>
  );
}

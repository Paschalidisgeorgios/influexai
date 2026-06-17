"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DashboardSignOutButton({
  className = "",
  label = "Abmelden",
  showIcon = true,
}: {
  className?: string;
  label?: string;
  showIcon?: boolean;
}) {
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
      className={className}
    >
      {showIcon ? <LogOut size={13} className="shrink-0 text-white/25" /> : null}
      <span className="text-[11px] text-white/35">{loading ? "Abmelden…" : label}</span>
    </button>
  );
}

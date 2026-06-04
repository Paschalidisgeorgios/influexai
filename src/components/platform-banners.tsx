"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PlatformBanners({ isAdmin }: { isAdmin: boolean }) {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const now = new Date().toISOString();

      const { data: ann } = await supabase
        .from("announcements")
        .select("id, message")
        .eq("is_active", true)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ann?.message) {
        const key = `ann-dismiss-${ann.id}`;
        if (!sessionStorage.getItem(key)) {
          setAnnouncement(ann.message);
          setDismissed(key);
        }
      }

      const { data: settings } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      const val = settings?.value;
      setMaintenance(val === true || val === "true");
    };
    load();
  }, []);

  if (maintenance && !isAdmin) {
    return (
      <div
        style={{
          padding: "12px 16px",
          background: "rgba(251,191,36,0.12)",
          borderBottom: "1px solid rgba(251,191,36,0.3)",
          textAlign: "center",
          fontSize: "0.88rem",
          color: "#fbbf24",
          fontWeight: 600,
        }}
      >
        🔧 Wartungsmodus — Einige Features sind vorübergehend eingeschränkt.
      </div>
    );
  }

  if (!announcement) return null;

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "rgba(180,255,0,0.08)",
        borderBottom: "1px solid rgba(180,255,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <p style={{ margin: 0, fontSize: "0.88rem", color: "#F0EFE8", flex: 1 }}>
        📢 {announcement}
      </p>
      <button
        type="button"
        onClick={() => {
          if (dismissed) sessionStorage.setItem(dismissed, "1");
          setAnnouncement(null);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "#505055",
          cursor: "pointer",
          fontSize: "1.1rem",
        }}
      >
        ×
      </button>
    </div>
  );
}

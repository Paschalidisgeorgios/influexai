import { AlertTriangle } from "lucide-react";
import { shouldShowSharedDbDevWarning } from "@/lib/ai-creator/environment-safety.server";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";

export function AiCreatorEnvironmentHint() {
  if (!shouldShowSharedDbDevWarning()) return null;

  return (
    <div
      className="mb-6 flex gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed"
      style={{
        borderColor: "rgba(251,191,36,0.25)",
        background: "rgba(251,191,36,0.08)",
        color: DASHBOARD_MUTED,
      }}
      role="status"
    >
      <AlertTriangle
        size={16}
        className="mt-0.5 shrink-0"
        style={{ color: "#fbbf24" }}
        aria-hidden
      />
      <p>
        <span className="font-medium" style={{ color: DASHBOARD_TEXT }}>
          Dev-Hinweis:
        </span>{" "}
        Diese lokale Umgebung kann mit einer geteilten Supabase-Instanz verbunden sein.
        Testdaten vorsichtig verwenden.
      </p>
    </div>
  );
}

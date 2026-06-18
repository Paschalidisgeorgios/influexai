/**
 * Internal showcase for Influex foundation primitives.
 * Import in design-preview or Storybook — not wired to public routes in 4G.1.
 */

import { InfluexBadge } from "./InfluexBadge";
import { InfluexButton } from "./InfluexButton";
import { InfluexConsentBox } from "./InfluexConsentBox";
import { InfluexEmptyState } from "./InfluexEmptyState";
import { InfluexInput } from "./InfluexInput";
import { InfluexPanel } from "./InfluexPanel";
import { InfluexStatusPill } from "./InfluexStatusPill";
import { InfluexSurface } from "./InfluexSurface";
import { InfluexTextarea } from "./InfluexTextarea";

export function InfluexFoundationShowcase() {
  return (
    <div className="space-y-6">
      <InfluexSurface variant="editorial" className="p-6">
        <p className="mb-4 text-xs uppercase tracking-[0.12em] text-[var(--influex-text-label)]">
          Influex Foundation · Phase 4G.1
        </p>
        <div className="flex flex-wrap gap-3">
          <InfluexButton variant="primary">Primary</InfluexButton>
          <InfluexButton variant="secondary">Secondary</InfluexButton>
          <InfluexButton variant="ghost">Ghost</InfluexButton>
          <InfluexButton variant="lime">Lime</InfluexButton>
        </div>
      </InfluexSurface>

      <InfluexPanel title="Workflow Module">
        <InfluexInput label="Projektname" placeholder="Kampagnen-Visual Olivenöl" />
        <div className="mt-4">
          <InfluexTextarea
            label="Briefing"
            placeholder="Beschreibe Ziel, Stil und Ausgabeformat…"
            rows={4}
          />
        </div>
      </InfluexPanel>

      <div className="flex flex-wrap gap-2">
        <InfluexBadge tone="lime">240 Credits</InfluexBadge>
        <InfluexBadge tone="muted">Coming Soon</InfluexBadge>
        <InfluexStatusPill status="ready_to_train" />
        <InfluexStatusPill status="training" />
      </div>

      <InfluexConsentBox
        title="Einwilligung zur KI-Verarbeitung"
        description="Ich bestätige, dass ich die Rechte an den hochgeladenen Referenzen besitze und deren Verarbeitung für KI-Training erlaube."
      />

      <InfluexEmptyState
        title="Noch keine Assets"
        description="Starte einen Workflow im Studio — fertige Ergebnisse erscheinen hier in der Galerie."
        actionLabel="Zum Studio"
        actionHref="/dashboard"
      />
    </div>
  );
}

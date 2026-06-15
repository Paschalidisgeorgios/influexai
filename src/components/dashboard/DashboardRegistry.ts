/**
 * DashboardRegistry — zentrale Tool-Registrierung.
 *
 * PRINZIP:
 * Kein Tool wird hart in UI-Dateien importiert.
 * Tools registrieren sich hier — der Rest des Systems fragt hier an.
 *
 * MIGRATION:
 * Neue Tools → Datei in tools/ anlegen → hier eintragen → fertig.
 * Kein Anfassen von Shell, Sidebar oder Board.
 *
 * ABHÄNGIGKEITEN:
 * → tools/types.ts         (ToolModule-Interface)
 * → lib/canvas/toolApiSchema.ts  (Tool-Metadaten: Label, Icon, Kategorie)
 */

import type { ToolModule } from "./tools/types";
import { KreaImageToolModule } from "./tools/KreaImageTool";
import { UgcVideoToolModule } from "./tools/UgcVideoTool";

// ---------------------------------------------------------------------------
// Registry-Array — Einzige Stelle wo Tools eingetragen werden
// ---------------------------------------------------------------------------

const REGISTERED_MODULES: ToolModule[] = [
  // ── Bild-Generierung ──────────────────────────────────────────────────────
  KreaImageToolModule,         // flux-image  → /api/generate-image (Krea AI + Flux via Fal)

  // ── Video-Generierung ─────────────────────────────────────────────────────
  UgcVideoToolModule,          // ugc-video   → /api/seedance (Akool: Kling, Seedance, Minimax)

  // ── Agenten / Text ────────────────────────────────────────────────────────
  // ContentCalendarModule,    // TODO: tools/ContentCalendarTool.tsx
  // NicheAnalyzerModule,      // TODO: tools/NicheAnalyzerTool.tsx
  // CampaignAutopilotModule,  // TODO: tools/CampaignAutopilotTool.tsx
];

// ---------------------------------------------------------------------------
// Intern: Map für O(1)-Lookup
// ---------------------------------------------------------------------------

const REGISTRY = new Map<string, ToolModule>(
  REGISTERED_MODULES.map((m) => [m.toolId, m])
);

// ---------------------------------------------------------------------------
// Öffentliche API
// ---------------------------------------------------------------------------

/**
 * Gibt das ToolModule für eine toolId zurück, oder null wenn nicht migriert.
 * Nicht-registrierte Tools nutzen den generischen ParamFields-Fallback in ToolControlPanel.
 */
export function getRegisteredModule(toolId: string): ToolModule | null {
  return REGISTRY.get(toolId) ?? null;
}

/** Alle registrierten Tool-IDs. */
export function getRegisteredToolIds(): string[] {
  return [...REGISTRY.keys()];
}

/** Ist das Tool bereits in die neue Modul-Architektur migriert? */
export function isModuleTool(toolId: string): boolean {
  return REGISTRY.has(toolId);
}

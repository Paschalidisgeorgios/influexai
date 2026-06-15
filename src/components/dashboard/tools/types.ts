/**
 * ToolModule — Schnittstelle die jedes Tool-Modul implementieren muss.
 *
 * INVARIANTEN:
 * - validate() gibt null zurück wenn valide, sonst Fehlermeldung
 * - buildPayload() gibt das exakte POST-Body für apiRoute zurück
 * - polling ist optional: nur für async Jobs (Video-Generierung etc.)
 */

import type { ComponentType } from "react";

export interface ToolModule {
  /** ID des Tools — muss exakt der toolId in toolApiSchema.ts entsprechen */
  toolId: string;

  /** Formular-Komponente */
  FormComponent: ComponentType<ToolFormProps>;

  /** Validierung — null = OK, string = Fehlermeldung */
  validate: (values: Record<string, unknown>) => string | null;

  /** Baut das exakte POST-Body für apiRoute */
  buildPayload: (values: Record<string, unknown>) => Record<string, unknown>;

  /** API-Route für den POST-Call */
  apiRoute: string;

  /** Polling-Konfiguration für async Jobs (Video etc.) */
  polling?: {
    statusEndpoint: string;
    processingLabel: string;
  };
}

export interface ToolFormProps {
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

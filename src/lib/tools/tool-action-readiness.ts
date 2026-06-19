/**
 * Tool workspace action readiness — Phase 4G.4W-B.
 * Pure helpers: no provider payloads, execution, or secrets.
 */

import type { AgentPreparedInputs } from "@/lib/tools/agent-prepared-inputs";
import { isStudioProviderExecutionDisabled } from "@/lib/tools/studio-tool-registry";

export type ToolActionReadinessStatus =
  | "not_started"
  | "missing_inputs"
  | "ready_preview"
  | "blocked_provider_disabled"
  | "blocked_safety";

export type ToolLocalInputState = {
  prompt?: string;
  aspectRatio?: string | null;
  imageUrl?: string;
  motionPrompt?: string;
  hasConsent?: boolean;
  hasCharacterDraft?: boolean;
  handoffReady?: boolean;
  uploadShellPending?: boolean;
  audience?: string;
  topic?: string;
  platform?: string;
  industryBrand?: string;
  timeframe?: string;
  platforms?: string;
};

export type ToolActionReadinessOptions = {
  toolId?: string;
  /** Explicit override — tests and server env use PROVIDERS_DISABLED. */
  providerDisabled?: boolean;
};

export type ToolActionReadiness = {
  toolId: string;
  status: ToolActionReadinessStatus;
  missingRequiredInputs: string[];
  completedInputs: string[];
  recommendedNextStep: string;
  safeCtaLabel: string;
  blockedReason: string | null;
  providerDisabled: boolean;
  canNavigate: boolean;
  canExecute: boolean;
  executionDisabledMessage: string;
  statusLabel: string;
  outputExpectation: string | null;
};

export const READINESS_EXECUTION_DISABLED_MESSAGE =
  "Ausführung ist in dieser Umgebung deaktiviert. Es wird nichts generiert, trainiert, hochgeladen oder abgerechnet.";

export const READINESS_SAFE_CTA_LABELS = [
  "Eingaben prüfen",
  "Briefing vervollständigen",
  "Vorbereitung fortsetzen",
  "Vorschau prüfen",
  "Vorbereitung anzeigen",
  "Briefing vorbereiten",
  "Tool öffnen",
] as const;

const FORBIDDEN_READINESS_PATTERNS = [
  /api[_-]?key/i,
  /data:[^;]+;base64,/i,
  /providerpayload/i,
  /service_role/i,
] as const;

const STATUS_LABELS: Record<ToolActionReadinessStatus, string> = {
  not_started: "Noch nicht gestartet",
  missing_inputs: "Eingaben unvollständig",
  ready_preview: "Vorbereitung vollständig",
  blocked_provider_disabled: "Ausführung blockiert",
  blocked_safety: "Sicherheitsprüfung ausstehend",
};

function trim(value: string | undefined | null): string {
  return value?.trim() ?? "";
}

function hasText(value: string | undefined | null): boolean {
  return trim(value).length > 0;
}

export function isProvidersDisabledForReadiness(
  toolId: string,
  options?: ToolActionReadinessOptions
): boolean {
  if (options?.providerDisabled !== undefined) return options.providerDisabled;
  if (typeof process !== "undefined") {
    const flag = process.env.PROVIDERS_DISABLED?.trim().toLowerCase();
    if (flag === "true" || flag === "1" || flag === "yes") return true;
  }
  return isStudioProviderExecutionDisabled(toolId);
}

function resolveEffectiveLocalState(
  toolId: string,
  prepared: AgentPreparedInputs | null,
  local: ToolLocalInputState
): ToolLocalInputState {
  const next = { ...local };
  if (toolId === "viral-hook" && !hasText(next.topic) && prepared?.originalGoal) {
    next.topic = prepared.originalGoal;
  }
  if (toolId === "img-to-video" && !hasText(next.motionPrompt) && hasText(next.prompt)) {
    next.motionPrompt = next.prompt;
  }
  return next;
}

function evaluateAiCreatorInputs(local: ToolLocalInputState): {
  missing: string[];
  completed: string[];
} {
  const missing: string[] = [];
  const completed: string[] = [];

  if (local.hasConsent) {
    completed.push("Consent bestätigen");
  } else {
    missing.push("Consent bestätigen");
  }

  if (local.hasCharacterDraft) {
    completed.push("Character Draft prüfen");
  } else {
    missing.push("Character Draft prüfen");
  }

  if (local.handoffReady) {
    completed.push("Handoff-ready Status");
  } else if (local.hasCharacterDraft && local.hasConsent) {
    missing.push("Handoff-ready Status");
  }

  if (local.uploadShellPending) {
    completed.push("Upload-Shell-Status");
  }

  return { missing, completed };
}

function evaluateImgToVideoInputs(
  local: ToolLocalInputState,
  prepared: AgentPreparedInputs | null
): { missing: string[]; completed: string[] } {
  const missing: string[] = [];
  const completed: string[] = [];

  if (hasText(local.imageUrl)) {
    completed.push("Startbild");
  } else {
    missing.push("Startbild");
  }

  const motion = trim(local.motionPrompt ?? local.prompt);
  if (motion) {
    completed.push("Bewegungsbeschreibung");
  } else {
    missing.push("Bewegungsbeschreibung");
  }

  const ratio = local.aspectRatio ?? prepared?.recommendedAspectRatio ?? null;
  if (ratio) {
    completed.push(`Format ${ratio}`);
  } else {
    missing.push("Format");
  }

  return { missing, completed };
}

function evaluateTextToVideoInputs(
  local: ToolLocalInputState,
  prepared: AgentPreparedInputs | null
): { missing: string[]; completed: string[] } {
  const missing: string[] = [];
  const completed: string[] = [];

  if (hasText(local.prompt)) {
    completed.push("Script / Szenenbeschreibung");
  } else {
    missing.push("Script / Szenenbeschreibung");
  }

  const ratio = local.aspectRatio ?? prepared?.recommendedAspectRatio ?? null;
  if (ratio) {
    completed.push(`Format ${ratio}`);
  } else {
    missing.push("Format");
  }

  return { missing, completed };
}

function evaluateViralHookInputs(local: ToolLocalInputState): {
  missing: string[];
  completed: string[];
} {
  const missing: string[] = [];
  const completed: string[] = [];

  if (hasText(local.audience)) completed.push("Zielgruppe");
  else missing.push("Zielgruppe");

  if (hasText(local.topic)) completed.push("Thema");
  else missing.push("Thema");

  if (hasText(local.platform)) completed.push("Plattform");
  else missing.push("Plattform");

  return { missing, completed };
}

function evaluateContentCalendarInputs(local: ToolLocalInputState): {
  missing: string[];
  completed: string[];
} {
  const missing: string[] = [];
  const completed: string[] = [];

  if (hasText(local.industryBrand)) completed.push("Branche / Brand");
  else missing.push("Branche / Brand");

  if (hasText(local.timeframe)) completed.push("Zeitraum");
  else missing.push("Zeitraum");

  if (hasText(local.platforms)) completed.push("Plattformen");
  else missing.push("Plattformen");

  return { missing, completed };
}

function evaluateInputsForTool(
  toolId: string,
  prepared: AgentPreparedInputs | null,
  local: ToolLocalInputState
): { missing: string[]; completed: string[] } {
  switch (toolId) {
    case "ai-creator":
      return evaluateAiCreatorInputs(local);
    case "img-to-video":
      return evaluateImgToVideoInputs(local, prepared);
    case "text-to-video":
      return evaluateTextToVideoInputs(local, prepared);
    case "viral-hook":
      return evaluateViralHookInputs(local);
    case "content-calendar":
      return evaluateContentCalendarInputs(local);
    default:
      if (!prepared) return { missing: [], completed: [] };
      return prepared.inputChecklist.reduce(
        (acc, item) => {
          if (item.required) acc.missing.push(item.label);
          else acc.completed.push(item.label);
          return acc;
        },
        { missing: [] as string[], completed: [] as string[] }
      );
  }
}

function isSafetyBlocked(toolId: string, local: ToolLocalInputState): boolean {
  if (toolId !== "ai-creator") return false;
  return Boolean(local.hasCharacterDraft && !local.hasConsent);
}

function resolveSafeCtaLabel(status: ToolActionReadinessStatus): string {
  switch (status) {
    case "missing_inputs":
    case "not_started":
      return "Briefing vervollständigen";
    case "ready_preview":
      return "Vorschau prüfen";
    case "blocked_safety":
      return "Eingaben prüfen";
    case "blocked_provider_disabled":
      return "Vorbereitung fortsetzen";
    default:
      return "Eingaben prüfen";
  }
}

function resolveRecommendedNextStep(
  status: ToolActionReadinessStatus,
  missing: string[],
  prepared: AgentPreparedInputs | null
): string {
  if (status === "blocked_safety") {
    return "Consent bestätigen, bevor Upload oder Training vorbereitet werden.";
  }
  if (missing.length > 0) {
    return `Fehlt noch: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? " …" : ""}.`;
  }
  if (status === "ready_preview") {
    return "Briefing ist vollständig — Vorschau prüfen, ohne Generierung oder Upload.";
  }
  return prepared?.safeNextStep ?? "Vorbereitung fortsetzen.";
}

function resolveOutputExpectation(
  toolId: string,
  prepared: AgentPreparedInputs | null
): string | null {
  if (!prepared) return null;
  if (toolId === "viral-hook") {
    return "Hook-Varianten (Text) — kein Galerie- oder Video-Output.";
  }
  if (toolId === "content-calendar") {
    return "Kalender- und Ideenstruktur — kein automatisches Posting.";
  }
  return prepared.outputExpectation;
}

function hasAnyLocalInput(local: ToolLocalInputState): boolean {
  return Object.values(local).some((value) => {
    if (typeof value === "boolean") return value;
    return hasText(typeof value === "string" ? value : null);
  });
}

export function buildToolActionReadiness(
  prepared: AgentPreparedInputs | null,
  local: ToolLocalInputState = {},
  options: ToolActionReadinessOptions = {}
): ToolActionReadiness {
  const toolId = prepared?.toolId ?? options.toolId ?? "unknown";
  const providerDisabled = isProvidersDisabledForReadiness(toolId, options);
  const effectiveLocal = resolveEffectiveLocalState(toolId, prepared, local);
  const { missing, completed } = evaluateInputsForTool(toolId, prepared, effectiveLocal);

  let status: ToolActionReadinessStatus;

  if (!prepared && !hasAnyLocalInput(effectiveLocal)) {
    status = "not_started";
  } else if (isSafetyBlocked(toolId, effectiveLocal)) {
    status = "blocked_safety";
  } else if (missing.length > 0) {
    status = "missing_inputs";
  } else if (providerDisabled) {
    status = "ready_preview";
  } else {
    status = "ready_preview";
  }

  const safeCtaLabel = resolveSafeCtaLabel(status);
  const canExecute = !providerDisabled && missing.length === 0 && status === "ready_preview";

  const readiness: ToolActionReadiness = {
    toolId,
    status,
    missingRequiredInputs: missing,
    completedInputs: completed,
    recommendedNextStep: resolveRecommendedNextStep(status, missing, prepared),
    safeCtaLabel,
    blockedReason: providerDisabled ? READINESS_EXECUTION_DISABLED_MESSAGE : null,
    providerDisabled,
    canNavigate: true,
    canExecute,
    executionDisabledMessage: providerDisabled
      ? READINESS_EXECUTION_DISABLED_MESSAGE
      : prepared?.disabledExecutionMessage ?? READINESS_EXECUTION_DISABLED_MESSAGE,
    statusLabel: STATUS_LABELS[status],
    outputExpectation: resolveOutputExpectation(toolId, prepared),
  };

  return readiness;
}

export function isReadinessStateSafe(readiness: ToolActionReadiness): boolean {
  const serialized = JSON.stringify(readiness);
  if (serialized.length > 16_000) return false;
  if (FORBIDDEN_READINESS_PATTERNS.some((p) => p.test(serialized))) return false;
  if (!isSafeReadinessCtaLabel(readiness.safeCtaLabel)) return false;
  return true;
}

export function isSafeReadinessCtaLabel(label: string): boolean {
  const lower = label.trim().toLowerCase();
  if (/jetzt generieren|training starten|upload starten|credits abbuchen|video erstellen/.test(lower)) {
    return false;
  }
  return READINESS_SAFE_CTA_LABELS.some((allowed) => allowed.toLowerCase() === lower);
}

export function buildImgToVideoLocalState(input: {
  imageUrl?: string;
  prompt?: string;
  aspectRatio?: string | null;
}): ToolLocalInputState {
  return {
    imageUrl: input.imageUrl,
    motionPrompt: input.prompt,
    prompt: input.prompt,
    aspectRatio: input.aspectRatio,
  };
}

export function buildTextToVideoLocalState(input: {
  prompt?: string;
  aspectRatio?: string | null;
}): ToolLocalInputState {
  return {
    prompt: input.prompt,
    aspectRatio: input.aspectRatio,
  };
}

export function buildAiCreatorLocalState(input: {
  characters: Array<{
    consentConfirmed?: boolean;
    trainingStatus?: string;
  }>;
  handoffReady?: boolean;
  uploadShellPending?: boolean;
}): ToolLocalInputState {
  const { characters } = input;
  return {
    hasCharacterDraft: characters.length > 0,
    hasConsent: characters.some((c) => Boolean(c.consentConfirmed)),
    handoffReady:
      input.handoffReady ??
      characters.some((c) => (c.trainingStatus ?? "draft") === "handoff_ready"),
    uploadShellPending:
      input.uploadShellPending ??
      characters.some((c) => (c.trainingStatus ?? "").includes("upload_pending")),
  };
}

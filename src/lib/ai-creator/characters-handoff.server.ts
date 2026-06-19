import type { CharacterType } from "@/lib/ai-creator/types";
import type { CharactersHandoffRow } from "@/lib/ai-creator/characters-list.server";
import {
  AI_CREATOR_HANDOFF_SOURCE_STATUS,
  AI_CREATOR_HANDOFF_STATUS,
  CHARACTER_HANDOFF_ALREADY_READY_MESSAGE,
  CHARACTER_HANDOFF_BLOCKED_MESSAGE,
} from "@/lib/ai-creator/characters-handoff-policy";

export type HandoffReadinessIssue =
  | "missing_name"
  | "missing_character_type"
  | "missing_trigger_or_brief"
  | "missing_persona_brief"
  | "missing_consent"
  | "not_draft"
  | "already_handoff_ready"
  | "has_lora"
  | "has_training_job";

const ISSUE_MESSAGES: Record<HandoffReadinessIssue, string> = {
  missing_name: "Name fehlt",
  missing_character_type: "Character-Typ fehlt",
  missing_trigger_or_brief: "Trigger Word oder Persona-Briefing fehlt",
  missing_persona_brief: "Beschreibung oder Stil/Nische fehlt",
  missing_consent: "Consent fehlt",
  not_draft: "Nur Entwürfe können vorbereitet werden",
  already_handoff_ready: "Bereits für Upload vorbereitet",
  has_lora: "Character ist bereits an einen Workflow gebunden",
  has_training_job: "Training ist bereits gestartet",
};

export type HandoffReadinessInput = {
  name?: string | null;
  description?: string | null;
  triggerWord?: string | null;
  trigger_word?: string | null;
  characterType?: CharacterType | "unknown" | null;
  character_type?: CharacterType | null;
  source?: string | null;
  trainingStatus?: string | null;
  status?: string | null;
  consentConfirmed?: boolean;
  consent_confirmed?: boolean | null;
  consentConfirmedAt?: string | null;
  consent_confirmed_at?: string | null;
  loraRef?: string | null;
  lora_ref?: string | null;
  trainingJobId?: string | null;
  training_job_id?: string | null;
  niche?: string | null;
  style?: string | null;
  tone?: string | null;
  target_audience?: string | null;
};

export type HandoffReadinessResult = {
  ready: boolean;
  issues: HandoffReadinessIssue[];
  messages: string[];
};

const MIN_BRIEF_LENGTH = 8;

function resolveCharacterType(input: HandoffReadinessInput): CharacterType | null {
  const raw = input.character_type ?? input.characterType;
  if (raw === "self" || raw === "fictional") return raw;
  if (input.source === "uploaded") return "self";
  if (input.source === "generated") return "fictional";
  return null;
}

function hasTriggerOrSubstitute(input: HandoffReadinessInput): boolean {
  const trigger = (input.trigger_word ?? input.triggerWord ?? "").trim();
  if (trigger.length > 0) return true;

  const description = (input.description ?? "").trim();
  if (description.length >= MIN_BRIEF_LENGTH) return true;

  const niche = (input.niche ?? "").trim();
  const style = (input.style ?? "").trim();
  const tone = (input.tone ?? "").trim();
  return niche.length > 0 || style.length > 0 || tone.length > 0;
}

function hasPersonaBrief(input: HandoffReadinessInput): boolean {
  const description = (input.description ?? "").trim();
  if (description.length >= MIN_BRIEF_LENGTH) return true;

  const niche = (input.niche ?? "").trim();
  const style = (input.style ?? "").trim();
  const tone = (input.tone ?? "").trim();
  const targetAudience = (input.target_audience ?? "").trim();
  return (
    niche.length > 0 ||
    style.length > 0 ||
    tone.length > 0 ||
    targetAudience.length > 0
  );
}

/** Client- and server-safe handoff readiness evaluation. */
export function evaluateHandoffReadiness(
  input: HandoffReadinessInput
): HandoffReadinessResult {
  const issues: HandoffReadinessIssue[] = [];
  const status = input.status ?? input.trainingStatus ?? AI_CREATOR_HANDOFF_SOURCE_STATUS;

  if (status === AI_CREATOR_HANDOFF_STATUS) {
    issues.push("already_handoff_ready");
  } else if (status !== AI_CREATOR_HANDOFF_SOURCE_STATUS) {
    issues.push("not_draft");
  }

  const loraRef = (input.lora_ref ?? input.loraRef ?? "").trim();
  if (loraRef) {
    issues.push("has_lora");
  }

  const trainingJobId = (input.training_job_id ?? input.trainingJobId ?? "").trim();
  if (trainingJobId) {
    issues.push("has_training_job");
  }

  const name = (input.name ?? "").trim();
  if (!name) {
    issues.push("missing_name");
  }

  if (!resolveCharacterType(input)) {
    issues.push("missing_character_type");
  }

  const consentConfirmed =
    input.consent_confirmed === true || input.consentConfirmed === true;
  const consentAt = input.consent_confirmed_at ?? input.consentConfirmedAt ?? null;
  if (!consentConfirmed || !consentAt) {
    issues.push("missing_consent");
  }

  if (!hasTriggerOrSubstitute(input)) {
    issues.push("missing_trigger_or_brief");
  }

  if (!hasPersonaBrief(input)) {
    issues.push("missing_persona_brief");
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    ready: uniqueIssues.length === 0,
    issues: uniqueIssues,
    messages: uniqueIssues.map((issue) => ISSUE_MESSAGES[issue]),
  };
}

export type HandoffEligibilityResult =
  | { ok: true; readiness: HandoffReadinessResult }
  | {
      ok: false;
      error: string;
      status: number;
      code: string;
      issues: HandoffReadinessIssue[];
    };

export function assertHandoffEligible(row: CharactersHandoffRow): HandoffEligibilityResult {
  const readiness = evaluateHandoffReadiness({
    name: row.name,
    description: row.description,
    trigger_word: row.trigger_word,
    character_type: row.character_type,
    source: row.source,
    status: row.status,
    consent_confirmed: row.consent_confirmed,
    consent_confirmed_at: row.consent_confirmed_at,
    lora_ref: row.lora_ref,
    training_job_id: row.training_job_id,
    niche: row.niche,
    style: row.style,
    tone: row.tone,
    target_audience: row.target_audience,
  });

  if (readiness.issues.includes("already_handoff_ready")) {
    return {
      ok: false,
      error: CHARACTER_HANDOFF_ALREADY_READY_MESSAGE,
      status: 409,
      code: "handoff_already_ready",
      issues: readiness.issues,
    };
  }

  if (
    readiness.issues.includes("not_draft") ||
    readiness.issues.includes("has_lora") ||
    readiness.issues.includes("has_training_job")
  ) {
    return {
      ok: false,
      error: CHARACTER_HANDOFF_BLOCKED_MESSAGE,
      status: 409,
      code: "handoff_not_allowed",
      issues: readiness.issues,
    };
  }

  if (!readiness.ready) {
    return {
      ok: false,
      error: "Entwurf ist noch nicht vollständig genug für die Upload-Vorbereitung.",
      status: 400,
      code: "handoff_not_ready",
      issues: readiness.issues,
    };
  }

  return { ok: true, readiness };
}

export function buildHandoffStatusUpdate(): {
  status: typeof AI_CREATOR_HANDOFF_STATUS;
  updated_at: string;
} {
  return {
    status: AI_CREATOR_HANDOFF_STATUS,
    updated_at: new Date().toISOString(),
  };
}

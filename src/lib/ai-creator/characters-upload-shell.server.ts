import type { CharactersHandoffRow } from "@/lib/ai-creator/characters-list.server";
import {
  AI_CREATOR_UPLOAD_SHELL_SOURCE_STATUS,
  AI_CREATOR_UPLOAD_SHELL_STATUS,
  CHARACTER_UPLOAD_SHELL_ALREADY_READY_MESSAGE,
  CHARACTER_UPLOAD_SHELL_BLOCKED_MESSAGE,
} from "@/lib/ai-creator/characters-upload-shell-policy";
import { areProvidersExplicitlyDisabled } from "@/lib/environment-safety.server";

export type UploadShellEligibilityIssue =
  | "missing_consent"
  | "not_handoff_ready"
  | "already_upload_pending"
  | "has_lora"
  | "has_training_job";

export type UploadShellEligibilityResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      status: number;
      code: string;
      issues: UploadShellEligibilityIssue[];
    };

export type UploadShellResponseMeta = {
  ready: true;
  providerExecution: "disabled" | "shell_only";
  trainingStarted: false;
  uploadsStarted: false;
};

export function buildUploadShellResponseMeta(): UploadShellResponseMeta {
  return {
    ready: true,
    providerExecution: areProvidersExplicitlyDisabled() ? "disabled" : "shell_only",
    trainingStarted: false,
    uploadsStarted: false,
  };
}

export function assertUploadShellEligible(
  row: CharactersHandoffRow
): UploadShellEligibilityResult {
  const issues: UploadShellEligibilityIssue[] = [];
  const status = row.status ?? "draft";

  if (status === AI_CREATOR_UPLOAD_SHELL_STATUS) {
    issues.push("already_upload_pending");
  } else if (status !== AI_CREATOR_UPLOAD_SHELL_SOURCE_STATUS) {
    issues.push("not_handoff_ready");
  }

  if (row.lora_ref?.trim()) {
    issues.push("has_lora");
  }

  if (row.training_job_id?.trim()) {
    issues.push("has_training_job");
  }

  if (row.consent_confirmed !== true || !row.consent_confirmed_at) {
    issues.push("missing_consent");
  }

  if (issues.includes("already_upload_pending")) {
    return {
      ok: false,
      error: CHARACTER_UPLOAD_SHELL_ALREADY_READY_MESSAGE,
      status: 409,
      code: "upload_shell_already_ready",
      issues,
    };
  }

  if (
    issues.includes("not_handoff_ready") ||
    issues.includes("has_lora") ||
    issues.includes("has_training_job")
  ) {
    return {
      ok: false,
      error: CHARACTER_UPLOAD_SHELL_BLOCKED_MESSAGE,
      status: 409,
      code: "upload_shell_not_allowed",
      issues,
    };
  }

  if (issues.includes("missing_consent")) {
    return {
      ok: false,
      error: "Consent muss vor der Upload-Vorbereitung gespeichert sein.",
      status: 400,
      code: "upload_shell_missing_consent",
      issues,
    };
  }

  return { ok: true };
}

export function buildUploadShellStatusUpdate(): {
  status: typeof AI_CREATOR_UPLOAD_SHELL_STATUS;
  updated_at: string;
} {
  return {
    status: AI_CREATOR_UPLOAD_SHELL_STATUS,
    updated_at: new Date().toISOString(),
  };
}

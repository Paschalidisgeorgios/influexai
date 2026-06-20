import type { PostgrestError } from "@supabase/supabase-js";

export const GENERATION_SAVE_ERROR_CODE = "GENERATION_SAVE_FAILED";

export const GENERATIONS_PERMISSION_DENIED_CODE =
  "GENERATIONS_PERMISSION_DENIED";

export type GenerationSaveErrorDetails = {
  code: string;
  pgCode?: string;
  userMessage: string;
  hint?: string;
};

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

/**
 * Maps Supabase/Postgres insert failures to safe user + diagnostic messages.
 * Never includes secrets or row payloads.
 */
export function classifyGenerationSaveError(
  error: PostgrestError | null | undefined
): GenerationSaveErrorDetails {
  const pgCode = error?.code?.trim();
  const message = error?.message?.trim() ?? "";

  if (pgCode === "42501" || message.includes("permission denied for table generations")) {
    return {
      code: GENERATIONS_PERMISSION_DENIED_CODE,
      pgCode,
      userMessage: "Generierung konnte nicht gespeichert werden.",
      hint:
        "Staging DB lacks GRANT on public.generations — apply migration 068 or scripts/apply-generations-sql-editor.sql",
    };
  }

  if (pgCode === "42P01" || message.includes("does not exist")) {
    return {
      code: GENERATION_SAVE_ERROR_CODE,
      pgCode,
      userMessage: "Generierung konnte nicht gespeichert werden.",
      hint: "Table public.generations missing — run supabase db push on staging",
    };
  }

  if (pgCode === "23503") {
    return {
      code: GENERATION_SAVE_ERROR_CODE,
      pgCode,
      userMessage: "Generierung konnte nicht gespeichert werden.",
      hint: "generations.user_id FK — auth user missing in staging",
    };
  }

  return {
    code: GENERATION_SAVE_ERROR_CODE,
    pgCode,
    userMessage: "Generierung konnte nicht gespeichert werden.",
    hint: message ? message.slice(0, 120) : undefined,
  };
}

export class GenerationSaveError extends Error {
  readonly details: GenerationSaveErrorDetails;

  constructor(error: PostgrestError | null | undefined) {
    const details = classifyGenerationSaveError(error);
    super(details.userMessage);
    this.name = "GenerationSaveError";
    this.details = details;
  }
}

export function toGenerationSaveError(error: unknown): GenerationSaveError {
  if (error instanceof GenerationSaveError) return error;
  if (isPostgrestError(error)) return new GenerationSaveError(error);
  return new GenerationSaveError(null);
}

/**
 * Maps canvas/API failures to user-facing German messages.
 * Used by ControlNode — never throws; always returns a safe string.
 */
export type CanvasApiErrorCode =
  | "timeout"
  | "offline"
  | "unauthorized"
  | "insufficient_credits"
  | "rate_limit"
  | "provider_error"
  | "unknown";

export function classifyCanvasApiError(err: unknown): CanvasApiErrorCode {
  if (err instanceof DOMException && err.name === "AbortError") return "timeout";
  if (err instanceof TypeError && /fetch|network|failed/i.test(err.message)) {
    return "offline";
  }
  if (err instanceof CanvasGenerationError) return err.code;
  return "unknown";
}

export class CanvasGenerationError extends Error {
  readonly code: CanvasApiErrorCode;
  readonly status?: number;
  readonly creditsRefunded: boolean;

  constructor(
    message: string,
    code: CanvasApiErrorCode,
    options?: { status?: number; creditsRefunded?: boolean }
  ) {
    super(message);
    this.name = "CanvasGenerationError";
    this.code = code;
    this.status = options?.status;
    this.creditsRefunded = options?.creditsRefunded ?? true;
  }
}

const USER_MESSAGES: Record<CanvasApiErrorCode, string> = {
  timeout:
    "API-Timeout — Der Dienst antwortet nicht rechtzeitig. Deine Coins wurden nicht abgezogen.",
  offline:
    "Verbindungsfehler — Bitte prüfe deine Internetverbindung. Deine Coins wurden nicht abgezogen.",
  unauthorized:
    "Sitzung abgelaufen — Bitte melde dich erneut an. Deine Coins wurden nicht abgezogen.",
  insufficient_credits:
    "Nicht genug Credits — Bitte lade dein Guthaben auf.",
  rate_limit:
    "Zu viele Anfragen — Bitte warte einen Moment und versuche es erneut. Deine Coins wurden nicht abgezogen.",
  provider_error:
    "API vorübergehend offline — Bitte versuche es später erneut. Deine Coins wurden erstattet.",
  unknown:
    "Generierung fehlgeschlagen — Deine Coins wurden erstattet.",
};

export function userMessageForCanvasError(err: unknown): string {
  const code = classifyCanvasApiError(err);
  if (err instanceof CanvasGenerationError && err.message) {
    return err.message;
  }
  return USER_MESSAGES[code];
}

export function shouldRefundCredits(err: unknown): boolean {
  if (err instanceof CanvasGenerationError) {
    return err.creditsRefunded;
  }
  const code = classifyCanvasApiError(err);
  return code !== "insufficient_credits" && code !== "unauthorized";
}

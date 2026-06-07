import type { AuthError, User } from "@supabase/supabase-js";

const EMAIL_EXISTS_PATTERNS = [
  /already registered/i,
  /already exists/i,
  /user already registered/i,
  /email address is already registered/i,
  /email already registered/i,
  /duplicate/i,
  /already been registered/i,
];

const EMAIL_EXISTS_ERROR_CODES = new Set([
  "user_already_exists",
  "email_exists",
]);

function messageIndicatesExistingEmail(message: string): boolean {
  return EMAIL_EXISTS_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Detects duplicate-email signup attempts from Supabase signUp response.
 * Uses known error messages/codes and the empty-identities heuristic when
 * email confirmations hide explicit "already registered" errors.
 */
export function isSignupEmailAlreadyRegistered(params: {
  error?: AuthError | null;
  user?: User | null;
  session?: unknown | null;
}): boolean {
  const { error, user, session } = params;

  if (error) {
    if (error.code && EMAIL_EXISTS_ERROR_CODES.has(error.code)) {
      return true;
    }
    if (messageIndicatesExistingEmail(error.message)) {
      return true;
    }
  }

  /* Supabase: existing email often returns user with identities: [] and no session. */
  if (user && !session && (!user.identities || user.identities.length === 0)) {
    return true;
  }

  return false;
}

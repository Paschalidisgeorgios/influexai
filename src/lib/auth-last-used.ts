export const LAST_AUTH_PROVIDER_KEY = "influexai_last_auth_provider";

export type LastAuthProvider = "google" | "email";

export function getLastAuthProvider(): LastAuthProvider | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(LAST_AUTH_PROVIDER_KEY);
    return value === "google" || value === "email" ? value : null;
  } catch {
    return null;
  }
}

export function setLastAuthProvider(provider: LastAuthProvider): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_AUTH_PROVIDER_KEY, provider);
  } catch {
    /* ignore */
  }
}

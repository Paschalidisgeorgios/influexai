import { createHash, randomBytes } from "crypto";

export const API_KEY_PREFIX = "inf_live_";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(16).toString("hex")}`;
}

export function maskApiKey(prefix: string): string {
  return `inf_...${prefix}`;
}

export function isValidApiKeyFormat(key: string): boolean {
  return (
    key.startsWith(API_KEY_PREFIX) && key.length === API_KEY_PREFIX.length + 32
  );
}

/** OAuth client secret (`AKOOL_CLIENT_SECRET`; legacy alias `AKOOL_API_KEY`). */
export function getAkoolClientSecret(): string | undefined {
  const secret = process.env.AKOOL_CLIENT_SECRET?.trim();
  if (secret) return secret;
  return process.env.AKOOL_API_KEY?.trim();
}

export function isAkoolConfigured(): boolean {
  if (process.env.AKOOL_API_KEY?.trim()) return true;
  return !!(process.env.AKOOL_CLIENT_ID?.trim() && getAkoolClientSecret());
}

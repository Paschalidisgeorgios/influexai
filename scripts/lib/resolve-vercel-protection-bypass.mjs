/**
 * Resolve Vercel Deployment Protection bypass secret (never log value).
 */
import { execSync } from "child_process";

export function resolveVercelProtectionBypass(env = process.env) {
  const fromEnv =
    env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ??
    env.VERCEL_PROTECTION_BYPASS?.trim();
  if (fromEnv) return fromEnv;

  try {
    const out = execSync("npx vercel project protection influexai --format json 2>&1", {
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const jsonStart = out.indexOf("{");
    if (jsonStart < 0) return null;
    const parsed = JSON.parse(out.slice(jsonStart));
    const keys = Object.keys(parsed.protectionBypass ?? {});
    return keys[0] ?? null;
  } catch {
    return null;
  }
}

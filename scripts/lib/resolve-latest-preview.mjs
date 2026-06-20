/**
 * Resolve latest Ready Preview deployment URL via Vercel CLI (no --prod).
 */
import { execSync } from "child_process";

const PREVIEW_HOST_RE =
  /https:\/\/influexai-[a-z0-9]+-paschalidisgeorgios-projects\.vercel\.app/;

export function resolveLatestPreviewUrl(fallback) {
  try {
    const out = execSync("npx vercel ls", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const lines = out.split(/\r?\n/);
    for (const line of lines) {
      if (!line.includes("Preview") || !line.includes("Ready")) continue;
      const match = line.match(PREVIEW_HOST_RE);
      if (match) return match[0];
    }
  } catch {
    /* fall through */
  }
  return fallback ?? null;
}

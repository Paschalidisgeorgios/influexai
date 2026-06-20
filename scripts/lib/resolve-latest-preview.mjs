/**
 * Resolve latest Ready Preview deployment URL via Vercel CLI (no --prod).
 */
import { execSync } from "child_process";

const PREVIEW_URL_RE =
  /https:\/\/influexai-[a-z0-9]+-paschalidisgeorgios-projects\.vercel\.app/;

export function resolveLatestPreviewUrl(fallback) {
  try {
    const out = execSync("npx vercel ls 2>&1", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    const tableSection = out.split("> To display")[0] ?? out;
    for (const line of tableSection.split(/\r?\n/)) {
      if (!/\bPreview\b/.test(line) || !/\bReady\b/.test(line)) continue;
      if (/\bProduction\b/.test(line)) continue;
      const match = line.match(PREVIEW_URL_RE);
      if (match) return match[0];
    }
  } catch {
    /* fall through */
  }
  return fallback ?? null;
}

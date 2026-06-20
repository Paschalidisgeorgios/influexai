/**
 * Preview provider guard probe — POST /api/generate-image, no provider call expected.
 */
import { spawnSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export function probePreviewProviderGuard(previewBaseUrl) {
  const base = previewBaseUrl.replace(/\/$/, "");
  const body = JSON.stringify({
    prompt: "guard probe only — no generation",
    category: "creator",
    skipPromptEnhancement: true,
  });
  const outFile = join(tmpdir(), `guard-out-${Date.now()}.json`);

  const result = spawnSync(
    "npx",
    [
      "vercel",
      "curl",
      `${base}/api/generate-image`,
      "--",
      "-X",
      "POST",
      "-H",
      "Content-Type: application/json",
      "--data-raw",
      body,
      "-s",
      "-o",
      outFile,
    ],
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], shell: process.platform === "win32" }
  );

  let raw = "";
  try {
    raw = readFileSync(outFile, "utf8");
  } catch {
    raw = (result.stdout ?? "").trim();
  } finally {
    try {
      unlinkSync(outFile);
    } catch {
      /* ignore */
    }
  }

  if (!raw && result.status !== 0) {
    return {
      pass: false,
      error: (result.stderr || result.stdout || "vercel curl failed").slice(0, 200),
      secrets_logged: false,
    };
  }

  let parsed = null;
  try {
    const jsonStart = raw.indexOf("{");
    parsed = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw);
  } catch {
    parsed = null;
  }

  const code = parsed?.code ?? null;
  const pass =
    parsed?.success === false &&
    (code === "PROVIDERS_DISABLED" ||
      String(parsed?.message ?? parsed?.error ?? "").toLowerCase().includes("disabled"));

  return {
    pass,
    success: parsed?.success ?? null,
    code,
    has_generation_id: Boolean(parsed?.generationId),
    has_image_url: Boolean(parsed?.imageUrl),
    secrets_logged: false,
  };
}

/** POST {} — expect 400 validation, not PROVIDERS_DISABLED (guard open probe). */
export function probePreviewGenerateApiOpen(previewBaseUrl) {
  const base = previewBaseUrl.replace(/\/$/, "");
  const outFile = join(tmpdir(), `open-guard-${Date.now()}.json`);

  const result = spawnSync(
    "npx",
    [
      "vercel",
      "curl",
      `${base}/api/generate-image`,
      "--",
      "-X",
      "POST",
      "-H",
      "Content-Type: application/json",
      "--data-raw",
      "{}",
      "-s",
      "-o",
      outFile,
    ],
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], shell: process.platform === "win32" }
  );

  let raw = "";
  try {
    raw = readFileSync(outFile, "utf8");
  } catch {
    raw = (result.stdout ?? "").trim();
  } finally {
    try {
      unlinkSync(outFile);
    } catch {
      /* ignore */
    }
  }

  let parsed = null;
  try {
    const jsonStart = raw.indexOf("{");
    parsed = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw);
  } catch {
    parsed = null;
  }

  const code = parsed?.code ?? null;
  const open = code !== "PROVIDERS_DISABLED";

  return {
    open,
    code,
    status_hint: parsed?.error ? "validation_or_auth" : null,
    secrets_logged: false,
  };
}

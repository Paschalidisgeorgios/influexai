/**
 * Production provider guard probe — POST /api/generate-image via public domain.
 */
import { spawnSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export function probeProductionProviderGuard(baseUrl) {
  const base = baseUrl.replace(/\/$/, "");
  const body = JSON.stringify({
    prompt: "production dry-run guard probe only — no generation",
    category: "creator",
    skipPromptEnhancement: true,
  });
  const outFile = join(tmpdir(), `prod-guard-${Date.now()}.json`);

  const result = spawnSync(
    "curl",
    [
      "-s",
      "-X",
      "POST",
      `${base}/api/generate-image`,
      "-H",
      "Content-Type: application/json",
      "--data-raw",
      body,
      "-o",
      outFile,
      "-w",
      "%{http_code}",
    ],
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], shell: process.platform === "win32" }
  );

  const httpStatus = (result.stdout ?? "").trim().slice(-3);
  let raw = "";
  try {
    raw = readFileSync(outFile, "utf8");
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
      http_status: httpStatus || null,
      error: (result.stderr || "curl failed").slice(0, 200),
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
      String(parsed?.message ?? parsed?.error ?? "")
        .toLowerCase()
        .includes("disabled"));

  return {
    pass,
    http_status: httpStatus || null,
    success: parsed?.success ?? null,
    code,
    has_generation_id: Boolean(parsed?.generationId),
    has_image_url: Boolean(parsed?.imageUrl),
    secrets_logged: false,
  };
}

/** Expect providers open — guard must NOT return PROVIDERS_DISABLED. */
export function probeProductionProviderGuardOpen(baseUrl) {
  const closed = probeProductionProviderGuard(baseUrl);
  const open = closed.code !== "PROVIDERS_DISABLED";
  return {
    pass: open,
    providers_disabled: closed.code === "PROVIDERS_DISABLED",
    http_status: closed.http_status,
    code: closed.code,
    secrets_logged: false,
  };
}

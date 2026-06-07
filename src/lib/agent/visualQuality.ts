import type { VisualQAReport, GenerationHardConstraints } from "./types";

// TODO: echtes Vision-Modell anbinden (Claude Vision, GPT-4V, oder fal.ai QA)
// TODO: Bildanalyse für Hände/Finger/Geschlecht/Gesicht/Text/Logo
// Aktuell: Mock-Implementierung die immer passed zurückgibt

export async function runVisualQA(
  _imageUrl: string,
  _constraints: GenerationHardConstraints
): Promise<VisualQAReport> {
  // MOCK — ersetzt durch echte Vision-API
  console.warn("[visualQA] Mock-Implementierung aktiv. Echte QA fehlt.");

  return {
    passed: true,
    genderMatches: true,
    subjectCountMatches: true,
    anatomyOk: true,
    handsOk: true,
    faceOk: true,
    textOk: true,
    logoOk: true,
    formatOk: true,
    brandFit: "medium",
    issues: [],
    repairPrompt: undefined,
  };
}

export function buildRepairPrompt(
  report: VisualQAReport,
  constraints: GenerationHardConstraints,
  originalPrompt: string
): string {
  const fixes: string[] = [];

  if (!report.genderMatches) {
    const g = constraints.subjectGenderPresentation;
    fixes.push(
      g === "female"
        ? "Regenerate with one clearly female-presenting adult woman. No male subjects, no beards, no masculine features."
        : "Regenerate with one clearly male-presenting adult man."
    );
  }
  if (!report.handsOk) {
    fixes.push(
      "Fix hand anatomy: exactly 5 fingers per hand, no extra fingers, natural proportions."
    );
  }
  if (!report.textOk) {
    fixes.push("Remove all text overlays, typography, letters from the image.");
  }
  if (!report.faceOk) {
    fixes.push(
      "Fix facial features: symmetric eyes, natural proportions, no distortion."
    );
  }

  return fixes.length > 0
    ? `${originalPrompt}. IMPORTANT FIXES: ${fixes.join(" ")}`
    : originalPrompt;
}

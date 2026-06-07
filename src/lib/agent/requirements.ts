import type {
  GenerationRequirements,
  GenerationHardConstraints,
  AgentIntent,
} from "./types";

export function parseRequirements(
  prompt: string,
  intent: AgentIntent
): GenerationRequirements {
  const p = prompt.toLowerCase();
  const constraints: GenerationHardConstraints = {};

  // Geschlecht
  if (/\bfrau\b|woman|female|sie\b/i.test(p))
    constraints.subjectGenderPresentation = "female";
  else if (/\bmann\b|\bman\b|male|er\b/i.test(p))
    constraints.subjectGenderPresentation = "male";

  // Anzahl Personen
  if (/\beine\b.*\bperson\b|\beinzel\b|\bone person\b/i.test(p))
    constraints.subjectCount = 1;
  if (/\bzwei\b|\b2 person\b/i.test(p)) constraints.subjectCount = 2;

  // Kein Text/Logo
  if (/kein.*text|ohne.*text|no.*text/i.test(p))
    constraints.mustAvoidTextInImage = true;
  if (/kein.*logo|ohne.*logo|no.*logo/i.test(p))
    constraints.mustAvoidLogoInGeneratedImage = true;

  // Anatomie
  if (/hände|finger|hand/i.test(p)) constraints.handsMustBeValid = true;
  if (/gesicht|face/i.test(p)) constraints.faceMustBeClean = true;

  // Verbotene Elemente aus Gender
  if (constraints.subjectGenderPresentation === "female") {
    constraints.forbiddenSubject = [
      "man",
      "male subject",
      "beard",
      "masculine face",
      "extra people",
    ];
  }
  if (constraints.subjectGenderPresentation === "male") {
    constraints.forbiddenSubject = ["extra people", "female only", "woman"];
  }

  const outputType =
    /bild|visual|foto|image/i.test(p)
      ? "image"
      : /video|reel|short/i.test(p)
        ? "video"
        : /kalender|plan/i.test(p)
          ? "calendar"
          : /kampagne|campaign/i.test(p)
            ? "campaign"
            : "text";

  return {
    intent,
    outputType,
    topic: prompt.slice(0, 100),
    hardConstraints: constraints,
    softPreferences: [],
  };
}

import type { GenerationHardConstraints } from "./types";

export function buildImagePrompt(
  basePrompt: string,
  constraints: GenerationHardConstraints
): { positive: string; negative: string } {
  const positive: string[] = [basePrompt];
  const negative: string[] = [
    "distorted anatomy",
    "extra fingers",
    "extra hands",
    "malformed hands",
    "text artifacts",
    "watermark",
    "blurry",
    "low quality",
    "nsfw",
  ];

  // Geschlecht
  if (constraints.subjectGenderPresentation === "female") {
    positive.push(
      "one adult female subject",
      "clearly female-presenting",
      "feminine facial features"
    );
    negative.push("man", "male subject", "beard", "masculine face", "extra people");
  }
  if (constraints.subjectGenderPresentation === "male") {
    positive.push("one adult male subject", "clearly male-presenting");
    negative.push("extra people", "extra persons");
  }

  // Anzahl
  if (constraints.subjectCount === 1) {
    positive.push("single person", "one subject only");
    negative.push("multiple people", "group", "crowd");
  }

  // Text/Logo
  if (constraints.mustAvoidTextInImage) {
    negative.push("text overlay", "typography", "letters", "words", "caption");
  }
  if (constraints.mustAvoidLogoInGeneratedImage) {
    negative.push("logo", "brand mark", "watermark", "trademark");
  }

  // Anatomie
  if (constraints.handsMustBeValid) {
    positive.push("perfect hands", "correct finger count", "natural hands");
    negative.push(
      "extra fingers",
      "6 fingers",
      "fused fingers",
      "deformed hands"
    );
  }
  if (constraints.faceMustBeClean) {
    positive.push("clean face", "natural facial features", "symmetric face");
    negative.push("distorted face", "asymmetric eyes", "deformed features");
  }

  // Verbotene Elemente
  if (constraints.forbiddenSubject?.length) {
    negative.push(...constraints.forbiddenSubject);
  }
  if (constraints.forbiddenElements?.length) {
    negative.push(...constraints.forbiddenElements);
  }

  return {
    positive: positive.join(", "),
    negative: [...new Set(negative)].join(", "),
  };
}

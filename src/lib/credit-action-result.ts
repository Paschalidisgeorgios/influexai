export function insufficientCreditsError(credits: number, required: number) {
  return {
    success: false as const,
    error: "Nicht genug Credits." as const,
    credits,
    required,
  };
}

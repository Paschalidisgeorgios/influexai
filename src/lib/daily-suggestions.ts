export type DailyVideoIdea = {
  title: string;
  hook: string;
  outline: string;
  why_viral: string;
};

export type DailySuggestionsPayload = {
  ideas: DailyVideoIdea[];
};

export function isDailySuggestionsPayload(
  value: unknown
): value is DailySuggestionsPayload {
  if (!value || typeof value !== "object") return false;
  const ideas = (value as DailySuggestionsPayload).ideas;
  return (
    Array.isArray(ideas) &&
    ideas.length > 0 &&
    ideas.every(
      (i) =>
        i &&
        typeof i === "object" &&
        typeof i.title === "string" &&
        typeof i.hook === "string"
    )
  );
}

export function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

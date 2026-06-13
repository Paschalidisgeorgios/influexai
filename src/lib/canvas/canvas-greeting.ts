const FALLBACK_NAME = "Creator";

export type CanvasGreetingParts = {
  /** Text before the highlighted name */
  lead: string;
  /** Highlighted first name (or fallback) */
  name: string;
  /** Motivational tail — partially highlighted in UI */
  tail: string;
};

function greetingSlot(hour: number): Omit<CanvasGreetingParts, "name"> {
  if (hour >= 5 && hour <= 11) {
    return {
      lead: "Guten Morgen, ",
      tail: "! ☕ Ready für neuen Content?",
    };
  }
  if (hour >= 12 && hour <= 17) {
    return {
      lead: "Hallo ",
      tail: "! 👋 Welches Projekt pushen wir heute?",
    };
  }
  if (hour >= 18 && hour <= 22) {
    return {
      lead: "Guten Abend, ",
      tail: "! 🌆 Lass uns die Timeline rocken.",
    };
  }
  return {
    lead: "Wow, um die Zeit noch fleißig, ",
    tail: "? 🔥 Die Nachtschicht zahlt sich aus!",
  };
}

/** Time-of-day greeting for the Infinite Canvas — computed fresh on each call. */
export function getCanvasGreeting(
  displayName?: string | null,
  date: Date = new Date()
): CanvasGreetingParts {
  const trimmed = displayName?.trim();
  const name = trimmed && trimmed.length > 0 ? trimmed : FALLBACK_NAME;
  const slot = greetingSlot(date.getHours());
  return { ...slot, name };
}

export function resolveCanvasFirstName(sources: {
  fullName?: string | null;
  firstName?: string | null;
  email?: string | null;
}): string {
  if (sources.firstName?.trim()) return sources.firstName.trim().split(/\s+/)[0]!;
  if (sources.fullName?.trim()) return sources.fullName.trim().split(/\s+/)[0]!;
  const local = sources.email?.split("@")[0]?.trim();
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  return FALLBACK_NAME;
}

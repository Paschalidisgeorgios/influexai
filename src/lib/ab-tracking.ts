export type AbVariant = "a" | "b";
export type AbEvent = "view" | "signup_click" | "signup_complete";

export async function trackAbEvent(
  event: AbEvent,
  variant?: AbVariant
): Promise<void> {
  try {
    await fetch("/api/ab-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...(variant ? { variant } : {}) }),
      keepalive: event !== "view",
    });
  } catch {
    /* non-blocking */
  }
}

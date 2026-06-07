export type GuardVariant = "default" | "warning" | "consent";

export type GuardConfig = {
  required: boolean;
  type: GuardVariant;
  title: string;
  description: string;
};

export function needsGuard(
  action: string,
  estimatedCredits?: number
): GuardConfig {
  if (["face_swap", "voice_cloning", "avatar_from_face"].includes(action)) {
    return {
      required: true,
      type: "consent",
      title: "Einwilligung erforderlich",
      description:
        "Face Swap, Voice Cloning und KI-Avatare aus echten Gesichtern erfordern deine ausdrückliche Einwilligung. Stelle sicher, dass du die Rechte an dem verwendeten Bild/Audio hast.",
    };
  }

  if (action === "publish_public") {
    return {
      required: true,
      type: "warning",
      title: "Öffentlich veröffentlichen?",
      description:
        "Dieser Inhalt wird öffentlich auf der Plattform sichtbar. Bitte prüfe ihn vor der Veröffentlichung.",
    };
  }

  if ((estimatedCredits ?? 0) > 20) {
    return {
      required: true,
      type: "warning",
      title: `${estimatedCredits} Credits werden verbraucht`,
      description:
        "Diese Aktion verbraucht viele Credits auf einmal. Möchtest du fortfahren?",
    };
  }

  if (action === "legal_high") {
    return {
      required: true,
      type: "warning",
      title: "Rechtlich sensible Inhalte",
      description:
        "Dieser Inhalt hat ein erhöhtes rechtliches Risiko. Bitte prüfe ihn manuell bevor du ihn verwendest.",
    };
  }

  return { required: false, type: "default", title: "", description: "" };
}

import type { AgentChatMessage } from "../types";

export const UGC_CREATOR_STEP1_QUESTION = `Für welches Produkt möchtest du UGC Content erstellen?
Hast du schon ein Produktbild oder eine Produkt-URL?`;

export const UGC_VIDEO_CONFIRM_QUESTION =
  "Soll ich daraus direkt ein UGC-Video erstellen?";

export type UgcFlowPhase =
  | "none"
  | "step1_ask"
  | "step2a_generate"
  | "step2b_redirect"
  | "step3_video"
  | "step3_declined";

const UGC_INTENT =
  /\b(ugc|brand deal|produkt zeigen|authentic content|produktwerbung|produkt-werbung)\b/i;

const URL_PATTERN =
  /https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9][-a-z0-9]*\.(com|de|io|shop|store|co|net|org)\b[^\s]*/i;

const IMAGE_URL_PATTERN =
  /https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?/i;

export function isUgcCreatorIntent(text: string): boolean {
  return UGC_INTENT.test(text);
}

function assistantHistory(history: AgentChatMessage[]): string {
  return history
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .join("\n");
}

function userHistory(history: AgentChatMessage[], userMessage: string): string {
  return [
    ...history.filter((m) => m.role === "user").map((m) => m.content),
    userMessage,
  ].join("\n");
}

export function askedUgcStep1(history: AgentChatMessage[]): boolean {
  const text = assistantHistory(history);
  return (
    text.includes("Produktbild oder eine Produkt-URL") ||
    text.includes("Für welches Produkt möchtest du UGC")
  );
}

export function askedUgcVideoConfirm(history: AgentChatMessage[]): boolean {
  return assistantHistory(history).includes(UGC_VIDEO_CONFIRM_QUESTION);
}

export function userHasProductAssets(text: string): boolean {
  return URL_PATTERN.test(text) || IMAGE_URL_PATTERN.test(text);
}

export function userDeclaresNoAssets(text: string): boolean {
  if (userHasProductAssets(text)) return false;
  return /\b(kein(e|en|er)?\s+(produkt)?bild|ohne\s+bild|hab(e)?\s+kein(en)?\s+(bild|url|link)|nein[\s,.*]{0,20}(bild|url|link)|no\s+image|don't\s+have|hab\s+noch\s+nichts)\b/i.test(
    text
  );
}

export function userWantsUgcVideo(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (/^(nein|no|später|nicht jetzt|erstmal nicht)\b/.test(t)) return false;
  return (
    /^(ja|yes|gerne|bitte|klar|auf jeden fall|mach|unbedingt|ok|okay)\b/.test(
      t
    ) || /\b(ja|yes)\b.*\bvideo\b/i.test(text)
  );
}

export function userDeclinesUgcVideo(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(nein|no|später|nicht jetzt|erstmal nicht|nur das bild)\b/.test(t);
}

export function detectUgcFlowPhase(
  history: AgentChatMessage[],
  userMessage: string
): UgcFlowPhase {
  const combined = [
    ...history.map((m) => m.content),
    userMessage,
  ].join("\n");

  if (!isUgcCreatorIntent(combined)) return "none";

  const step1Asked = askedUgcStep1(history);
  const videoAsked = askedUgcVideoConfirm(history);
  const userText = userHistory(history, userMessage);

  if (!step1Asked && isUgcCreatorIntent(userMessage)) {
    return "step1_ask";
  }

  if (step1Asked && !videoAsked) {
    if (userDeclaresNoAssets(userMessage)) return "step2b_redirect";
    if (userHasProductAssets(userText) || userMessage.trim().length > 8) {
      return "step2a_generate";
    }
    return "step1_ask";
  }

  if (videoAsked) {
    if (userWantsUgcVideo(userMessage)) return "step3_video";
    if (userDeclinesUgcVideo(userMessage)) return "step3_declined";
  }

  return "none";
}

export function buildUgcFlowSystemAppend(phase: UgcFlowPhase): string {
  if (phase === "none") return "";

  const header = `

---
AKTIVER GEFÜHRTER FLOW: UGC Creator (Referenz-Implementation)
`;

  switch (phase) {
    case "step1_ask":
      return `${header}
Phase 1 — Produkt klären:
- Stelle GENAU diese Frage (beide Zeilen, wörtlich):
"${UGC_CREATOR_STEP1_QUESTION}"
- Rufe KEIN Tool auf. Warte auf die Antwort.`;

    case "step2a_generate":
      return `${header}
Phase 2a — Produktbild/URL vorhanden:
- Rufe SOFORT generate_product_preview auf (productName, productUrl und/oder imageUrl aus der Nutzerantwort).
- Zeige das Ergebnis kurz an.
- Stelle DANACH GENAU diese Frage (Ausnahme von der No-Confirmation-Regel):
"${UGC_VIDEO_CONFIRM_QUESTION}"
- Rufe generate_video_from_image NOCH NICHT auf — warte auf Ja/Nein.`;

    case "step2b_redirect":
      return `${header}
Phase 2b — Kein Bild/URL:
- Erkläre in 1 Satz, dass UGC Video einen Upload braucht.
- Rufe ugc_video (Weiterleitungs-Tool) mit passender headline + description auf.
- Kein generate_product_preview.`;

    case "step3_video":
      return `${header}
Phase 3 — Video gewünscht:
- Rufe generate_video_from_image mit der imageUrl aus generate_product_preview auf.
- motionPrompt: authentischer UGC-Stil, Creator präsentiert Produkt, subtile Handbewegung, natürliches Licht, TikTok 9:16.
- Fasse kurz zusammen wenn das Video fertig ist.`;

    case "step3_declined":
      return `${header}
Phase 3 — Kein Video:
- Bestätige freundlich. Das Preview-Bild reicht.
- Optional: ugc_video anbieten für erweiterte UGC-Features im Dashboard.
- Keine weiteren Tools außer optional ugc_video.`;

    default:
      return "";
  }
}

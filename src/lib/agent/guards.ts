export type GuardVariant = "default" | "warning" | "consent";

export const AGENT_SAFETY_BLOCKED_MESSAGE =
  "Dieser Inhalt kann nicht verarbeitet werden.";

export class AgentSafetyError extends Error {
  constructor(message = AGENT_SAFETY_BLOCKED_MESSAGE) {
    super(message);
    this.name = "AgentSafetyError";
  }
}

const NSFW_PHRASE_TERMS = [
  "pornography",
  "pornographic",
  "blowjob",
  "handjob",
  "deepthroat",
  "gangbang",
  "onlyfans",
  "sex tape",
  "sexual intercourse",
  "explicit content",
  "xxx video",
  "nude photo",
  "naked photo",
  "topless photo",
  "erotic photo",
  "erotic video",
  "strip tease",
  "strip-tease",
] as const;

const NSFW_WORD_TERMS = [
  "porn",
  "porno",
  "xxx",
  "nsfw",
  "nude",
  "nudes",
  "naked",
  "topless",
  "erotic",
  "hentai",
  "fetish",
  "orgasm",
  "masturbat",
  "voyeur",
  "bestiality",
  "bestial",
  "nackt",
  "nacktheit",
  "erotik",
  "pornografie",
] as const;

const MINOR_TERMS = [
  "child",
  "children",
  "kid",
  "kids",
  "minor",
  "minors",
  "underage",
  "toddler",
  "infant",
  "preteen",
  "pre-teen",
  "kind",
  "kinder",
  "jugendlich",
  "minderjahrig",
  "minderjährig",
  "loli",
  "shota",
  "pedophil",
  "paedophil",
  "pedo",
  "paedo",
] as const;

const SEXUAL_CONTEXT_TERMS = [
  "sex",
  "sexual",
  "sexy",
  "nude",
  "naked",
  "porn",
  "porno",
  "nsfw",
  "erotic",
  "erotik",
  "nackt",
  "explicit",
  "molest",
  "rape",
  "vergewaltig",
  "abuse",
  "misshand",
] as const;

const EXPLICIT_VIOLENT_TERMS = [
  "nude",
  "naked",
  "porn",
  "porno",
  "nsfw",
  "sexual",
  "sex",
  "erotic",
  "explicit",
  "topless",
  "nackt",
  "rape",
  "vergewaltig",
  "molest",
  "kill",
  "murder",
  "assassinate",
  "torture",
  "gore",
  "violent",
  "violence",
  "gewalt",
  "mord",
  "toten",
  "blutig",
] as const;

const CELEBRITY_PUBLIC_FIGURE_NAMES = [
  "taylor swift",
  "elon musk",
  "donald trump",
  "joe biden",
  "barack obama",
  "kamala harris",
  "vladimir putin",
  "volodymyr zelensky",
  "kim kardashian",
  "kanye west",
  "rihanna",
  "beyonce",
  "justin bieber",
  "selena gomez",
  "ariana grande",
  "billie eilish",
  "emma watson",
  "scarlett johansson",
  "margot robbie",
  "timothee chalamet",
  "tom holland",
  "johnny depp",
  "angelina jolie",
  "brad pitt",
  "leonardo dicaprio",
  "jennifer lawrence",
  "cristiano ronaldo",
  "lionel messi",
  "angela merkel",
  "olaf scholz",
  "robert habeck",
  "friedrich merz",
] as const;

const REAL_PERSON_INDICATORS = [
  "celebrity",
  "celebrities",
  "famous person",
  "real person",
  "public figure",
  "politician",
  "actor",
  "actress",
  "singer",
  "influencer",
  "prominente",
  "prominenter",
  "beruhmt",
  "berühmt",
  "echte person",
  "echter mensch",
  "politiker",
  "politikerin",
  "schauspieler",
  "schauspielerin",
  "sanger",
  "sänger",
  "sangerin",
  "sängerin",
] as const;

function normalizeAgentPrompt(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  return text.includes(phrase);
}

function containsWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function matchesNsfwBlocklist(text: string): boolean {
  if (NSFW_PHRASE_TERMS.some((term) => containsPhrase(text, term))) {
    return true;
  }
  return NSFW_WORD_TERMS.some((term) => containsWord(text, term));
}

function matchesMinorSexualContent(text: string): boolean {
  const hasMinor = MINOR_TERMS.some(
    (term) => containsWord(text, term) || containsPhrase(text, term)
  );
  if (!hasMinor) return false;
  return SEXUAL_CONTEXT_TERMS.some(
    (term) => containsWord(text, term) || containsPhrase(text, term)
  );
}

function matchesCelebrityExplicitContext(text: string): boolean {
  const matchedFigure = CELEBRITY_PUBLIC_FIGURE_NAMES.find((name) =>
    containsPhrase(text, name)
  );
  if (!matchedFigure) return false;
  return EXPLICIT_VIOLENT_TERMS.some(
    (term) => containsWord(text, term) || containsPhrase(text, term)
  );
}

function matchesDeepfakeRealPersonRequest(text: string): boolean {
  if (containsPhrase(text, "deepfake") || containsPhrase(text, "deep fake")) {
    return true;
  }

  const mentionsRealPerson =
    CELEBRITY_PUBLIC_FIGURE_NAMES.some((name) => containsPhrase(text, name)) ||
    REAL_PERSON_INDICATORS.some(
      (term) => containsWord(text, term) || containsPhrase(text, term)
    );

  const hasFaceSwap =
    containsPhrase(text, "face swap") ||
    containsPhrase(text, "faceswap") ||
    containsPhrase(text, "face-swap") ||
    containsPhrase(text, "gesicht tausch") ||
    containsPhrase(text, "gesichter tausch");

  if (hasFaceSwap && mentionsRealPerson) {
    return true;
  }

  const hasImpersonation =
    containsWord(text, "impersonate") ||
    containsPhrase(text, "look like") ||
    containsPhrase(text, "aussehen wie");

  return hasImpersonation && mentionsRealPerson;
}

export function checkAgentInputSafety(prompt: string): void {
  const normalized = normalizeAgentPrompt(prompt);
  if (!normalized) return;

  if (
    matchesNsfwBlocklist(normalized) ||
    matchesMinorSexualContent(normalized) ||
    matchesCelebrityExplicitContext(normalized) ||
    matchesDeepfakeRealPersonRequest(normalized)
  ) {
    throw new AgentSafetyError();
  }
}

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

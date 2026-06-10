/** Default LoRA strength for KI-Influencer content generation (Step D). */
export const LORA_WEIGHT_DEFAULT = 0.65;

export const KI_INFLUENCER_TRAINING_SET_SIZE = 20;

/** Flat package price for the 20-image training set (Step B). */
export const KI_INFLUENCER_TRAINING_SET_CREDITS = 20;

export const KI_INFLUENCER_DEFAULT_TRIGGER = "MYCHAR";

export const KI_INFLUENCER_LORA_STEPS = 1000;

export type CharacterStatus =
  | "draft"
  | "casting"
  | "casting_confirmed"
  | "training_set"
  | "training_set_ready"
  | "training"
  | "ready"
  | "failed";

/** 20 predefined scene variations — identity preserved via Seedream characterMode. */
export const KI_INFLUENCER_TRAINING_VARIATIONS: readonly string[] = [
  "frontal view, neutral expression, natural daylight, casual everyday outfit, plain background",
  "frontal view, warm smile, natural daylight, same person, casual outfit",
  "frontal view, genuine laugh, natural daylight, relaxed posture",
  "half profile facing left, neutral expression, soft daylight, shoulders visible",
  "half profile facing right, neutral expression, soft daylight, shoulders visible",
  "slightly from above, neutral expression, even daylight, head and shoulders",
  "frontal view, neutral expression, golden hour warm sunlight, outdoor setting",
  "half profile left, subtle smile, golden hour light, outdoor bokeh",
  "frontal view, neutral expression, soft indoor window light, cozy cafe atmosphere",
  "frontal view, friendly smile, warm indoor ambient light, modern interior",
  "three-quarter angle left, neutral expression, daylight, business casual blazer outfit",
  "three-quarter angle right, confident smile, daylight, business casual outfit",
  "frontal view, neutral expression, daylight, sporty athleisure outfit",
  "half profile right, laughing naturally, golden hour, outdoor park",
  "slightly from above, soft smile, diffused indoor ceiling light, minimal background",
  "frontal view, calm neutral expression, overcast soft daylight, urban background blur",
  "half profile left, neutral expression, warm cafe interior lighting, seated pose",
  "three-quarter right, neutral expression, golden hour, sporty outfit, outdoor",
  "frontal view, bright smile, golden hour backlight, casual summer outfit",
  "half profile left, laughing, bright daylight, business casual, standing pose",
] as const;

export const KI_INFLUENCER_WIZARD_STEPS = [
  { id: "design", label: "Charakter designen" },
  { id: "dataset", label: "Trainingsset" },
  { id: "train", label: "Training" },
  { id: "content", label: "Content erstellen" },
] as const;

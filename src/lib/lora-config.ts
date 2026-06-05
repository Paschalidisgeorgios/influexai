export type LoraModelType = "portrait" | "style" | "product" | "character";

export type LoraModelStatus = "training" | "ready" | "failed";

export const LORA_TRAINING_CREDITS: Record<LoraModelType, number> = {
  portrait: 50,
  style: 40,
  product: 40,
  character: 50,
};

export const LORA_GENERATION_CREDIT = 2;

export const LORA_MIN_IMAGES = 10;
export const LORA_RECOMMENDED_IMAGES = 20;
export const LORA_MAX_IMAGES = 100;
export const LORA_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const LORA_STEPS_MIN = 500;
export const LORA_STEPS_MAX = 2000;
export const LORA_STEPS_DEFAULT = 1000;

export const LORA_ESTIMATED_MINUTES = "10–15";

export const FAL_LORA_MODELS = {
  PORTRAIT_TRAINER: "fal-ai/flux-lora-portrait-trainer",
  FAST_TRAINER: "fal-ai/flux-lora-fast-training",
  INFERENCE: "fal-ai/flux-lora",
} as const;

export const TRIGGER_WORD_PRESETS = [
  "MYFACE",
  "MYSTYLE",
  "MYPRODUCT",
  "MYBRAND",
  "MYCHAR",
] as const;

export const LORA_TYPE_META: Record<
  LoraModelType,
  {
    credits: number;
    recommended: boolean;
    usesPortraitTrainer: boolean;
    defaultIsStyle: boolean;
    tipKey: string;
  }
> = {
  portrait: {
    credits: 50,
    recommended: true,
    usesPortraitTrainer: true,
    defaultIsStyle: false,
    tipKey: "tip_portrait",
  },
  style: {
    credits: 40,
    recommended: false,
    usesPortraitTrainer: false,
    defaultIsStyle: true,
    tipKey: "tip_style",
  },
  product: {
    credits: 40,
    recommended: false,
    usesPortraitTrainer: false,
    defaultIsStyle: false,
    tipKey: "tip_product",
  },
  character: {
    credits: 50,
    recommended: false,
    usesPortraitTrainer: false,
    defaultIsStyle: false,
    tipKey: "tip_character",
  },
};

export const LORA_USE_FEATURES = [
  {
    id: "image-generator",
    href: "/dashboard/image-generator",
    labelKey: "use_image_generator",
  },
  {
    id: "ki-ich",
    href: "/dashboard/ki-ich",
    labelKey: "use_ki_ich",
  },
  {
    id: "thumbnail",
    href: "/dashboard/thumbnail-concept",
    labelKey: "use_thumbnail",
  },
  {
    id: "produkt",
    href: "/dashboard/produkt",
    labelKey: "use_produkt",
  },
] as const;

export const LORA_STORAGE_BUCKET = "lora-training";

export function trainingFalEndpoint(type: LoraModelType): string {
  return LORA_TYPE_META[type].usesPortraitTrainer
    ? FAL_LORA_MODELS.PORTRAIT_TRAINER
    : FAL_LORA_MODELS.FAST_TRAINER;
}

export function creditsForLoraType(type: LoraModelType): number {
  return LORA_TRAINING_CREDITS[type];
}

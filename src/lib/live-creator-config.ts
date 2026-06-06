import { FAL_CREDITS } from "@/lib/fal-credits";

/** SoulX-FlashHead on fal.ai (realtime portrait animation). */
export const FAL_FLASHHEAD_MODEL = "fal-ai/flashhead";

/** Legacy alias — fal routes to the same model. */
export const FAL_FLASHHEAD_MODEL_ALIASES = [
  "fal-ai/flashhead",
  "fal-ai/soulx-flashhead",
] as const;

export const FAL_LIVE_PORTRAIT_FALLBACK = "fal-ai/live-portrait";

export const LIVE_CREATOR_PORTRAIT_CREDIT_COST = FAL_CREDITS.liveCreatorPortrait;
export const LIVE_CREATOR_CREDITS_PER_MINUTE = 2;
export const LIVE_CREATOR_LOW_CREDITS_WARNING = 10;
export const LIVE_CREATOR_HEARTBEAT_MS = 60_000;
export const LIVE_CREATOR_FRAME_INTERVAL_MS = 33;
export const LIVE_CREATOR_FRAME_SIZE = 512;
export const LIVE_CREATOR_FALLBACK_INTERVAL_MS = 400;

export type LiveCreatorCharacter = {
  id: string;
  name: string;
  imageUrl: string;
  kind: "preset" | "ki-ich" | "upload";
};

export const PRESET_LIVE_CHARACTERS: LiveCreatorCharacter[] = [
  {
    id: "preset-1",
    name: "Alex",
    imageUrl: "/avatars/avatar-1.jpg",
    kind: "preset",
  },
  {
    id: "preset-2",
    name: "Mia",
    imageUrl: "/avatars/avatar-2.png",
    kind: "preset",
  },
  {
    id: "preset-3",
    name: "Jordan",
    imageUrl: "/avatars/avatar-3.jpg",
    kind: "preset",
  },
  {
    id: "preset-4",
    name: "Sam",
    imageUrl: "/avatars/avatar-4.jpg",
    kind: "preset",
  },
  {
    id: "preset-5",
    name: "Riley",
    imageUrl: "/avatars/avatar-5.jpg",
    kind: "preset",
  },
  {
    id: "preset-6",
    name: "Casey",
    imageUrl: "/avatars/avatar-6.jpg",
    kind: "preset",
  },
];

export const PREFERRED_LIVE_CHARACTER_KEY = "influexai_preferred_live_character_id";

/** Fixed Akool tool credit costs (InfluexAI billing). */
export const AKOOL_TOOL_CREDITS = {
  textToVideo: 50,
  videoTranslationPerMinute: 30,
  lipsync: 20,
  voiceClone: 5,
  tts: 3,
  voiceChanger: 5,
  characterStudio: 25,
  videoEditor: 40,
  ecommerceAds: 15,
} as const;

export type AkoolToolCreditKey = keyof typeof AKOOL_TOOL_CREDITS;

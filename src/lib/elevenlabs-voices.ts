/**
 * Voice IDs verified via TTS against this project's ElevenLabs API key.
 * The /v1/voices endpoint requires voices_read (not enabled on this key).
 */
export const ELEVENLABS_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah – Soft Female" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni – Deep Male" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam – Narration Male" },
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda – Warm Female" },
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George – British Male" },
  { id: "cgSgspJ2msm6clMCkdW9", label: "Jessica – Expressive Female" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel – Calm Male" },
  { id: "VR6AewLTigWG4xSOukaG", label: "Arnold – Authoritative" },
] as const;

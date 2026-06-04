/**
 * Voices verified against the project's ElevenLabs API key (TTS succeeds).
 * Rachel/Josh/Elli etc. return 402 on this account and are excluded.
 */
export const ELEVENLABS_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah – Soft Female" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni – Deep Male" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam – Narration Male" },
  { id: "VR6AewLTigWG4xSOukaG", label: "Arnold – Authoritative" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel – Calm Male" },
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George – Warm British Male" },
] as const;

import { ELEVENLABS_VOICES } from "@/lib/elevenlabs-voices";

export const DEFAULT_ELEVENLABS_VOICE_ID = ELEVENLABS_VOICES[0].id;

/** Any non-empty ElevenLabs voice_id from the voice browser or API. */
export function isValidElevenLabsVoiceId(voiceId: string): boolean {
  const id = voiceId?.trim();
  return typeof id === "string" && id.length >= 8 && id.length <= 64;
}

export type ElevenLabsTtsResult =
  | { ok: true; audioDataUrl: string; mimeType: string }
  | {
      ok: false;
      error: string;
      code?: "NO_KEY" | "INVALID_KEY" | "INVALID_VOICE" | "API_ERROR" | "UNKNOWN";
    };

export async function synthesizeElevenLabsSpeech(
  text: string,
  voiceId: string,
  stabilityPercent = 75
): Promise<ElevenLabsTtsResult> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

    if (!apiKey) {
      return { ok: false, error: "ELEVENLABS_API_KEY fehlt", code: "NO_KEY" };
    }

    if (!isValidElevenLabsVoiceId(voiceId)) {
      return { ok: false, error: "Voice-ID ungültig", code: "INVALID_VOICE" };
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: stabilityPercent / 100,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs error:", response.status, errorText);

      if (response.status === 401) {
        return { ok: false, error: "API-Key ungültig", code: "INVALID_KEY" };
      }
      if (response.status === 422) {
        return { ok: false, error: "Voice-ID ungültig", code: "INVALID_VOICE" };
      }
      if (response.status === 402) {
        return {
          ok: false,
          error:
            "Stimme nicht im Plan oder Guthaben aufgebraucht. Andere Stimme wählen.",
          code: "API_ERROR",
        };
      }
      return {
        ok: false,
        error: `API Fehler: ${response.status}`,
        code: "API_ERROR",
      };
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return {
      ok: true,
      audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`,
      mimeType: "audio/mpeg",
    };
  } catch (error: unknown) {
    console.error("synthesizeElevenLabsSpeech error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      code: "UNKNOWN",
    };
  }
}

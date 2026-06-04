import { ELEVENLABS_VOICES } from "@/lib/elevenlabs-voices";

const VALID_VOICE_IDS = new Set<string>(ELEVENLABS_VOICES.map((v) => v.id));

export const DEFAULT_ELEVENLABS_VOICE_ID = ELEVENLABS_VOICES[0].id;

export function isValidElevenLabsVoiceId(voiceId: string): boolean {
  return VALID_VOICE_IDS.has(voiceId);
}

function mapElevenLabsError(status: number, body: string): string {
  if (status === 402) {
    return "ElevenLabs-Guthaben aufgebraucht oder Stimme nicht im Plan enthalten.";
  }
  if (status === 401) {
    return "ElevenLabs API-Key ungültig.";
  }
  if (status === 404) {
    return "Stimme nicht gefunden. Bitte eine andere Stimme wählen.";
  }
  const snippet = body.slice(0, 200);
  return snippet
    ? `ElevenLabs API error (${status}): ${snippet}`
    : `ElevenLabs API error: ${status}`;
}

export type ElevenLabsTtsResult =
  | { ok: true; audioDataUrl: string }
  | { ok: false; error: string };

export async function synthesizeElevenLabsSpeech(
  text: string,
  voiceId: string,
  stabilityPercent = 50
): Promise<ElevenLabsTtsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "ELEVENLABS_API_KEY fehlt." };
  }
  if (!isValidElevenLabsVoiceId(voiceId)) {
    return { ok: false, error: "Ungültige Stimme." };
  }

  const stability = Math.min(1, Math.max(0, stabilityPercent / 100));

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
          stability,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("ElevenLabs error:", response.status, errorBody.slice(0, 500));
    return {
      ok: false,
      error: mapElevenLabsError(response.status, errorBody),
    };
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");
  return {
    ok: true,
    audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`,
  };
}

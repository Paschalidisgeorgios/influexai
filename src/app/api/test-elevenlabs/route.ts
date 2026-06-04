import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        error: "ELEVENLABS_API_KEY not found",
        keyExists: false,
      });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });

    const data = await response.json();

    return NextResponse.json({
      keyExists: true,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10),
      apiStatus: response.status,
      voices:
        data.voices?.map(
          (v: { voice_id: string; name: string; category?: string }) => ({
            id: v.voice_id,
            name: v.name,
            category: v.category,
          })
        ) ?? [],
      rawResponse: data,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      keyExists: !!process.env.ELEVENLABS_API_KEY,
    });
  }
}

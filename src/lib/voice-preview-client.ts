export async function playElevenLabsVoicePreview(
  voiceId: string,
  previewUrl: string | null | undefined,
  audioRef: { current: HTMLAudioElement | null },
  onPlayingChange: (playing: boolean) => void
): Promise<boolean> {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  if (previewUrl) {
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    onPlayingChange(true);
    audio.onended = () => onPlayingChange(false);
    audio.onerror = () => onPlayingChange(false);
    try {
      await audio.play();
      return true;
    } catch {
      onPlayingChange(false);
      return false;
    }
  }

  try {
    const res = await fetch("/api/elevenlabs/voice-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voiceId,
        text: "Hallo, ich bin dein KI-Creator. Lass uns loslegen!",
      }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audioRef.current = audio;
    onPlayingChange(true);
    audio.onended = () => {
      URL.revokeObjectURL(objectUrl);
      onPlayingChange(false);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      onPlayingChange(false);
    };
    await audio.play();
    return true;
  } catch {
    onPlayingChange(false);
    return false;
  }
}

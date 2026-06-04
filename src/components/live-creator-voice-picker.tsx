"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getElevenLabsVoices } from "@/app/actions/get-elevenlabs-voices";
import {
  getDefaultVoiceIdForLocale,
  resolveElevenLabsVoiceId,
} from "@/lib/elevenlabs-tts";
import { useLocale } from "next-intl";
import type { ElevenLabsVoice } from "@/lib/elevenlabs-voice-types";

type LiveCreatorVoicePickerProps = {
  selectedVoiceId: string;
  onVoiceSelect: (voice: ElevenLabsVoice) => void;
};

const GENDER_OPTIONS = [
  { label: "Alle", filter: "Alle" as const },
  { label: "Weiblich", filter: "female" as const },
  { label: "Männlich", filter: "male" as const },
];

export function LiveCreatorVoicePicker({
  selectedVoiceId,
  onVoiceSelect,
}: LiveCreatorVoicePickerProps) {
  const locale = useLocale();
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceGender, setVoiceGender] = useState("Alle");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getElevenLabsVoices().then((result) => {
      if (result.voices.length > 0) {
        setVoices(result.voices);
        const resolvedId = resolveElevenLabsVoiceId(selectedVoiceId);
        const current =
          result.voices.find((v) => v.id === resolvedId) ??
          result.voices.find((v) => v.id === selectedVoiceId);
        if (current) {
          onVoiceSelect(current);
        } else {
          const localeDefault = resolveElevenLabsVoiceId(
            getDefaultVoiceIdForLocale(locale)
          );
          const preferred =
            result.voices.find((v) => v.id === localeDefault) ??
            result.voices[0];
          onVoiceSelect(preferred);
        }
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);

  const filteredVoices = useMemo(() => {
    let list = [...voices];
    if (voiceGender !== "Alle") {
      list = list.filter((v) => v.gender === voiceGender);
    }
    if (voiceSearch.trim()) {
      const q = voiceSearch.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.accent?.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [voices, voiceGender, voiceSearch]);

  const playPreview = (voice: ElevenLabsVoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === voice.id) {
      setPlayingId(null);
      return;
    }
    if (!voice.previewUrl) return;
    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    setPlayingId(voice.id);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  if (loading) {
    return (
      <p className="text-white/40 text-sm py-4 text-center">
        Stimmen werden geladen…
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="🔍  Stimme suchen…"
        value={voiceSearch}
        onChange={(e) => setVoiceSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#B4FF00]/50 transition-all"
      />

      <div className="flex gap-2 flex-wrap">
        {GENDER_OPTIONS.map((g) => (
          <button
            key={g.label}
            type="button"
            onClick={() => setVoiceGender(g.filter)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              voiceGender === g.filter
                ? "bg-[#B4FF00] text-black font-medium"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
        {filteredVoices.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">
            Keine Stimmen gefunden
          </p>
        ) : (
          filteredVoices.map((voice) => {
            const selected = selectedVoiceId === voice.id;
            return (
              <div
                key={voice.id}
                role="button"
                tabIndex={0}
                onClick={() => onVoiceSelect(voice)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onVoiceSelect(voice);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selected
                    ? "bg-[#B4FF00]/10 border border-[#B4FF00]"
                    : "bg-white/5 border border-white/10 hover:border-white/30"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    selected ? "bg-[#B4FF00] text-black" : "bg-white/10 text-white"
                  }`}
                >
                  {voice.gender === "female" ? "👩" : voice.gender === "male" ? "👨" : "🎙"}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      selected ? "text-[#B4FF00]" : "text-white"
                    }`}
                  >
                    {voice.name}
                  </p>
                  <p className="text-white/30 text-xs truncate">
                    {voice.accent ?? voice.category}
                  </p>
                </div>
                {voice.previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => playPreview(voice, e)}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs flex-shrink-0 transition-all ${
                      playingId === voice.id
                        ? "border-[#B4FF00] bg-[#B4FF00] text-black"
                        : "border-white/20 text-white/50 hover:border-[#B4FF00]"
                    }`}
                    aria-label="Vorschau"
                  >
                    {playingId === voice.id ? "⏹" : "▶"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

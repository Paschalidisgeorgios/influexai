"use client";

import { useEffect, useRef, useState } from "react";
import { getElevenLabsVoices } from "@/app/actions/get-elevenlabs-voices";
import {
  getDefaultVoiceIdForLocale,
  resolveElevenLabsVoiceId,
} from "@/lib/elevenlabs-tts";
import { useLocale } from "next-intl";
import type { ElevenLabsVoice } from "@/lib/elevenlabs-voice-types";

export type { ElevenLabsVoice };

type VoiceSelectorProps = {
  selectedVoiceId: string;
  onVoiceSelect: (voice: ElevenLabsVoice) => void;
};

const CATEGORIES = ["Alle", "premade", "cloned", "generated", "professional"];
const GENDERS = ["Alle", "male", "female"];
const LANGUAGES = ["Alle", "de", "en", "el", "tr", "es", "fr", "ar", "pt"];

const LANGUAGE_LABELS: Record<string, string> = {
  de: "🇩🇪 Deutsch",
  en: "🇬🇧 English",
  el: "🇬🇷 Ελληνικά",
  tr: "🇹🇷 Türkçe",
  es: "🇪🇸 Español",
  fr: "🇫🇷 Français",
  ar: "🇸🇦 Arabic",
  pt: "🇧🇷 Português",
};

function getCategoryColor(category: string): string {
  switch (category) {
    case "premade":
      return "bg-blue-500/20 text-blue-400";
    case "cloned":
      return "bg-purple-500/20 text-purple-400";
    case "professional":
      return "bg-[#B4FF00]/20 text-[#B4FF00]";
    case "generated":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-white/10 text-white/80";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "premade":
      return "Standard";
    case "cloned":
      return "Geklont";
    case "professional":
      return "Professional";
    case "generated":
      return "Generiert";
    default:
      return category;
  }
}

export function VoiceSelector({
  selectedVoiceId,
  onVoiceSelect,
}: VoiceSelectorProps) {
  const locale = useLocale();
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [filtered, setFiltered] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [genderFilter, setGenderFilter] = useState("Alle");
  const [languageFilter, setLanguageFilter] = useState("Alle");
  const [sortBy, setSortBy] = useState<"name" | "category" | "gender">("name");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getElevenLabsVoices().then((result) => {
      if (result.voices.length > 0) {
        setVoices(result.voices);
        setFiltered(result.voices);
      }
      if (!result.success && result.error) {
        setLoadError(result.error);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedVoiceId && voices.length > 0) {
      const localeDefault = getDefaultVoiceIdForLocale(locale);
      const resolvedDefault = resolveElevenLabsVoiceId(localeDefault);
      const preferred =
        voices.find((v) => v.id === resolvedDefault) ??
        voices.find((v) => v.id === localeDefault) ??
        voices.find((v) => v.language === locale.split("-")[0]) ??
        voices[0];
      onVoiceSelect(preferred);
    }
  }, [voices, selectedVoiceId, onVoiceSelect, locale]);

  useEffect(() => {
    let result = [...voices];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.accent?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "Alle") {
      result = result.filter((v) => v.category === categoryFilter);
    }

    if (genderFilter !== "Alle") {
      result = result.filter((v) => v.gender === genderFilter);
    }

    if (languageFilter !== "Alle") {
      result = result.filter((v) => v.language === languageFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "category")
        return a.category.localeCompare(b.category);
      if (sortBy === "gender")
        return (a.gender ?? "").localeCompare(b.gender ?? "");
      return 0;
    });

    setFiltered(result);
  }, [voices, search, categoryFilter, genderFilter, languageFilter, sortBy]);

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
      <div className="flex items-center gap-2 text-white/70 text-sm py-4">
        <div
          className="w-4 h-4 border border-[#B4FF00]/50 border-t-[#B4FF00] rounded-full animate-spin"
          aria-hidden
        />
        Stimmen werden geladen...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loadError && (
        <p className="text-amber-400/90 text-xs">
          API-Hinweis: {loadError}. Fallback-Stimmen werden angezeigt.
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Stimme suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#B4FF00]/50"
        />
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "name" | "category" | "gender")
          }
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#B4FF00]/50"
        >
          <option value="name">A–Z</option>
          <option value="category">Kategorie</option>
          <option value="gender">Geschlecht</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                genderFilter === g
                  ? "bg-[#B4FF00] text-black font-medium"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {g === "Alle"
                ? "Alle"
                : g === "male"
                  ? "👨 Männlich"
                  : "👩 Weiblich"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                categoryFilter === c
                  ? "bg-[#B4FF00] text-black font-medium"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {c === "Alle" ? "Alle" : getCategoryLabel(c)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setLanguageFilter("Alle")}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              languageFilter === "Alle"
                ? "bg-[#B4FF00] text-black font-medium"
                : "bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Alle Sprachen
          </button>
          {LANGUAGES.filter((l) => l !== "Alle").map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguageFilter(l)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                languageFilter === l
                  ? "bg-[#B4FF00] text-black font-medium"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {LANGUAGE_LABELS[l] ?? l}
            </button>
          ))}
        </div>
      </div>

      <p className="text-white/65 text-xs">{filtered.length} Stimmen gefunden</p>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-white/65 text-sm text-center py-4">
            Keine Stimmen gefunden
          </p>
        ) : (
          filtered.map((voice) => (
            <div
              key={voice.id}
              role="button"
              tabIndex={0}
              onClick={() => onVoiceSelect(voice)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onVoiceSelect(voice);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selectedVoiceId === voice.id
                  ? "border-[#B4FF00] bg-[#B4FF00]/10"
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/[0.08]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  selectedVoiceId === voice.id
                    ? "bg-[#B4FF00] text-black"
                    : "bg-white/10 text-white"
                }`}
              >
                {voice.gender === "female"
                  ? "👩"
                  : voice.gender === "male"
                    ? "👨"
                    : "🎙"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-sm font-medium truncate ${
                      selectedVoiceId === voice.id
                        ? "text-[#B4FF00]"
                        : "text-white"
                    }`}
                  >
                    {voice.name}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${getCategoryColor(voice.category)}`}
                  >
                    {getCategoryLabel(voice.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {voice.accent && (
                    <span className="text-white/70 text-xs">{voice.accent}</span>
                  )}
                  {voice.age && (
                    <span className="text-white/70 text-xs">· {voice.age}</span>
                  )}
                  {voice.useCase && (
                    <span className="text-white/70 text-xs">
                      · {voice.useCase}
                    </span>
                  )}
                  {voice.language && LANGUAGE_LABELS[voice.language] && (
                    <span className="text-white/70 text-xs">
                      · {LANGUAGE_LABELS[voice.language]}
                    </span>
                  )}
                </div>
              </div>

              {voice.previewUrl && (
                <button
                  type="button"
                  onClick={(e) => playPreview(voice, e)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all text-xs ${
                    playingId === voice.id
                      ? "border-[#B4FF00] bg-[#B4FF00] text-black"
                      : "border-white/20 text-white/80 hover:border-[#B4FF00] hover:text-[#B4FF00]"
                  }`}
                  title="Vorschau abspielen"
                >
                  {playingId === voice.id ? "⏹" : "▶"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

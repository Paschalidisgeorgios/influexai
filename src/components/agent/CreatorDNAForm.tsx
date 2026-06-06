"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CreatorDNA } from "@/lib/agent-types";

const PLATFORMS: CreatorDNA["platforms"][number][] = [
  "TikTok",
  "Instagram",
  "YouTube",
  "LinkedIn",
];

const TONE_OPTIONS = [
  "Authentisch",
  "Professionell",
  "Humorvoll",
  "Inspirierend",
] as const;

export const DEFAULT_CREATOR_DNA: CreatorDNA = {
  niche: "",
  targetAudience: "",
  platforms: [],
  tone: "Authentisch",
  language: "de",
  goals: [],
  forbiddenTopics: [],
  preferredFormats: [],
  visualStyle: "",
  ctaStyle: "",
};

function isPlatform(value: string): value is CreatorDNA["platforms"][number] {
  return (PLATFORMS as readonly string[]).includes(value);
}

export function parseCreatorDNA(raw: unknown): CreatorDNA | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Partial<CreatorDNA>;
  const platforms = Array.isArray(data.platforms)
    ? data.platforms.filter(
        (p): p is CreatorDNA["platforms"][number] =>
          typeof p === "string" && isPlatform(p)
      )
    : [];

  return {
    ...DEFAULT_CREATOR_DNA,
    ...data,
    platforms,
    language: data.language === "en" ? "en" : "de",
    goals: Array.isArray(data.goals) ? data.goals.filter(Boolean) : [],
    forbiddenTopics: Array.isArray(data.forbiddenTopics)
      ? data.forbiddenTopics.filter(Boolean)
      : [],
    preferredFormats: Array.isArray(data.preferredFormats)
      ? data.preferredFormats.filter(Boolean)
      : [],
    tone:
      typeof data.tone === "string" && data.tone.trim()
        ? data.tone
        : DEFAULT_CREATOR_DNA.tone,
  };
}

function parseForbiddenTopics(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function forbiddenTopicsToText(topics: string[]): string {
  return topics.join(", ");
}

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  background: "#18181d",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F0EFE8",
  fontSize: "0.84rem",
  outline: "none",
  fontFamily: "var(--font-dm), sans-serif",
} as const;

type CreatorDNAFormProps = {
  value: CreatorDNA | null;
  onChange: (dna: CreatorDNA) => void;
};

export function CreatorDNAForm({ value, onChange }: CreatorDNAFormProps) {
  const supabase = createClient();
  const [draft, setDraft] = useState<CreatorDNA>(value ?? DEFAULT_CREATOR_DNA);
  const [forbiddenText, setForbiddenText] = useState(
    forbiddenTopicsToText(value?.forbiddenTopics ?? [])
  );
  const [loading, setLoading] = useState(!value);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (value) {
      setDraft(value);
      setForbiddenText(forbiddenTopicsToText(value.forbiddenTopics));
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("creator_dna")
        .eq("id", user.id)
        .single();

      if (error) {
        setLoading(false);
        return;
      }

      const parsed = parseCreatorDNA(data?.creator_dna);
      if (parsed) {
        setDraft(parsed);
        setForbiddenText(forbiddenTopicsToText(parsed.forbiddenTopics));
        onChange(parsed);
      }
      setLoading(false);
    };

    void load();
  }, [onChange, supabase, value]);

  const togglePlatform = (platform: CreatorDNA["platforms"][number]) => {
    setDraft((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);

    const payload: CreatorDNA = {
      ...draft,
      forbiddenTopics: parseForbiddenTopics(forbiddenText),
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: "err", text: "Nicht angemeldet." });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ creator_dna: payload })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "err", text: "Speichern fehlgeschlagen." });
      setSaving(false);
      return;
    }

    setDraft(payload);
    onChange(payload);
    setMessage({ type: "ok", text: "Creator DNA gespeichert." });
    setSaving(false);
  };

  const label = (text: string) => (
    <label
      className="mb-1 block text-[0.72rem] font-semibold tracking-[0.04em]"
      style={{ color: "rgba(255,255,255,0.6)" }}
    >
      {text}
    </label>
  );

  if (loading) {
    return (
      <div
        className="rounded-[12px] px-4 py-6 text-center text-[0.82rem]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(180,255,0,0.2)",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Creator DNA wird geladen…
      </div>
    );
  }

  return (
    <div
      className="rounded-[12px] p-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(180,255,0,0.2)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3
          className="text-[0.95rem] tracking-[0.04em]"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            color: "#F0EFE8",
          }}
        >
          CREATOR DNA
        </h3>
        <span className="text-[0.72rem] text-white/40">
          Personalisiert Agent-Antworten
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          {label("Nische")}
          <input
            value={draft.niche}
            onChange={(e) => setDraft((p) => ({ ...p, niche: e.target.value }))}
            placeholder="z.B. Personal Finance, Beauty, Tech"
            style={inputStyle}
          />
        </div>

        <div className="sm:col-span-2">
          {label("Zielgruppe")}
          <input
            value={draft.targetAudience}
            onChange={(e) =>
              setDraft((p) => ({ ...p, targetAudience: e.target.value }))
            }
            placeholder="z.B. 18–30, Selbstständige"
            style={inputStyle}
          />
        </div>

        <div className="sm:col-span-2">
          {label("Plattformen")}
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const active = draft.platforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className="rounded-full px-3 py-1 text-[0.75rem] font-semibold transition-colors"
                  style={
                    active
                      ? { background: "#B4FF00", color: "#060608" }
                      : {
                          background: "transparent",
                          border: "1px solid rgba(180,255,0,0.3)",
                          color: "#B4FF00",
                        }
                  }
                >
                  {platform}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {label("Tonalität")}
          <select
            value={draft.tone}
            onChange={(e) => setDraft((p) => ({ ...p, tone: e.target.value }))}
            style={inputStyle}
          >
            {TONE_OPTIONS.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>
        </div>

        <div>
          {label("Sprache")}
          <select
            value={draft.language}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                language: e.target.value === "en" ? "en" : "de",
              }))
            }
            style={inputStyle}
          >
            <option value="de">Deutsch</option>
            <option value="en">Englisch</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          {label("Verbotene Themen (optional)")}
          <input
            value={forbiddenText}
            onChange={(e) => setForbiddenText(e.target.value)}
            placeholder="z.B. Politik, Krypto, Medizinische Claims"
            style={inputStyle}
          />
        </div>

        <div className="sm:col-span-2">
          {label("CTA-Stil")}
          <input
            value={draft.ctaStyle}
            onChange={(e) =>
              setDraft((p) => ({ ...p, ctaStyle: e.target.value }))
            }
            placeholder="z.B. Kommentiere, Folge mir, Link in Bio"
            style={inputStyle}
          />
        </div>
      </div>

      {message && (
        <div
          className="mt-3 rounded-[8px] px-3 py-2 text-[0.78rem]"
          style={{
            background:
              message.type === "ok"
                ? "rgba(180,255,0,0.08)"
                : "rgba(255,71,87,0.08)",
            border: `1px solid ${message.type === "ok" ? "rgba(180,255,0,0.25)" : "rgba(255,71,87,0.25)"}`,
            color: message.type === "ok" ? "#B4FF00" : "#ff6b7a",
          }}
        >
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-3 w-full rounded-[8px] py-2 text-[0.82rem] font-bold transition-opacity disabled:opacity-50"
        style={{
          background: "#B4FF00",
          color: "#060608",
          fontFamily: "var(--font-dm), sans-serif",
        }}
      >
        {saving ? "Speichern…" : "Creator DNA speichern"}
      </button>
    </div>
  );
}

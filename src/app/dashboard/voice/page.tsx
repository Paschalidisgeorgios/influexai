"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Music2 } from "lucide-react";
import { generateVoice } from "@/app/actions/generate-voice";
import { VoiceRecorder } from "@/components/voice-recorder";
import { VoiceSelector } from "@/components/voice-selector";
import { getDefaultVoiceIdForLocale } from "@/lib/elevenlabs-tts";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

type Tab = "stimme" | "eigen" | "musik";

const MUSIC_MOODS = [
  {
    id: "motivierend",
    name: "Motivierend",
    bpm: "120–130",
    bestFor: "Shorts & Long-form",
    query: "motivational upbeat royalty free",
  },
  {
    id: "dramatisch",
    name: "Dramatisch",
    bpm: "90–110",
    bestFor: "Long-form",
    query: "dramatic cinematic royalty free",
  },
  {
    id: "entspannt",
    name: "Entspannt",
    bpm: "70–85",
    bestFor: "Long-form",
    query: "calm relaxing ambient royalty free",
  },
  {
    id: "episch",
    name: "Episch",
    bpm: "100–120",
    bestFor: "Shorts & Long-form",
    query: "epic orchestral royalty free",
  },
  {
    id: "verspielt",
    name: "Verspielt",
    bpm: "110–125",
    bestFor: "Shorts",
    query: "playful fun royalty free",
  },
  {
    id: "dunkel",
    name: "Dunkel",
    bpm: "80–95",
    bestFor: "Shorts",
    query: "dark moody royalty free",
  },
  {
    id: "romantisch",
    name: "Romantisch",
    bpm: "75–90",
    bestFor: "Long-form",
    query: "romantic soft piano royalty free",
  },
  {
    id: "energetisch",
    name: "Energetisch",
    bpm: "128–140",
    bestFor: "Shorts",
    query: "energetic electronic royalty free",
  },
];

const MUSIC_SOURCES = [
  {
    name: "Pixabay Music",
    buildUrl: (q: string) =>
      `https://pixabay.com/music/search/${encodeURIComponent(q)}/`,
  },
  {
    name: "YouTube Audio Library",
    buildUrl: () => "https://studio.youtube.com/channel/UC/music",
  },
  {
    name: "Free Music Archive",
    buildUrl: (q: string) =>
      `https://freemusicarchive.org/search?search_term=${encodeURIComponent(q)}`,
  },
];

function drawWaveform(canvas: HTMLCanvasElement, audioUrl: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  fetch(audioUrl)
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const ac = new AudioContext();
      return ac.decodeAudioData(buf).finally(() => ac.close());
    })
    .then((audioBuffer) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const data = audioBuffer.getChannelData(0);
      const step = Math.ceil(data.length / w);
      const mid = h / 2;

      ctx.fillStyle = "rgba(180,255,0,0.15)";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#B4FF00";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < w; i++) {
        let min = 1;
        let max = -1;
        for (let j = 0; j < step; j++) {
          const v = data[i * step + j] ?? 0;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        const y1 = mid + min * mid * 0.9;
        const y2 = mid + max * mid * 0.9;
        if (i === 0) ctx.moveTo(i, y1);
        else ctx.lineTo(i, y1);
        if (i === w - 1) ctx.lineTo(i, y2);
      }
      for (let i = w - 1; i >= 0; i--) {
        let max = -1;
        for (let j = 0; j < step; j++) {
          const v = data[i * step + j] ?? 0;
          if (v > max) max = v;
        }
        ctx.lineTo(i, mid + max * mid * 0.9);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(180,255,0,0.35)";
      ctx.fill();
      ctx.stroke();
    })
    .catch(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "12px sans-serif";
      ctx.fillText("Waveform nicht verfügbar", 12, canvas.height / 2);
    });
}

export default function VoicePage() {
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("stimme");
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState<string>(() =>
    getDefaultVoiceIdForLocale(locale)
  );
  const [stability, setStability] = useState(75);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ownScript, setOwnScript] = useState("");
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<
    (typeof MUSIC_MOODS)[0] | null
  >(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tabStyle = (t: Tab) => ({
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-dm), sans-serif",
    fontWeight: 700,
    fontSize: "0.875rem",
    background: tab === t ? "#B4FF00" : "transparent",
    color: tab === t ? "#060608" : "rgba(255,255,255,0.65)",
  });

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none" as const,
    fontFamily: "var(--font-dm), sans-serif",
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setAudioUrl(null);
    const result = await generateVoice(script, voiceId, stability);
    setGenerating(false);
    if (!result.success) {
      setError(sanitizeUserMessage(result.error, { allowElevenLabs: true }));
      return;
    }
    setAudioUrl(result.audioUrl);
    window.dispatchEvent(new Event("credits-updated"));
  };

  const paintWaveform = useCallback(() => {
    if (audioUrl && canvasRef.current) {
      drawWaveform(canvasRef.current, audioUrl);
    }
  }, [audioUrl]);

  useEffect(() => {
    paintWaveform();
  }, [paintWaveform]);

  useEffect(() => {
    const onResize = () => paintWaveform();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paintWaveform]);

  const downloadMp3 = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "influexai-stimme.mp3";
    a.click();
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <Music2 size={32} color="#B4FF00" strokeWidth={2} />
          <h1
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
            }}
          >
            Stimme & Musik
          </h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
          KI-Stimme generieren oder lizenzfreie Musik finden
        </p>
        <p
          style={{
            marginTop: 8,
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.65)",
            letterSpacing: "0.04em",
          }}
        >
          Powered by{" "}
          <span style={{ color: "var(--acid)", fontWeight: 600 }}>
            ElevenLabs
          </span>
        </p>
      </div>

      <div
        style={{
          display: "inline-flex",
          padding: 4,
          borderRadius: 12,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
          marginBottom: 24,
          gap: 4,
        }}
      >
        <button
          type="button"
          style={tabStyle("stimme")}
          onClick={() => setTab("stimme")}
        >
          KI Stimme
        </button>
        <button
          type="button"
          style={tabStyle("eigen")}
          onClick={() => setTab("eigen")}
        >
          Eigene Stimme
        </button>
        <button
          type="button"
          style={tabStyle("musik")}
          onClick={() => setTab("musik")}
        >
          Musik-Underlay
        </button>
      </div>

      {tab === "stimme" && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {error && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 9,
                background: "rgba(255,71,87,0.08)",
                border: "1px solid rgba(255,71,87,0.25)",
                color: "#ff6b7a",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.65)",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Dein Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value.slice(0, 500))}
              rows={5}
              placeholder="Schreibe hier den Text, den die KI-Stimme sprechen soll..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            <div
              style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.65)",
                marginTop: 6,
                textAlign: "right",
              }}
            >
              {script.length} / 500
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.65)",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Stimme
            </label>
            <VoiceSelector
              selectedVoiceId={voiceId}
              onVoiceSelect={(voice) => setVoiceId(voice.id)}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.65)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Stability
              </label>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#B4FF00",
                  fontWeight: 700,
                }}
              >
                {stability}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stability}
              onChange={(e) => setStability(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#B4FF00" }}
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!script.trim() || generating}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 11,
              border: "none",
              background: script.trim() && !generating ? "#B4FF00" : "#2a2a2a",
              color: script.trim() && !generating ? "#060608" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.04em",
              cursor: script.trim() && !generating ? "pointer" : "default",
            }}
          >
            {generating ? "WIRD GENERIERT..." : "STIMME GENERIEREN →"}
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            Kostet 3 Credits
          </p>

          {audioUrl && (
            <div
              style={{
                marginTop: 8,
                padding: 18,
                borderRadius: 14,
                background: "#18181d",
                border: "1px solid rgba(180,255,0,0.2)",
              }}
            >
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#F0EFE8",
                  marginBottom: 12,
                }}
              >
                Deine KI-Stimme
              </div>
              <canvas
                ref={canvasRef}
                width={680}
                height={72}
                style={{
                  width: "100%",
                  height: 72,
                  borderRadius: 8,
                  marginBottom: 12,
                  display: "block",
                }}
              />
              <audio
                controls
                src={audioUrl}
                style={{ width: "100%", marginBottom: 12 }}
              />
              <button
                type="button"
                onClick={downloadMp3}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 10,
                  background: "#B4FF00",
                  color: "#060608",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                ⬇ MP3 herunterladen
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "eigen" && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <VoiceRecorder
            script={ownScript}
            onScriptChange={setOwnScript}
            recordedUrl={recordedUrl}
            onRecordedUrlChange={setRecordedUrl}
          />
        </div>
      )}

      {tab === "musik" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MUSIC_MOODS.map((mood) => (
              <button
                key={mood.id}
                type="button"
                onClick={() => setSelectedMood(mood)}
                style={{
                  textAlign: "left",
                  padding: 16,
                  borderRadius: 14,
                  background:
                    selectedMood?.id === mood.id
                      ? "rgba(180,255,0,0.08)"
                      : "#0f0f12",
                  border: `1px solid ${
                    selectedMood?.id === mood.id
                      ? "rgba(180,255,0,0.35)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                  cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: selectedMood?.id === mood.id ? "#B4FF00" : "#F0EFE8",
                    marginBottom: 6,
                  }}
                >
                  {mood.name}
                </div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
                  {mood.bpm} BPM · Best for: {mood.bestFor}
                </div>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div
              style={{
                padding: 20,
                borderRadius: 14,
                background: "#0f0f12",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.65)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Kostenlose Quellen für „{selectedMood.name}“
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {MUSIC_SOURCES.map((src) => (
                  <a
                    key={src.name}
                    href={src.buildUrl(selectedMood.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "#18181d",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#F0EFE8",
                      textDecoration: "none",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                    }}
                  >
                    {src.name}
                    <span style={{ color: "#B4FF00", fontSize: "0.8rem" }}>
                      Suchen →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";

type Tab = "klonen" | "sprechen";

export default function StimmePage() {
  const [tab, setTab] = useState<Tab>("klonen");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [text, setText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAudioFile = (file: File) => {
    setAudioFile(file);
    setCloned(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const file = new File([blob], "aufnahme.webm", { type: "audio/webm" });
      setAudioFile(file);
    };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const handleClone = async () => {
    if (!audioFile || !voiceName) return;
    setCloning(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("name", voiceName);
      const res = await fetch("/api/stimme/clone", { method: "POST", body: formData });
      const data = await res.json();
      if (data.voiceId) {
        setVoiceId(data.voiceId);
        setCloned(true);
        setTab("sprechen");
      } else {
        alert(data.error || "Fehler beim Klonen");
      }
    } catch {
      alert("Fehler. Bitte versuche es erneut.");
    }
    setCloning(false);
  };

  const handleSpeak = async () => {
    if (!text || !voiceId) return;
    setSpeaking(true);
    setAudioUrl(null);
    try {
      const res = await fetch("/api/stimme/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      } else {
        alert(data.error || "Fehler beim Sprechen");
      }
    } catch {
      alert("Fehler. Bitte versuche es erneut.");
    }
    setSpeaking(false);
  };

  const tabStyle = (t: Tab) => ({
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-dm), sans-serif",
    fontWeight: 700,
    fontSize: "0.875rem",
    transition: "all 0.2s",
    background: tab === t ? "#B4FF00" : "transparent",
    color: tab === t ? "#060608" : "#505055",
  });

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "#18181d", border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8", fontSize: "0.95rem", outline: "none",
    fontFamily: "var(--font-dm), sans-serif",
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "0.02em",
          color: "#F0EFE8", marginBottom: 6,
        }}>
          🎵 Stimme & Musik
        </h1>
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>
          Stimme klonen in 60 Sekunden · Text zu Sprache
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "inline-flex", padding: 4,
        borderRadius: 12, background: "#0f0f12",
        border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 24, gap: 4,
      }}>
        <button style={tabStyle("klonen")} onClick={() => setTab("klonen")}>
          🎤 Stimme klonen
        </button>
        <button style={tabStyle("sprechen")} onClick={() => setTab("sprechen")}>
          🔊 Text sprechen
        </button>
      </div>

      {/* TAB: KLONEN */}
      {tab === "klonen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            padding: 24, borderRadius: 16,
            background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#505055", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Schritt 1 — Stimme aufnehmen oder hochladen
            </div>

            {/* Record */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                onClick={recording ? stopRecording : startRecording}
                style={{
                  flex: 1, padding: "14px",
                  borderRadius: 10,
                  background: recording ? "rgba(255,71,87,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${recording ? "rgba(255,71,87,0.4)" : "rgba(255,255,255,0.09)"}`,
                  color: recording ? "#ff6b7a" : "#F0EFE8",
                  fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                }}
              >
                {recording ? "⏹ Aufnahme stoppen" : "🎙 Aufnehmen (mind. 30 Sek.)"}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  flex: 1, padding: "14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#505055", fontWeight: 600,
                  fontSize: "0.9rem", cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                📂 Datei hochladen
              </button>
              <input
                ref={fileRef} type="file"
                accept="audio/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }}
              />
            </div>

            {audioFile && (
              <div style={{
                padding: "10px 14px", borderRadius: 9,
                background: "rgba(180,255,0,0.08)",
                border: "1px solid rgba(180,255,0,0.2)",
                fontSize: "0.82rem", color: "#B4FF00",
                marginBottom: 16, display: "flex",
                alignItems: "center", gap: 8,
              }}>
                ✓ {audioFile.name} bereit
              </div>
            )}

            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#505055", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Schritt 2 — Name für deine Stimme
            </div>
            <input
              type="text" value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="z.B. Meine Stimme, Creator Voice..."
              style={{ ...inputStyle, marginBottom: 16 }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(180,255,0,0.4)"}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)"}
            />

            <button
              onClick={handleClone}
              disabled={!audioFile || !voiceName || cloning}
              style={{
                width: "100%", padding: "14px",
                borderRadius: 11, border: "none",
                background: audioFile && voiceName && !cloning ? "#B4FF00" : "#2a2a2a",
                color: audioFile && voiceName && !cloning ? "#060608" : "#505055",
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "1.2rem", letterSpacing: "0.04em",
                cursor: audioFile && voiceName && !cloning ? "pointer" : "default",
              }}
            >
              {cloning ? "WIRD GEKLONT..." : "STIMME KLONEN → (2 Credits)"}
            </button>
          </div>

          <div style={{
            padding: "14px 18px", borderRadius: 12,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: "0.78rem", color: "#505055",
          }}>
            💡 Tipps für beste Qualität: Ruhige Umgebung · Klar und deutlich sprechen ·
            Mindestens 30 Sekunden · Verschiedene Sätze sprechen
          </div>
        </div>
      )}

      {/* TAB: SPRECHEN */}
      {tab === "sprechen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!voiceId && (
            <div style={{
              padding: 20, borderRadius: 14,
              background: "rgba(255,71,87,0.08)",
              border: "1px solid rgba(255,71,87,0.2)",
              color: "#ff6b7a", fontSize: "0.875rem",
              textAlign: "center",
            }}>
              ⚠️ Bitte zuerst eine Stimme klonen oder eine Voice-ID eingeben.
              <br />
              <button
                onClick={() => setTab("klonen")}
                style={{
                  marginTop: 10, padding: "7px 16px",
                  borderRadius: 8, background: "rgba(255,71,87,0.15)",
                  border: "1px solid rgba(255,71,87,0.3)",
                  color: "#ff6b7a", cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontSize: "0.82rem", fontWeight: 600,
                }}
              >
                → Stimme klonen
              </button>
            </div>
          )}

          <div style={{
            padding: 24, borderRadius: 16,
            background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {voiceId && (
              <div style={{
                padding: "8px 14px", borderRadius: 8,
                background: "rgba(180,255,0,0.08)",
                border: "1px solid rgba(180,255,0,0.2)",
                fontSize: "0.78rem", color: "#B4FF00",
                marginBottom: 16, display: "flex",
                alignItems: "center", gap: 6,
              }}>
                ✓ Stimme: {voiceName || voiceId}
              </div>
            )}

            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#505055", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Text eingeben
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Schreibe hier den Text den deine KI-Stimme sprechen soll..."
              rows={6}
              style={{
                ...inputStyle, resize: "vertical",
                lineHeight: 1.6, marginBottom: 6,
              }}
              onFocus={(e) => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(180,255,0,0.4)"}
              onBlur={(e) => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.09)"}
            />
            <div style={{ fontSize: "0.72rem", color: "#505055", marginBottom: 16 }}>
              {text.length} Zeichen · ~{Math.ceil(text.length / 15)} Sekunden Audio
            </div>

            <button
              onClick={handleSpeak}
              disabled={!text || !voiceId || speaking}
              style={{
                width: "100%", padding: "14px",
                borderRadius: 11, border: "none",
                background: text && voiceId && !speaking ? "#B4FF00" : "#2a2a2a",
                color: text && voiceId && !speaking ? "#060608" : "#505055",
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "1.2rem", letterSpacing: "0.04em",
                cursor: text && voiceId && !speaking ? "pointer" : "default",
              }}
            >
              {speaking ? "WIRD GENERIERT..." : "TEXT SPRECHEN → (2 Credits)"}
            </button>
          </div>

          {/* Audio result */}
          {audioUrl && (
            <div style={{
              padding: 20, borderRadius: 16,
              background: "#0f0f12",
              border: "1px solid rgba(180,255,0,0.2)",
            }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F0EFE8", marginBottom: 14 }}>
                🔊 Deine KI-Stimme
              </div>
              <audio controls src={audioUrl} style={{ width: "100%", marginBottom: 14 }} />
              <a
                href={audioUrl} download="influexai-stimme.mp3"
                style={{
                  display: "block", textAlign: "center",
                  padding: "11px", borderRadius: 10,
                  background: "#B4FF00", color: "#060608",
                  fontWeight: 700, fontSize: "0.88rem",
                  textDecoration: "none",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                ⬇ Audio herunterladen
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

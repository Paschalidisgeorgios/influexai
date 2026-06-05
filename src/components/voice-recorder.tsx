"use client";

import { useRef, useState } from "react";

type VoiceRecorderProps = {
  script: string;
  onScriptChange: (value: string) => void;
  scriptMaxLength?: number;
  recordedUrl: string | null;
  onRecordedUrlChange: (url: string | null) => void;
  onRecordedBlobChange?: (blob: Blob | null) => void;
};

export function VoiceRecorder({
  script,
  onScriptChange,
  scriptMaxLength = 500,
  recordedUrl,
  onRecordedUrlChange,
  onRecordedBlobChange,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const clearRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    onRecordedUrlChange(null);
    onRecordedBlobChange?.(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const url = URL.createObjectURL(blob);
        onRecordedBlobChange?.(blob);
        onRecordedUrlChange(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch {
      alert(
        "Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "transparent",
    border: "none",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none" as const,
    fontFamily: "var(--font-dm), sans-serif",
    resize: "vertical" as const,
    lineHeight: 1.6,
    minHeight: 100,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "0.7rem",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          Dein Script
        </p>
        <textarea
          value={script}
          onChange={(e) =>
            onScriptChange(e.target.value.slice(0, scriptMaxLength))
          }
          placeholder="Schreibe hier deinen Text, den du sprechen möchtest..."
          style={inputStyle}
        />
        <p
          style={{
            textAlign: "right",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            marginTop: 6,
          }}
        >
          {script.length} / {scriptMaxLength}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#B4FF00",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              transition: "transform 0.15s, background 0.15s",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            🎤
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#ef4444",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            ⏹
          </button>
        )}

        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
          {isRecording
            ? "🔴 Aufnahme läuft… Klick zum Stoppen"
            : recordedUrl
              ? "✅ Aufnahme bereit"
              : "Klick zum Starten"}
        </p>
      </div>

      {recordedUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <audio controls src={recordedUrl} style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={clearRecording}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Neu aufnehmen
            </button>
            <button
              type="button"
              onClick={() => {
                const a = document.createElement("a");
                a.href = recordedUrl;
                a.download = "meine-stimme.webm";
                a.click();
              }}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 12,
                border: "none",
                background: "#B4FF00",
                color: "#060608",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Herunterladen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

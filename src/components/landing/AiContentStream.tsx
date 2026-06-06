"use client";

import { useEffect, useRef } from "react";

const STREAM_CARDS = [
  { title: "Hook generiert", label: "AI Hook · TikTok", value: "✓" },
  { title: "Script Score", label: "Produkt-Script", value: "94%" },
  { title: "Video-Idee", label: "Reel · 30s Format", value: "✓" },
  { title: "Caption optimiert", label: "Instagram · DE", value: "✓" },
  { title: "Brand Match", label: "Creator × Brand", value: "89%" },
  { title: "Trend erkannt", label: "YouTube · DE", value: "↑" },
  { title: "Posting-Zeit", label: "Optimal · 18:30", value: "✓" },
  { title: "Voiceover", label: "InfluexAI Voice", value: "✓" },
  { title: "Reel Plan", label: "7-Tage · TikTok", value: "✓" },
  { title: "Retention", label: "Hook-Analyse", value: "+31%" },
  { title: "Thumbnail Score", label: "KI Bewertung", value: "91%" },
  { title: "Mein KI-Ich", label: "Avatar generiert", value: "✓" },
] as const;

function StreamCard({
  title,
  label,
  value,
}: {
  title: string;
  label: string;
  value: string;
}) {
  return (
    <article className="ai-content-stream__card">
      <span className="ai-content-stream__dot" aria-hidden />
      <div className="ai-content-stream__card-body">
        <span className="ai-content-stream__card-title">{title}</span>
        <span className="ai-content-stream__card-label">{label}</span>
      </div>
      <span className="ai-content-stream__card-value">{value}</span>
    </article>
  );
}

export function AiContentStream() {
  const trackRef = useRef<HTMLDivElement>(null);
  const clonedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || clonedRef.current) return;
    track.innerHTML += track.innerHTML;
    clonedRef.current = true;
  }, []);

  return (
    <section
      className="ai-content-stream"
      aria-label="Live AI Output Stream"
      style={{ background: "#060608" }}
    >
      <p className="ai-content-stream__heading">
        <span className="ai-content-stream__heading-dot" aria-hidden />
        Live AI Output Stream
      </p>
      <div className="ai-content-stream__viewport">
        <div ref={trackRef} className="ai-content-stream__track">
          {STREAM_CARDS.map((card) => (
            <StreamCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

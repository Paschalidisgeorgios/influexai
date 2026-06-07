"use client";

import { useEffect, useRef } from "react";
import { activityStreamItems } from "@/data/landingAgentDemos";

function StreamCard({
  action,
  context,
  badge,
}: {
  action: string;
  context: string;
  badge: string;
}) {
  return (
    <article className="ai-content-stream__card">
      <span className="ai-content-stream__dot" aria-hidden />
      <div className="ai-content-stream__card-body">
        <span className="ai-content-stream__card-title">{action}</span>
        <span className="ai-content-stream__card-label">{context}</span>
      </div>
      <span className="ai-content-stream__card-value">{badge}</span>
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
      aria-label="Agent Activity Stream"
      style={{ background: "#060608" }}
    >
      <p className="ai-content-stream__heading">
        <span className="ai-content-stream__heading-dot" aria-hidden />
        Agent Activity Stream
      </p>
      <div className="ai-content-stream__viewport">
        <div ref={trackRef} className="ai-content-stream__track">
          {activityStreamItems.map((item) => (
            <StreamCard
              key={item.id}
              action={item.action}
              context={item.context}
              badge={item.badge}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

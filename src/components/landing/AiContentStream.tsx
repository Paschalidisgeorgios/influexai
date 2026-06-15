"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ACTIVITY_STREAM_IDS } from "@/data/landingAgentDemos";

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
  const t = useTranslations("landingPage.demos");
  const tl = useTranslations("landingPage.demos.labels");
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
      aria-label={tl("agentActivityStream")}
      style={{ background: "#060608" }}
    >
      <p className="ai-content-stream__heading">
        <span className="ai-content-stream__heading-dot" aria-hidden />
        {tl("agentActivityStream")}
        <span
          className="ml-2 inline-block rounded-[4px] px-1.5 py-0.5 text-sm font-semibold tracking-wide"
          style={{
            color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.12)",
            verticalAlign: "middle",
          }}
        >
          {tl("demo")}
        </span>
      </p>
      <div className="ai-content-stream__viewport">
        <div ref={trackRef} className="ai-content-stream__track">
          {ACTIVITY_STREAM_IDS.map((id) => (
            <StreamCard
              key={id}
              action={t(`activity.${id}.action`)}
              context={t(`activity.${id}.context`)}
              badge={t(`activity.${id}.badge`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

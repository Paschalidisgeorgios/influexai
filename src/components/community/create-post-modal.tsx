"use client";

import { useEffect, useState } from "react";
import { createCommunityPost } from "@/app/actions/community";
import { POST_TYPE_META, type CommunityPostType } from "@/lib/community";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultNiche: string;
  challenge?: {
    id: string;
    title: string;
  } | null;
  onPosted: () => void;
};

const TYPES: CommunityPostType[] = ["win", "idea", "question"];

export function CreatePostModal({
  open,
  onClose,
  defaultNiche,
  challenge,
  onPosted,
}: Props) {
  const [type, setType] = useState<CommunityPostType>("win");
  const [content, setContent] = useState("");
  const [metric, setMetric] = useState("");
  const [niche, setNiche] = useState(defaultNiche);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNiche(defaultNiche);
      if (challenge) {
        setType("win");
        setContent(`Challenge: ${challenge.title}\n\n`);
      }
    }
  }, [open, defaultNiche, challenge]);

  if (!open) return null;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await createCommunityPost({
      type,
      content,
      metric: type === "win" ? metric : undefined,
      niche,
      challengeId: challenge?.id,
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setContent("");
    setMetric("");
    onPosted();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(6,6,8,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          padding: 24,
          borderRadius: 16,
          background: "#0f0f12",
          border: "1px solid rgba(180,255,0,0.2)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.5rem",
            color: "#F0EFE8",
            marginBottom: 16,
          }}
        >
          Neuer Post
        </h2>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {TYPES.map((t) => (
            <label
              key={t}
              style={{
                flex: 1,
                minWidth: 100,
                padding: "10px 12px",
                borderRadius: 10,
                border:
                  type === t
                    ? "2px solid #B4FF00"
                    : "1px solid rgba(255,255,255,0.1)",
                background: type === t ? "rgba(180,255,0,0.08)" : "transparent",
                cursor: "pointer",
                textAlign: "center",
                fontSize: "0.82rem",
                fontWeight: type === t ? 700 : 500,
                color: type === t ? "#B4FF00" : "rgba(255,255,255,0.65)",
              }}
            >
              <input
                type="radio"
                name="postType"
                checked={type === t}
                onChange={() => setType(t)}
                style={{ display: "none" }}
              />
              {POST_TYPE_META[t].badge}
            </label>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 280))}
          placeholder="Was möchtest du teilen?"
          rows={5}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#18181d",
            color: "#F0EFE8",
            fontSize: "0.9rem",
            fontFamily: "inherit",
            resize: "vertical",
            marginBottom: 6,
          }}
        />
        <div
          style={{
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            marginBottom: 14,
            textAlign: "right",
          }}
        >
          {content.length}/280
        </div>

        {type === "win" && (
          <input
            value={metric}
            onChange={(e) => setMetric(e.target.value.slice(0, 80))}
            placeholder='Dein Ergebnis/Metric (z.B. "47K Views")'
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#18181d",
              color: "#F0EFE8",
              fontSize: "0.85rem",
              fontFamily: "inherit",
              marginBottom: 12,
            }}
          />
        )}

        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value.slice(0, 60))}
          placeholder="Nische / Tag"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#18181d",
            color: "#F0EFE8",
            fontSize: "0.85rem",
            fontFamily: "inherit",
            marginBottom: 16,
          }}
        />

        {error && (
          <p
            style={{ color: "#ff6b7a", fontSize: "0.82rem", marginBottom: 12 }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !content.trim()}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {submitting ? "…" : "Posten"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.65)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

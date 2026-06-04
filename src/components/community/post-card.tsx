"use client";

import { useEffect, useState } from "react";
import {
  POST_TYPE_META,
  REACTIONS,
  formatRelativeTime,
  initials,
  type CommunityPost,
  type CommunityReactionType,
} from "@/lib/community";
import { reactToPost, replyToPost, reportPost } from "@/app/actions/community";

type Props = {
  post: CommunityPost;
  isLoggedIn: boolean;
  rankBorder?: "gold" | "silver" | "bronze" | null;
  large?: boolean;
  onRefresh?: () => void;
};

const RANK_STYLES = {
  gold: "2px solid #f59e0b",
  silver: "2px solid #c0c0c0",
  bronze: "2px solid #cd7f32",
};

export function PostCard({
  post,
  isLoggedIn,
  rankBorder,
  large,
  onRefresh,
}: Props) {
  const [local, setLocal] = useState(post);
  useEffect(() => {
    setLocal(post);
  }, [post]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [reported, setReported] = useState(false);

  const meta = POST_TYPE_META[local.type];

  const handleReact = async (type: CommunityReactionType) => {
    if (!isLoggedIn) return;
    setReacting(true);
    const res = await reactToPost(local.id, type);
    setReacting(false);
    if (!res.success) return;

    onRefresh?.();
  };

  const handleReply = async () => {
    if (!isLoggedIn || !replyText.trim()) return;
    setReplying(true);
    const res = await replyToPost(local.id, replyText);
    setReplying(false);
    if (res.success) {
      setReplyText("");
      onRefresh?.();
    }
  };

  const handleReport = async () => {
    if (!isLoggedIn || reported) return;
    const res = await reportPost(local.id, "Unangemessener Inhalt");
    if (res.success) setReported(true);
  };

  return (
    <article
      style={{
        padding: large ? 22 : 16,
        borderRadius: 14,
        background: "#0f0f12",
        border: rankBorder
          ? RANK_STYLES[rankBorder]
          : "1px solid rgba(255,255,255,0.07)",
        breakInside: "avoid",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: large ? 44 : 38,
            height: large ? 44 : 38,
            borderRadius: "50%",
            background: "rgba(180,255,0,0.12)",
            border: "1px solid rgba(180,255,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.85rem",
            color: "#B4FF00",
            flexShrink: 0,
          }}
        >
          {initials(local.author.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{ fontWeight: 700, color: "#F0EFE8", fontSize: "0.9rem" }}
            >
              {local.author.name}
            </span>
            {local.niche && (
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.05)",
                  color: "#505055",
                }}
              >
                {local.niche}
              </span>
            )}
            <span
              style={{
                fontSize: "0.65rem",
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(180,255,0,0.08)",
                color: "#B4FF00",
                fontWeight: 600,
              }}
            >
              {meta.badge}
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#505055",
                marginLeft: "auto",
              }}
            >
              {formatRelativeTime(local.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          fontSize: large ? "1rem" : "0.9rem",
          color: "rgba(240,239,232,0.85)",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
        }}
      >
        {local.content}
      </p>

      {local.metric && (
        <span
          style={{
            display: "inline-block",
            marginBottom: 12,
            padding: "4px 12px",
            borderRadius: 8,
            background: "rgba(180,255,0,0.1)",
            border: "1px solid rgba(180,255,0,0.2)",
            color: "#B4FF00",
            fontSize: "0.78rem",
            fontWeight: 700,
          }}
        >
          {local.metric}
        </span>
      )}

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}
      >
        {REACTIONS.map((r) => {
          const count =
            r.type === "fire"
              ? local.reactionsFire
              : r.type === "applause"
                ? local.reactionsApplause
                : local.reactionsInsight;
          const active = local.userReaction === r.type;
          return (
            <button
              key={r.type}
              type="button"
              disabled={!isLoggedIn || reacting}
              onClick={() => handleReact(r.type)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: active
                  ? "1px solid rgba(180,255,0,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(180,255,0,0.1)" : "transparent",
                color: active ? "#B4FF00" : "rgba(240,239,232,0.55)",
                fontSize: "0.78rem",
                cursor: isLoggedIn ? "pointer" : "default",
                fontFamily: "inherit",
              }}
            >
              {r.emoji} {count}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: "0.78rem" }}>
        <button
          type="button"
          onClick={() => setShowReplies(!showReplies)}
          style={{
            background: "none",
            border: "none",
            color: "#B4FF00",
            cursor: "pointer",
            fontWeight: 600,
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          Antworten {local.replyCount > 0 ? `(${local.replyCount})` : ""}
        </button>
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleReport}
            disabled={reported}
            style={{
              background: "none",
              border: "none",
              color: reported ? "#505055" : "#505055",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            {reported ? "Gemeldet ✓" : "Melden"}
          </button>
        )}
      </div>

      {showReplies && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {local.replies.map((r) => (
            <div key={r.id} style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#505055",
                  marginBottom: 4,
                }}
              >
                <strong style={{ color: "#F0EFE8" }}>{r.author.name}</strong> ·{" "}
                {formatRelativeTime(r.createdAt)}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "rgba(240,239,232,0.7)",
                }}
              >
                {r.content}
              </p>
            </div>
          ))}
          {local.replyCount > 3 && (
            <p
              style={{
                fontSize: "0.72rem",
                color: "#505055",
                margin: "0 0 10px",
              }}
            >
              + {local.replyCount - 3} weitere Antworten
            </p>
          )}
          {isLoggedIn ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value.slice(0, 140))}
                placeholder="Antwort schreiben…"
                maxLength={140}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#18181d",
                  color: "#F0EFE8",
                  fontSize: "0.82rem",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#B4FF00",
                  color: "#060608",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Senden
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "0.78rem", color: "#505055" }}>
              <a href="/login" style={{ color: "#B4FF00" }}>
                Melde dich an
              </a>{" "}
              um zu antworten.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

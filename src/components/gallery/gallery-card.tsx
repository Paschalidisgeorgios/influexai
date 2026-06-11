"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { ThumbnailPreview } from "@/components/thumbnail-preview";
import { ImageResultActions } from "@/components/image/ImageResultActions";
import { VideoResultActions } from "@/components/image/VideoResultActions";
import type { GalleryItem } from "@/lib/gallery-types";
import { countWords } from "@/lib/script-format";

type GalleryCardProps = {
  item: GalleryItem;
  onDelete: (id: string, type: string) => Promise<void>;
  onOpenMedia?: (item: GalleryItem) => void;
};

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  overflow: "hidden" as const,
  display: "flex",
  flexDirection: "column" as const,
  minHeight: 0,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSpeakingTime(words: number) {
  const sec = Math.round(words / 2.5);
  if (sec < 60) return `~${sec} Sek`;
  return `~${Math.round(sec / 60)} Min`;
}

function competitionLabel(level: string) {
  if (level === "low") return "Niedrig";
  if (level === "high") return "Hoch";
  return "Mittel";
}

function ctrLabel(level: string) {
  if (level === "high") return "Hoch";
  if (level === "low") return "Niedrig";
  return "Mittel";
}

function Badge({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "rgba(240,239,232,0.7)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>{emoji}</span>
      {label}
    </span>
  );
}

function CardHeader({
  item,
  badge,
  onDelete,
  canDelete,
}: {
  item: GalleryItem;
  badge: { emoji: string; label: string };
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div
      style={{
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
        position: "relative",
      }}
    >
      <div>
        <Badge emoji={badge.emoji} label={badge.label} />
        <p
          style={{
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            marginTop: 4,
          }}
        >
          {formatDate(item.created_at)}
        </p>
      </div>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          aria-label="Menü"
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 36,
                zIndex: 50,
                minWidth: 140,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: 4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <button
                type="button"
                disabled
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "rgba(240,239,232,0.25)",
                  fontSize: "0.82rem",
                  cursor: "not-allowed",
                }}
              >
                Teilen (bald)
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    color: "#ff6b7a",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  Löschen
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {confirmOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(6,6,8,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            style={{
              maxWidth: 400,
              width: "100%",
              background: "#18181d",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ color: "#F0EFE8", marginBottom: 20, lineHeight: 1.5 }}>
              Diese Creation wirklich löschen? Diese Aktion kann nicht rückgängig
              gemacht werden.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "#F0EFE8",
                  cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete();
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#ff6b7a",
                  color: "#060608",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 14px 14px",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: "auto",
      }}
    >
      {children}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  href,
  primary,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}) {
  const style = {
    padding: "8px 12px",
    minHeight: 44,
    borderRadius: 8,
    fontSize: "0.78rem",
    fontWeight: 600,
    border: primary ? "none" : "1px solid rgba(255,255,255,0.12)",
    background: primary ? "rgba(180,255,0,0.12)" : "transparent",
    color: primary ? "#B4FF00" : "rgba(255,255,255,0.85)",
    cursor: "pointer",
    textDecoration: "none",
  } as const;

  if (href) {
    return (
      <Link href={href} style={style}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style}>
      {label}
    </button>
  );
}

function GalleryImagePreview({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <>📸</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
}

function GalleryVideoPreview({
  src,
  onUnavailable,
}: {
  src: string | null | undefined;
  onUnavailable?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)" }}>
        Video noch nicht verfügbar
      </span>
    );
  }

  if (failed) {
    return (
      <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)" }}>
        Video-Vorschau nicht verfügbar
      </span>
    );
  }

  return (
    <video
      src={src}
      preload="metadata"
      playsInline
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => {
        setFailed(true);
        onUnavailable?.();
      }}
    />
  );
}

function videoRegenerateHref(generationType?: string | null): string {
  const t = generationType?.toLowerCase() ?? "";
  if (t.includes("live-creator")) return "/dashboard/live-creator";
  if (t === "seedance") return "/dashboard/seedance";
  if (t === "motion-transfer") return "/dashboard/motion-transfer";
  if (t.includes("ugc-video")) return "/dashboard/ugc-video";
  if (t.includes("live-portrait")) return "/dashboard/live-portrait";
  if (t === "product_ad" || t.includes("produkt")) return "/dashboard/produkt";
  return "/dashboard/produkt";
}

function videoTypeLabel(generationType?: string | null): string {
  const t = generationType?.toLowerCase() ?? "";
  if (t.includes("live-creator")) return "Live Creator";
  if (t === "seedance") return "Bild zu Video";
  if (t === "motion-transfer") return "Motion Transfer";
  if (t.includes("ugc-video")) return "UGC Video";
  if (t === "product_ad") return "Produkt-Werbung";
  if (t.includes("live-portrait")) return "Live Portrait";
  return "Video";
}

export function GalleryCard({ item, onDelete, onOpenMedia }: GalleryCardProps) {
  const router = useRouter();
  const canDelete = !["image", "video"].includes(item._type);

  const handleDelete = () => onDelete(item.id, item._type);
  const openMedia = () => {
    if (onOpenMedia) onOpenMedia(item);
  };

  const scriptTopic = encodeURIComponent(item.title);
  const goScript = () =>
    router.push(`/dashboard/script-generator?topic=${scriptTopic}`);
  const goOutlier = () =>
    router.push(
      `/dashboard/outlier-detector?niche=${encodeURIComponent(item.title)}`
    );

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const bodyPadding = { padding: "0 14px 8px", flex: 1 };

  if (item._type === "script" && item.script) {
    const words = countWords(item.script);
    const preview = item.script
      .replace(/\[HOOK\]|\[MAIN\]|\[CTA\]/gi, "")
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(0, 3)
      .join("\n");

    return (
      <article style={cardStyle}>
        <CardHeader
          item={item}
          badge={{ emoji: "📝", label: "Script" }}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
        <div style={bodyPadding}>
          <h3
            style={{
              color: "#F0EFE8",
              fontSize: "0.95rem",
              fontWeight: 700,
              marginBottom: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.title}
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.82rem",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {preview}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.65)",
              marginTop: 10,
            }}
          >
            {words} Wörter · {formatSpeakingTime(words)}
          </p>
        </div>
        <ActionRow>
          <ActionBtn label="Kopieren" onClick={() => copyText(item.script!)} />
          <ActionBtn
            label="Öffnen"
            href={`/dashboard/script-generator?saved=${item.id}`}
            primary
          />
        </ActionRow>
      </article>
    );
  }

  if (item._type === "thumbnail" && item.concepts?.length) {
    const concept = item.concepts[0];
    return (
      <article style={cardStyle}>
        <CardHeader
          item={item}
          badge={{ emoji: "🎯", label: "Thumbnail" }}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
        <div style={{ ...bodyPadding, paddingTop: 0 }}>
          <h3
            style={{
              color: "#F0EFE8",
              fontSize: "0.95rem",
              fontWeight: 700,
              marginBottom: 10,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.title}
          </h3>
          <div
            style={{
              borderRadius: 10,
              overflow: "hidden",
              aspectRatio: "16/9",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ThumbnailPreview layout={concept.cssLayout} />
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: 10,
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(180,255,0,0.1)",
              color: "#B4FF00",
            }}
          >
            CTR {ctrLabel(concept.ctrPrediction)}
          </span>
        </div>
        <ActionRow>
          <ActionBtn
            label="Kopieren"
            onClick={() =>
              copyText(
                `${item.title}\n\n${concept.layoutDescription}\n\n${concept.textOverlays.map((t) => t.text).join(" · ")}`
              )
            }
          />
          <ActionBtn label="Script generieren" onClick={goScript} primary />
        </ActionRow>
      </article>
    );
  }

  if (item._type === "niche" && item.nicheData) {
    const n = item.nicheData;
    return (
      <article style={cardStyle}>
        <CardHeader
          item={item}
          badge={{ emoji: "📈", label: "Niche" }}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
        <div style={bodyPadding}>
          <h3 style={{ color: "#F0EFE8", fontSize: "0.95rem", fontWeight: 700 }}>
            {n.title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
            Wettbewerb: {competitionLabel(n.competition)} · Potenzial:{" "}
            {"★".repeat(n.potential)}
          </p>
          <ul
            style={{
              marginTop: 10,
              paddingLeft: 16,
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.45,
            }}
          >
            {n.videoIdeas.slice(0, 3).map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </div>
        <ActionRow>
          <ActionBtn label="Script generieren" onClick={goScript} />
          <ActionBtn label="Outlier finden" onClick={goOutlier} primary />
        </ActionRow>
      </article>
    );
  }

  if (item._type === "outlier" && item.outliers?.length) {
    const top = item.outliers[0];
    return (
      <article style={cardStyle}>
        <CardHeader
          item={item}
          badge={{ emoji: "🔥", label: "Outlier" }}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
        <div style={bodyPadding}>
          <h3 style={{ color: "#F0EFE8", fontSize: "0.95rem", fontWeight: 700 }}>
            {item.title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "2.5rem",
              color: "#B4FF00",
              lineHeight: 1,
              margin: "8px 0",
            }}
          >
            {top.outlierScore.toFixed(1)}
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.8)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {top.title}
          </p>
        </div>
        <ActionRow>
          <ActionBtn label="Script generieren" onClick={goScript} primary />
        </ActionRow>
      </article>
    );
  }

  if (item._type === "remix" && item.remixes?.length) {
    const top = item.remixes[0];
    return (
      <article style={cardStyle}>
        <CardHeader
          item={item}
          badge={{ emoji: "🔄", label: "Remix" }}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
        <div style={bodyPadding}>
          <h3 style={{ color: "#F0EFE8", fontSize: "0.95rem", fontWeight: 700 }}>
            {top.remixTitle}
          </h3>
          <span
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(180,255,0,0.1)",
              color: "#B4FF00",
            }}
          >
            {top.similarityPercent}% Ähnlichkeit
          </span>
        </div>
        <ActionRow>
          <ActionBtn label="Script generieren" onClick={goScript} primary />
        </ActionRow>
      </article>
    );
  }

  if (item._type === "image") {
    return (
      <article style={cardStyle}>
        <CardHeader
          item={item}
          badge={{ emoji: "🎭", label: "KI-Ich" }}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
        <div style={{ ...bodyPadding, paddingTop: 0 }}>
          <button
            type="button"
            onClick={openMedia}
            disabled={!item.imageUrl || !onOpenMedia}
            style={{
              width: "100%",
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: item.imageUrl && onOpenMedia ? "pointer" : "default",
              textAlign: "left",
            }}
          >
              <div
                style={{
                  aspectRatio: "1",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #18181d, #0f0f12)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {item.imageUrl ? (
                  <GalleryImagePreview src={item.imageUrl} />
                ) : (
                  "📸"
                )}
              </div>
            </button>
            <p
              style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.65)",
                marginTop: 8,
              }}
            >
              {item.generationType?.includes("preview")
                ? "Hochauflösend generieren →"
                : item.title}
            </p>
          </div>
          <ActionRow>
            <ImageResultActions
              variant="gallery"
              embedded
              imageUrl={item.imageUrl}
              prompt={item.prompt}
            />
            {item.imageUrl && onOpenMedia && (
              <ActionBtn label="Vorschau" onClick={openMedia} primary />
            )}
            <ActionBtn label="Neu generieren" href="/dashboard/ki-influencer" />
          </ActionRow>
      </article>
    );
  }

  if (item._type === "video") {
    const hasVideo = Boolean(item.videoUrl?.trim());
    const badgeLabel = videoTypeLabel(item.generationType);

    return (
      <article style={cardStyle}>
          <CardHeader
            item={item}
            badge={{ emoji: "🎬", label: badgeLabel }}
            onDelete={handleDelete}
            canDelete={canDelete}
          />
          <div style={{ ...bodyPadding, paddingTop: 0 }}>
            <button
              type="button"
              onClick={openMedia}
              disabled={!hasVideo || !onOpenMedia}
              style={{
                width: "100%",
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: hasVideo && onOpenMedia ? "pointer" : "default",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  aspectRatio: "16/9",
                  borderRadius: 10,
                  background: "#0f0f12",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <GalleryVideoPreview src={item.videoUrl} />
                {hasVideo && onOpenMedia && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(6,6,8,0.35)",
                      color: "#B4FF00",
                      fontSize: "2rem",
                      pointerEvents: "none",
                    }}
                    aria-hidden
                  >
                    ▶
                  </span>
                )}
              </div>
            </button>
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.8)",
                marginTop: 8,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.title}
            </p>
            {!hasVideo && (
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 6,
                }}
              >
                Quelle fehlt — Video kann nicht abgespielt werden.
              </p>
            )}
          </div>
          <ActionRow>
            {hasVideo ? (
              <VideoResultActions
                variant="gallery"
                embedded
                videoUrl={item.videoUrl}
                onPlay={onOpenMedia ? openMedia : undefined}
              />
            ) : (
              <ActionBtn
                label="Neu generieren"
                href={videoRegenerateHref(item.generationType)}
                primary
              />
            )}
          </ActionRow>
      </article>
    );
  }

  if (item._type === "audio") {
    const hasAudio = Boolean(item.audioUrl?.trim());

    return (
      <article style={cardStyle}>
        <CardHeader
          item={item}
          badge={{ emoji: "🎙️", label: "KI Stimme" }}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
        <div style={{ ...bodyPadding, paddingTop: 0 }}>
          <div
            style={{
              borderRadius: 10,
              background: "#18181d",
              border: "1px solid rgba(180,255,0,0.15)",
              padding: 14,
            }}
          >
            {hasAudio ? (
              <audio
                controls
                src={item.audioUrl!}
                style={{ width: "100%" }}
              />
            ) : (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                }}
              >
                Audio nicht verfügbar.
              </p>
            )}
          </div>
          {item.prompt && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.65)",
                marginTop: 8,
                lineHeight: 1.45,
              }}
            >
              {item.prompt.length > 140
                ? `${item.prompt.slice(0, 140)}…`
                : item.prompt}
            </p>
          )}
        </div>
        <ActionRow>
          <ActionBtn label="Neu generieren" href="/dashboard/voice" primary />
        </ActionRow>
      </article>
    );
  }

  return null;
}

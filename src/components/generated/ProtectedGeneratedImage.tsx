"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  locked?: boolean;
  unlockLabel?: string;
  unlockHint?: string;
  onUnlock?: () => void;
  unlockLoading?: boolean;
  generationId?: string;
  showDownload?: boolean;
  downloadLabel?: string;
  className?: string;
  aspectClassName?: string;
};

export function ProtectedGeneratedImage({
  src,
  alt,
  locked = false,
  unlockLabel = "Jetzt freischalten",
  unlockHint = "Hochauflösend freischalten — 2 Credits",
  onUnlock,
  unlockLoading = false,
  generationId,
  showDownload = false,
  downloadLabel = "Herunterladen",
  className = "",
  aspectClassName = "",
}: Props) {
  const [loadError, setLoadError] = useState(false);

  const handleDownload = () => {
    if (!generationId) return;
    window.location.href = `/api/download/${generationId}`;
  };

  return (
    <div
      className={`image-wrapper generated-image-wrapper ${
        locked ? "" : "generated-image-wrapper--unlocked"
      } ${className}`}
    >
      <div
        className={`relative overflow-hidden rounded-[20px] border ${
          locked
            ? "border-white/12"
            : "border-[rgba(180,255,0,0.2)]"
        } ${aspectClassName}`}
        style={{ minHeight: 280, background: "#0f0f12" }}
      >
        {loadError ? (
          <div className="flex min-h-[280px] items-center justify-center px-6 text-center text-sm text-white/60">
            Vorschau konnte nicht geladen werden. Bitte Seite neu laden oder
            erneut generieren.
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onError={() => setLoadError(true)}
            className={`generated-image block h-auto w-full ${
              locked ? "opacity-90 scale-[1.01]" : ""
            }`}
            style={{
              userSelect: "none",
              WebkitUserDrag: "none",
              filter: locked ? "blur(2px) brightness(0.92)" : undefined,
            } as React.CSSProperties}
          />
        )}

        {locked && !loadError && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/10 px-6 text-center"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50">
              <Lock className="h-5 w-5 text-[#B4FF00]" aria-hidden />
            </div>
            <p
              className="max-w-xs text-sm font-medium text-white/90"
              style={{ fontFamily: "var(--font-dm), sans-serif" }}
            >
              {unlockHint}
            </p>
            {onUnlock && (
              <button
                type="button"
                onClick={onUnlock}
                disabled={unlockLoading}
                className="rounded-xl bg-[#B4FF00] px-5 py-2.5 text-sm font-bold text-[#060608] transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ fontFamily: "var(--font-dm), sans-serif" }}
              >
                {unlockLoading ? "Wird generiert…" : unlockLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {showDownload && generationId && !locked && (
        <button
          type="button"
          onClick={handleDownload}
          className="mt-3 w-full rounded-[10px] bg-[#B4FF00] py-3 text-center text-sm font-bold text-[#060608]"
          style={{ fontFamily: "var(--font-dm), sans-serif" }}
        >
          ⬇ {downloadLabel}
        </button>
      )}
    </div>
  );
}

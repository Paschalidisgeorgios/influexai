"use client";

import Image from "next/image";
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
      >
        <Image
          src={src}
          alt={alt}
          width={1024}
          height={1024}
          unoptimized
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className={`generated-image block h-auto w-full ${
            locked ? "blur-[2px] scale-[1.02]" : ""
          }`}
          style={{
            userSelect: "none",
            WebkitUserDrag: "none",
          } as React.CSSProperties}
        />

        {locked && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/35 px-6 text-center"
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

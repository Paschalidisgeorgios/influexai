"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryMediaItem } from "@/lib/gallery-media-client";
import {
  downloadImageFromUrl,
  downloadVideoFromUrl,
  openImageInNewTab,
  openVideoInNewTab,
} from "@/lib/image-result-actions";

type GalleryLightboxProps = {
  items: GalleryMediaItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function GalleryLightbox({
  items,
  index,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = items[index];

  const pauseVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  const handleClose = useCallback(() => {
    pauseVideo();
    onClose();
  }, [onClose, pauseVideo]);

  const goPrev = useCallback(() => {
    if (items.length <= 1) return;
    pauseVideo();
    onNavigate((index - 1 + items.length) % items.length);
  }, [index, items.length, onNavigate, pauseVideo]);

  const goNext = useCallback(() => {
    if (items.length <= 1) return;
    pauseVideo();
    onNavigate((index + 1) % items.length);
  }, [index, items.length, onNavigate, pauseVideo]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, handleClose]);

  useEffect(() => {
    pauseVideo();
  }, [index, pauseVideo]);

  if (!current) return null;

  const hasNav = items.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.title || "Medien-Vorschau"}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#060608]/92 p-4 sm:p-6"
      onClick={handleClose}
    >
      {hasNav && (
        <button
          type="button"
          aria-label="Vorheriges Medium"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#B4FF00]/35 bg-[#060608]/80 text-[#B4FF00] hover:bg-[#B4FF00]/10 sm:left-5"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
      )}

      {hasNav && (
        <button
          type="button"
          aria-label="Nächstes Medium"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#B4FF00]/35 bg-[#060608]/80 text-[#B4FF00] hover:bg-[#B4FF00]/10 sm:right-5"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      )}

      <button
        type="button"
        aria-label="Schließen"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#B4FF00]/35 bg-[#060608]/80 text-[#B4FF00] hover:bg-[#B4FF00]/10"
      >
        <X size={20} strokeWidth={2.5} />
      </button>

      <div
        className="relative flex max-h-[92vh] w-full max-w-[min(960px,96vw)] flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3 pr-12">
          <p className="truncate text-sm font-semibold text-[#F0EFE8]">
            {current.title || "Vorschau"}
          </p>
          {hasNav && (
            <span className="shrink-0 text-xs text-white/45">
              {index + 1} / {items.length}
            </span>
          )}
        </div>

        {current.kind === "video" ? (
          <video
            ref={videoRef}
            key={current.src}
            src={current.src}
            controls
            autoPlay
            playsInline
            className="max-h-[90vh] w-full rounded-xl bg-black object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.src}
            src={current.src}
            alt={current.title || ""}
            className="max-h-[90vh] w-full rounded-xl bg-[#0f0f12] object-contain"
          />
        )}

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (current.kind === "video") {
                openVideoInNewTab(current.src);
              } else {
                openImageInNewTab(current.src);
              }
            }}
            className="min-h-[44px] rounded-lg border border-white/12 px-3 py-2 text-xs font-semibold text-[#F0EFE8] hover:border-[#B4FF00]/35"
          >
            {current.kind === "video" ? "Video öffnen" : "In neuem Tab öffnen"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (current.kind === "video") {
                void downloadVideoFromUrl(current.src);
              } else {
                void downloadImageFromUrl(current.src);
              }
            }}
            className="min-h-[44px] rounded-lg border border-[#B4FF00]/35 px-3 py-2 text-xs font-semibold text-[#B4FF00] hover:bg-[#B4FF00]/10"
          >
            {current.kind === "video" ? "Video herunterladen" : "Herunterladen"}
          </button>
        </div>
      </div>
    </div>
  );
}

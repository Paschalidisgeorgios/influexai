"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";

type UploadBoxProps = {
  label: string;
  accept: string;
  kind: "image" | "audio";
  previewUrl?: string | null;
  previewName?: string;
  error?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav"];

export function UploadBox({
  label,
  accept,
  kind,
  previewUrl,
  previewName,
  error,
  onFile,
  onRemove,
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validate = (file: File) => {
    const allowed = kind === "image" ? IMAGE_TYPES : AUDIO_TYPES;
    return allowed.some((t) => file.type === t || file.name.endsWith(".mp3"));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && validate(file)) onFile(file);
    },
    [onFile, kind]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className="relative cursor-pointer rounded-[14px] border border-dashed p-6 text-center transition-all duration-[1200ms] ease-in-out"
      style={{
        borderColor: error
          ? "#ff6b7a"
          : dragOver
            ? "var(--szenen-accent-30)"
            : "rgba(255,255,255,0.1)",
        background: dragOver ? "var(--szenen-accent-10)" : "rgba(255,255,255,0.02)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && validate(f)) onFile(f);
        }}
      />
      {previewUrl || previewName ? (
        <div className="relative">
          {previewUrl && kind === "image" ? (
            <div className="relative mx-auto h-36 w-full max-w-sm overflow-hidden rounded-lg">
              <Image src={previewUrl} alt={label} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <p className="text-sm text-white/50">{previewName ?? "Datei hochgeladen"}</p>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-0 top-0 rounded-full bg-black/60 p-1 text-white/70 hover:text-white"
            aria-label="Entfernen"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <Upload size={22} className="mx-auto text-white/25" />
          <p className="mt-2 text-[13px] text-white/50">{label}</p>
          <p className="mt-1 text-[11px] text-white/25">Drag & Drop oder klicken</p>
        </>
      )}
    </div>
  );
}

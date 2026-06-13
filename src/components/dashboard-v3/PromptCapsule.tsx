"use client";

import { useCallback, useRef, useState } from "react";
import { useDashboardV3 } from "@/lib/dashboard-v3/context";

export function PromptCapsule() {
  const {
    activeModel,
    theme,
    prompt,
    setPrompt,
    params,
    setParam,
    uploadedFiles,
    setUploadedFile,
    removeUploadedFile,
    userName,
    setUserName,
    dialogStep,
    advanceDialog,
    capsule,
    triggerImpulse,
    setIsGenerating,
    credits,
  } = useDashboardV3();

  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const nameSubmittedRef = useRef(false);

  const duration = params["duration"] ?? activeModel.durations[0];
  const resolution = params["resolution"] ?? activeModel.resolutions[0];

  const handleGenerate = useCallback(() => {
    if (dialogStep === 0 && prompt.trim() && !userName) {
      setUserName(prompt.trim());
      nameSubmittedRef.current = true;
      capsule.showMessage(`${prompt.trim()} — schön, ${prompt.trim()}! Was möchtest du erstellen?`, 5000, 8);
      window.setTimeout(() => {
        capsule.showMessage(
          `Beschreibe deine Idee, ${prompt.trim()} — wir starten von hier.`,
          6000,
          7
        );
        advanceDialog();
        setPrompt("");
      }, 1500);
      triggerImpulse(40);
      return;
    }

    if (dialogStep >= 1 && prompt.trim()) {
      capsule.showMessage(
        `Gute Idee, ${userName || "Creator"}. Prüfe die Einstellungen und klicke auf Generieren.`,
        6000,
        8
      );
      advanceDialog();
      triggerImpulse(60);
      return;
    }

    if (!prompt.trim()) return;

    setIsGenerating(true);
    capsule.showMessage(
      `Generiere mit ${activeModel.name} für ${userName || "Creator"}…`,
      5000,
      9
    );
    triggerImpulse(80);

    window.setTimeout(() => {
      setIsGenerating(false);
      capsule.showMessage(`Fertig, ${userName || "Creator"}. Dein Ergebnis ist bereit.`, 5000, 8);
    }, 2500);

    if (credits < 20) {
      capsule.showMessage(
        `Hinweis: Nur noch ${credits} Credits verfügbar.`,
        5000,
        10
      );
    }
  }, [
    activeModel.name,
    advanceDialog,
    capsule,
    credits,
    dialogStep,
    prompt,
    setIsGenerating,
    setPrompt,
    setUserName,
    triggerImpulse,
    userName,
  ]);

  const handleFile = (fieldId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setUploadedFile(fieldId, url);
  };

  return (
    <div className="absolute bottom-[16%] left-1/2 z-30 w-[clamp(320px,58vw,680px)] -translate-x-1/2 px-4">
      {(activeModel.supportsStart || activeModel.supportsEnd || activeModel.supportsAudio) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {activeModel.supportsStart && (
            <UploadSlot
              label="Startbild"
              required
              preview={uploadedFiles["start"]}
              onFile={(f) => handleFile("start", f)}
              onRemove={() => removeUploadedFile("start")}
              rgb={theme.rgb}
            />
          )}
          {activeModel.supportsEnd && (
            <UploadSlot
              label="Endrahmen"
              preview={uploadedFiles["end"]}
              onFile={(f) => handleFile("end", f)}
              onRemove={() => removeUploadedFile("end")}
              rgb={theme.rgb}
            />
          )}
          {activeModel.supportsAudio && (
            <UploadSlot
              label="Audio"
              preview={uploadedFiles["audio"]}
              onFile={(f) => handleFile("audio", f)}
              onRemove={() => removeUploadedFile("audio")}
              rgb={theme.rgb}
            />
          )}
        </div>
      )}

      <div
        className="rounded-[20px] border backdrop-blur-[24px]"
        style={{
          background: "rgba(18,18,20,0.75)",
          borderWidth: "0.5px",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: `0 0 0 3px rgba(${theme.rgb},0.04)`,
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            dialogStep === 0
              ? "Wie heißt du?"
              : "Beschreibe deine Idee…"
          }
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 font-sans text-sm text-white outline-none placeholder:text-white/45"
          style={{ fontSize: "14px", minHeight: "44px", maxHeight: "72px" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />

        <div className="flex items-center justify-between px-2 pb-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ParamPill
              label={activeModel.name}
              accent
              rgb={theme.rgb}
              onClick={() => setOpenPopover(openPopover === "model" ? null : "model")}
            />
            {activeModel.supportsStart && (
              <ParamPill label="Startbild" onClick={() => setOpenPopover("start")} />
            )}
            {activeModel.supportsEnd && (
              <ParamPill label="Endrahmen" onClick={() => setOpenPopover("end")} />
            )}
            {activeModel.supportsAudio && (
              <ParamPill label="Audio" onClick={() => setOpenPopover("audio")} />
            )}
            <ParamPill
              label={resolution}
              onClick={() => setOpenPopover("resolution")}
            />
            <ParamPill label={duration} onClick={() => setOpenPopover("duration")} />

            {openPopover === "duration" && (
              <PopoverOptions
                options={activeModel.durations}
                value={duration}
                onSelect={(v) => {
                  setParam("duration", v);
                  setOpenPopover(null);
                }}
              />
            )}
            {openPopover === "resolution" && (
              <PopoverOptions
                options={activeModel.resolutions}
                value={resolution}
                onSelect={(v) => {
                  setParam("resolution", v);
                  setOpenPopover(null);
                }}
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-base font-bold transition-transform hover:scale-[1.08] active:scale-95"
            style={{
              background: `rgb(${theme.rgb})`,
              color: "#050507",
              transition: "background 1.2s ease, transform 0.2s ease",
            }}
            aria-label="Generieren"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function ParamPill({
  label,
  accent,
  rgb,
  onClick,
}: {
  label: string;
  accent?: boolean;
  rgb?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-2.5 py-1 text-[10px] transition-colors hover:bg-white/[0.09]"
      style={{
        background: accent ? `rgba(${rgb},0.1)` : "rgba(255,255,255,0.05)",
        borderColor: accent ? `rgba(${rgb},0.25)` : "rgba(255,255,255,0.08)",
        color: accent ? `rgb(${rgb})` : "rgba(255,255,255,0.55)",
      }}
    >
      {label}
    </button>
  );
}

function PopoverOptions({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="absolute bottom-full left-4 mb-2 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-[#0d0d0f] p-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className="rounded-lg px-2 py-1 text-[10px] hover:bg-white/10"
          style={{ color: opt === value ? "#00FF66" : "rgba(255,255,255,0.6)" }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function UploadSlot({
  label,
  required,
  preview,
  onFile,
  onRemove,
  rgb,
}: {
  label: string;
  required?: boolean;
  preview?: string;
  onFile: (f: File) => void;
  onRemove: () => void;
  rgb: string;
}) {
  return (
    <label
      className="relative flex h-14 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-[9px] text-white/60 transition-colors hover:border-white/25"
      style={{ borderColor: preview ? `rgba(${rgb},0.35)` : "rgba(255,255,255,0.12)" }}
    >
      <input
        type="file"
        accept="image/*,audio/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="absolute inset-0 h-full w-full rounded-lg object-cover opacity-60" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            className="relative z-10 text-white/70"
          >
            ✕
          </button>
        </>
      ) : (
        <>
          {label}
          {required && " *"}
        </>
      )}
    </label>
  );
}

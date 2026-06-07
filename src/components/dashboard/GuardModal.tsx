"use client";

import { useEffect, useState } from "react";
import type { GuardVariant } from "@/lib/agent/guards";

type GuardModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: GuardVariant;
};

export function GuardModal({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = "default",
}: GuardModalProps) {
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    if (isOpen) setConsentChecked(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const isWarning = variant === "warning";
  const isConsent = variant === "consent";
  const accent = isWarning ? "#fdba74" : "#B4FF00";
  const borderColor = isWarning
    ? "rgba(255,140,0,0.35)"
    : "rgba(180,255,0,0.2)";
  const confirmDisabled = isConsent && !consentChecked;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 cursor-default border-none p-0"
        style={{ background: "rgba(0,0,0,0.7)", zIndex: 9998 }}
        onClick={onCancel}
        aria-label="Dialog schließen"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guard-modal-title"
        className="fixed left-1/2 top-1/2 w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2"
        style={{
          zIndex: 9999,
          background: "#0f0f12",
          border: `1px solid ${borderColor}`,
          borderRadius: 4,
          padding: 24,
        }}
      >
        <h2
          id="guard-modal-title"
          className="mb-2 text-[15px] font-bold"
          style={{ color: accent }}
        >
          {title}
        </h2>
        <p
          className="mb-5 text-[13px] leading-[1.6]"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {description}
        </p>

        {isConsent && (
          <label
            className="mb-5 flex cursor-pointer items-start gap-2.5 text-[12px] leading-[1.5]"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#B4FF00]"
            />
            <span>
              Ich bestätige, dass ich die Rechte an Bild/Audio habe und der
              Einsatz rechtlich zulässig ist.
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-[12px] font-semibold transition-colors hover:text-white"
            style={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)",
              background: "transparent",
            }}
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className="px-4 py-2 text-[12px] font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderRadius: 4,
              background: isWarning ? "rgba(255,140,0,0.18)" : "#B4FF00",
              color: isWarning ? "#fdba74" : "#060608",
              border: isWarning
                ? "1px solid rgba(255,140,0,0.35)"
                : "1px solid transparent",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

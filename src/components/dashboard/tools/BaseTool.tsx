"use client";

/**
 * BaseTool — generischer Wrapper für registrierte Tool-Module.
 *
 * Rendert:
 * 1. module.FormComponent (Tool-spezifisches Formular)
 * 2. Validierungsfehler
 * 3. Credit-Warnung
 * 4. Generieren-Button
 */

import { useMemo } from "react";
import { Loader2, Zap } from "lucide-react";
import type { ToolModule } from "./types";

interface Props {
  module: ToolModule;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onGenerate: (payload: Record<string, unknown>) => void;
  isGenerating: boolean;
  accent: string;
  coinCost: number;
  hasEnoughCredits: boolean;
  creditExempt: boolean;
}

export function BaseTool({
  module,
  values,
  onChange,
  onGenerate,
  isGenerating,
  accent,
  coinCost,
  hasEnoughCredits,
  creditExempt,
}: Props) {
  const validationError = useMemo(() => module.validate(values), [module, values]);

  const handleGenerate = () => {
    if (validationError || isGenerating) return;
    const payload = module.buildPayload(values);
    onGenerate(payload);
  };

  const disabled = !!validationError || isGenerating || (!hasEnoughCredits && !creditExempt);

  return (
    <div className="flex flex-col gap-4">
      <module.FormComponent values={values} onChange={onChange} />

      {validationError ? (
        <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-400">
          {validationError}
        </p>
      ) : null}

      {!hasEnoughCredits && !creditExempt ? (
        <p className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-400">
          Nicht genug Credits. Du benötigst {coinCost} Credits.
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={disabled}
        className="relative flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-all disabled:cursor-not-allowed disabled:opacity-40"
        style={{ backgroundColor: disabled ? "#4b5563" : accent }}
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Generiert…</span>
          </>
        ) : (
          <>
            <Zap size={16} />
            <span>Generieren</span>
            {coinCost > 0 ? (
              <span className="absolute right-3 font-mono text-[10px] opacity-60">
                {coinCost}⚡
              </span>
            ) : null}
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLang } from "./PreviewLang";
import { CommandComposer } from "./CommandComposer";
import { IntentResolverPreview } from "./IntentResolverPreview";
import {
  DynamicWorkflowResult,
  resolveAssetKind,
  type WorkflowPhase,
} from "./DynamicWorkflowResult";
import { AssetPreviewInline } from "./AssetPreviewInline";
import { PreviewContextActions } from "./PreviewContextActions";
import {
  detectPreviewIntent,
  detectPreviewPlatform,
  buildOptimizedPrompt,
  type PreviewIntent,
} from "./preview-intent";
import { usePreviewDashboardMotion, animatePreviewPanel } from "./usePreviewDashboardMotion";

const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

export function PreviewStudioCommand() {
  const { lang, t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [optimized, setOptimized] = useState("");
  const [phase, setPhase] = useState<WorkflowPhase>("idle");
  const [hasImageContext, setHasImageContext] = useState(false);
  const [forceVideoPanel, setForceVideoPanel] = useState(false);

  const tc = t.studioCommand;
  const chips = tc.chips.map((c) => ({ ...c, prompt: c.prompt[lang] }));

  usePreviewDashboardMotion(rootRef, true);

  const intent = useMemo(
    () => detectPreviewIntent(forceVideoPanel ? "video animieren" : submitted),
    [submitted, forceVideoPanel]
  );
  const platform = useMemo(() => detectPreviewPlatform(submitted), [submitted]);
  const platformAsk = needsPlatformAsk(submitted, intent, platform.platform)
    ? tc.platformAsk
    : undefined;

  const assetKind = resolveAssetKind(intent, phase, forceVideoPanel);

  useEffect(() => {
    animatePreviewPanel(flowRef, phase !== "idle");
  }, [phase, intent, forceVideoPanel]);

  const runWorkflow = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      setSubmitted(trimmed);
      setForceVideoPanel(false);
      const detected = detectPreviewIntent(trimmed);
      setOptimized(buildOptimizedPrompt(trimmed, detected));
      setPhase("optimizing");

      window.setTimeout(() => {
        setPhase("generating");
        window.setTimeout(() => {
          setPhase("complete");
          if (detected === "image_generation") setHasImageContext(true);
        }, 1200);
      }, 700);
    },
    []
  );

  const handleSubmit = () => runWorkflow(input);

  const handleFollowUp = (action: "video" | "hooks" | "campaign" | "variant") => {
    if (action === "video") {
      setForceVideoPanel(true);
      setSubmitted(lang === "de" ? "Bild zu Video animieren" : "Animate image to video");
      setPhase("optimizing");
      window.setTimeout(() => {
        setPhase("generating");
        window.setTimeout(() => setPhase("complete"), 1000);
      }, 500);
      return;
    }
    if (action === "hooks") {
      const p = lang === "de" ? "schreib mir hooks für das bild" : "write hooks for this image";
      setInput(p);
      runWorkflow(p);
      return;
    }
    if (action === "campaign") {
      const p = lang === "de" ? "starte kampagne" : "start campaign";
      setInput(p);
      runWorkflow(p);
    }
  };

  return (
    <div ref={rootRef} className="mx-auto min-w-0 max-w-3xl">
      <header className="mb-6 md:mb-8" data-preview-enter>
        <p className="mb-2 font-mono text-[11px] tracking-[0.16em] uppercase text-neutral-500">
          01 — {tc.overline}
        </p>
        <h1
          className="text-[1.75rem] font-extrabold leading-[1.06] text-white sm:text-[2rem] md:text-[2.35rem]"
          style={{ ...HL, letterSpacing: "-0.03em" }}
        >
          {tc.headline}
        </h1>
      </header>

      <CommandComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        chips={chips}
        placeholder={tc.placeholder}
        enterHint={tc.enterHint}
        expanded={phase !== "idle"}
      />

      <div ref={flowRef} className="mt-6 min-w-0 space-y-5 md:mt-8">
        {phase !== "idle" ? (
          <>
            <IntentResolverPreview intent={intent} lang={lang} platformAsk={platformAsk} />

            <DynamicWorkflowResult
              intent={intent}
              originalPrompt={submitted}
              optimizedPrompt={optimized}
              onOptimizedChange={setOptimized}
              phase={phase}
              format={platform.format}
              lang={lang}
              hasImageContext={hasImageContext}
              forceVideoPanel={forceVideoPanel}
            />

            <AssetPreviewInline
              intent={intent}
              kind={assetKind}
              lang={lang}
              visible={phase === "complete"}
            />

            {phase === "complete" ? (
              <PreviewContextActions
                intent={forceVideoPanel ? "image_to_video" : intent}
                lang={lang}
                hasImageContext={hasImageContext}
                onFollowUp={handleFollowUp}
              />
            ) : null}
          </>
        ) : (
          <p className="text-[13px] leading-relaxed text-neutral-500" data-preview-stagger>
            {tc.idleHint}
          </p>
        )}
      </div>

      <div
        className="mt-10 border-t pt-6"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
        data-preview-stagger
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-600">
          {tc.mvpLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {tc.mvpLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-neutral-400 transition-colors hover:border-white/15 hover:text-neutral-200"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

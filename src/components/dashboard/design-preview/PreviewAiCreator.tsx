"use client";

import { useLang } from "./PreviewLang";
import { AiCreatorWorkflow } from "@/components/dashboard/ai-creator/AiCreatorWorkflow";
import type { AiCreatorSeed } from "@/lib/ai-creator/types";

export function PreviewAiCreator({ seed }: { seed?: AiCreatorSeed }) {
  const { lang } = useLang();
  return <AiCreatorWorkflow lang={lang} seed={seed} preview classPrefix="preview" />;
}

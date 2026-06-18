"use client";

import type { PreviewView } from "./PreviewLang";
import type { AiCreatorSeed } from "@/lib/ai-creator/types";
import { PreviewStudioCommand } from "./PreviewStudioCommand";
import { PreviewAiCreator } from "./PreviewAiCreator";
import { PreviewGallery } from "./PreviewGallery";
import { PreviewCampaigns } from "./PreviewCampaigns";
import { PreviewBrandKit } from "./PreviewBrandKit";
import { PreviewSettings } from "./PreviewSettings";

/** Single render switch — view IDs must match PreviewLang nav keys exactly. */
export function PreviewViewContent({
  active,
  onCommandFocusChange,
  onOpenAiCreator,
  aiCreatorSeed,
}: {
  active: PreviewView;
  onNavigate: (view: PreviewView) => void;
  onCommandFocusChange?: (focused: boolean) => void;
  onOpenAiCreator?: (seed: AiCreatorSeed) => void;
  aiCreatorSeed?: AiCreatorSeed;
}) {
  switch (active) {
    case "studio":
      return (
        <PreviewStudioCommand
          onCommandFocusChange={onCommandFocusChange}
          onOpenAiCreator={onOpenAiCreator}
        />
      );
    case "ai-creator":
      return <PreviewAiCreator seed={aiCreatorSeed} />;
    case "gallery":
      return <PreviewGallery />;
    case "campaigns":
      return <PreviewCampaigns />;
    case "brandkit":
      return <PreviewBrandKit />;
    case "settings":
      return <PreviewSettings />;
    default: {
      const _exhaustive: never = active;
      return _exhaustive;
    }
  }
}

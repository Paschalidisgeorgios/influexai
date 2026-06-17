"use client";

import type { PreviewView } from "./PreviewLang";
import { PreviewStudioCommand } from "./PreviewStudioCommand";
import { PreviewGallery } from "./PreviewGallery";
import { PreviewCampaigns } from "./PreviewCampaigns";
import { PreviewBrandKit } from "./PreviewBrandKit";
import { PreviewSettings } from "./PreviewSettings";

/** Single render switch — view IDs must match PreviewLang nav keys exactly. */
export function PreviewViewContent({
  active,
}: {
  active: PreviewView;
  onNavigate: (view: PreviewView) => void;
}) {
  switch (active) {
    case "studio":
      return <PreviewStudioCommand />;
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

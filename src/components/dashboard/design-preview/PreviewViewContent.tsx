"use client";

import type { PreviewView } from "./PreviewLang";
import { PreviewStudioHome, PreviewAgentView } from "./PreviewStudioHome";
import { PreviewToolsFlow } from "./PreviewToolsFlow";
import { PreviewGallery } from "./PreviewGallery";
import { PreviewSettings } from "./PreviewSettings";

/** Single render switch — view IDs must match PreviewLang nav keys exactly. */
export function PreviewViewContent({
  active,
  onNavigate,
}: {
  active: PreviewView;
  onNavigate: (view: PreviewView) => void;
}) {
  switch (active) {
    case "studio":
      return <PreviewStudioHome onNavigate={onNavigate} />;
    case "agent":
      return <PreviewAgentView onNavigate={onNavigate} />;
    case "tools":
      return <PreviewToolsFlow />;
    case "gallery":
      return <PreviewGallery />;
    case "settings":
      return <PreviewSettings />;
    default: {
      const _exhaustive: never = active;
      return _exhaustive;
    }
  }
}

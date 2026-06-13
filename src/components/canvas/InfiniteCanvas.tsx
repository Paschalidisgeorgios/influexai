"use client";

import { memo, useState } from "react";
import "@/styles/canvas.css";
import { CanvasShortcutsHelp } from "./CanvasShortcutsHelp";
import { CanvasPanelStripView } from "./CanvasPanelStripView";
import { CanvasIntelligenceBridge } from "./CanvasIntelligenceBridge";

export const InfiniteCanvas = memo(InfiniteCanvasComponent);

function InfiniteCanvasComponent() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="canvas-flow canvas-flow--panel-strip relative h-full w-full overflow-hidden">
      <CanvasIntelligenceBridge />
      <CanvasPanelStripView />
      <CanvasShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

"use client";

import { memo, useState } from "react";
import "@/styles/canvas.css";
import { DashboardShortcutsHelp } from "./DashboardShortcutsHelp";
import { DashboardPanelStrip } from "./DashboardPanelStrip";
import { DashboardIntelligenceBridge } from "./DashboardIntelligenceBridge";

export const DashboardBoard = memo(DashboardBoardComponent);

function DashboardBoardComponent() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="canvas-flow canvas-flow--panel-strip relative h-full w-full overflow-hidden">
      <DashboardIntelligenceBridge />
      <DashboardPanelStrip />
      <DashboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

"use client";

import { useCallback, useRef } from "react";
import { AgentAutopilotV2 } from "@/components/agent/AgentAutopilotV2";
import { capsuleShow } from "@/components/agent/SmartCapsule";
import { useDashboardTool } from "@/contexts/DashboardToolContext";

export default function KiAgentPage() {
  const { userName } = useDashboardTool();
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const scrollCooldownRef = useRef(0);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const now = Date.now();
      const currentY = target.scrollTop;
      const elapsed = now - lastScrollTimeRef.current;
      const velocity =
        Math.abs(currentY - lastScrollYRef.current) / Math.max(elapsed, 16);
      lastScrollYRef.current = currentY;
      lastScrollTimeRef.current = now;

      if (velocity > 15 && now - scrollCooldownRef.current > 6000) {
        scrollCooldownRef.current = now;
        capsuleShow(
          `${userName}, bitte etwas langsamer scrollen.`,
          4000
        );
      }
    },
    [userName]
  );

  return (
    <div className="dashboard-scroll-area w-full" onScroll={handleScroll}>
      <AgentAutopilotV2 />
    </div>
  );
}

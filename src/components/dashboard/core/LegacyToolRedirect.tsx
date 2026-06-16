"use client";

import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ToolId } from "./DashboardLayout";
import { DashboardLayout } from "./DashboardLayout";

/**
 * Redirects legacy dedicated tool URLs to push-safe ?tool= launch views.
 * Renders DashboardLayout with bootstrapTool to avoid empty/black flash.
 */
export function LegacyToolRedirect({ toolId }: { toolId: ToolId }) {
  const router = useRouter();
  const didRedirect = useRef(false);

  useLayoutEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    router.replace(`/dashboard?tool=${encodeURIComponent(toolId)}`);
  }, [toolId, router]);

  return <DashboardLayout bootstrapTool={toolId} />;
}

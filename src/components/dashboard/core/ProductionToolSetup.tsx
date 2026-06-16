"use client";

import Link from "next/link";
import type { ToolId } from "./DashboardLayout";
import {
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPageHeader,
} from "./DashboardSurface";
import { ProductionToolSetupBody } from "./ProductionToolSetupBody";
import {
  getSetupCreditLabel,
  getToolSetupCategory,
  getToolSetupSubtitle,
  getToolSetupTitle,
} from "./production-tool-setup-ui";

export function ProductionToolSetup({ toolId }: { toolId: ToolId }) {
  const creditLabel = getSetupCreditLabel(toolId);

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 md:space-y-8">
      <DashboardPageHeader
        kicker={getToolSetupCategory(toolId)}
        title={getToolSetupTitle(toolId)}
        subtitle={getToolSetupSubtitle(toolId)}
        action={
          <span
            className="rounded-full border px-3 py-1.5 font-mono text-[10px]"
            style={{
              borderColor: "rgba(8,8,8,0.10)",
              background: "rgba(255,255,255,0.5)",
              color: DASHBOARD_TEXT,
            }}
          >
            {creditLabel}
          </span>
        }
      />

      <ProductionToolSetupBody toolId={toolId} />

      <Link
        href="/dashboard?tool=tools"
        className="inline-flex text-sm no-underline"
        style={{ color: DASHBOARD_MUTED }}
      >
        ← Alle Tools
      </Link>
    </div>
  );
}

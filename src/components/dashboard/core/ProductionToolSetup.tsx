"use client";

import Link from "next/link";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED } from "./DashboardSurface";
import { ProductionToolSetupBody } from "./ProductionToolSetupBody";
import {
  getSetupCreditLabel,
  getToolSetupCategory,
  getToolSetupSubtitle,
  getToolSetupTitle,
  SETUP_COPY,
} from "./production-tool-setup-ui";
import {
  StudioCreditNote,
  StudioCreditPill,
  ToolSetupContext,
  ToolSetupLayout,
} from "../studio-ui";

export function ProductionToolSetup({ toolId }: { toolId: ToolId }) {
  const creditLabel = getSetupCreditLabel(toolId);

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-8 xl:max-w-6xl">
      <ToolSetupLayout
        context={
          <ToolSetupContext
            kicker={getToolSetupCategory(toolId)}
            title={getToolSetupTitle(toolId)}
            subtitle={getToolSetupSubtitle(toolId)}
            credit={<StudioCreditPill label={creditLabel} />}
          >
            <StudioCreditNote>{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>
            <Link
              href="/dashboard?tool=tools"
              className="inline-flex text-sm no-underline"
              style={{ color: DASHBOARD_MUTED }}
            >
              ← Alle Tools
            </Link>
          </ToolSetupContext>
        }
        setup={
          <div className="min-w-0 max-w-full overflow-x-hidden">
            <ProductionToolSetupBody toolId={toolId} />
          </div>
        }
      />
    </div>
  );
}

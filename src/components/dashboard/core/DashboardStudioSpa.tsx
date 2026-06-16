"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "./DashboardLayout";
import { resolveDashboardToolFromQuery } from "./production-tool-routes";

/** SPA entry — initial tool from ?tool= to avoid Studio Home flash. */
export function DashboardStudioSpa() {
  const searchParams = useSearchParams();
  const bootstrapTool = useMemo(
    () => resolveDashboardToolFromQuery(searchParams),
    [searchParams]
  );
  return <DashboardLayout bootstrapTool={bootstrapTool} />;
}

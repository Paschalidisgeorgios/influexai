"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardTool } from "@/contexts/DashboardToolContext";

function KiAgentChatRedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setPrompt } = useDashboardTool();

  useEffect(() => {
    const initialPrompt = searchParams.get("prompt")?.trim() ?? "";
    if (initialPrompt) setPrompt(initialPrompt);
    const query = searchParams.toString();
    router.replace(query ? `/dashboard/ki-agent?${query}` : "/dashboard/ki-agent");
  }, [router, searchParams, setPrompt]);

  return null;
}

export default function KiAgentChatPage() {
  return (
    <Suspense fallback={null}>
      <KiAgentChatRedirectInner />
    </Suspense>
  );
}

"use client";

import { type ReactNode, useEffect } from "react";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";
import { OnboardingChatOverlay } from "./OnboardingChatOverlay";

interface Props {
  children: ReactNode;
}

const INACTIVITY_CHECK_INTERVAL = 15_000;

export function OnboardingAgentShell({ children }: Props) {
  const evaluateInactivity = useOnboardingStore((s) => s.evaluateInactivity);

  useEffect(() => {
    const id = setInterval(evaluateInactivity, INACTIVITY_CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [evaluateInactivity]);

  return (
    <div className="relative h-full w-full">
      {children}
      <OnboardingChatOverlay />
    </div>
  );
}

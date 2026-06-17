"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getLandingV2Links,
  type LandingV2Links,
  type LandingV2Mode,
} from "@/lib/landing-v2-config";

const LandingV2ModeContext = createContext<LandingV2Links | null>(null);

type LandingV2ModeProviderProps = {
  mode: LandingV2Mode;
  children: ReactNode;
};

export function LandingV2ModeProvider({ mode, children }: LandingV2ModeProviderProps) {
  const links = useMemo(() => getLandingV2Links(mode), [mode]);
  return (
    <LandingV2ModeContext.Provider value={links}>{children}</LandingV2ModeContext.Provider>
  );
}

export function useLandingV2Links(): LandingV2Links {
  const links = useContext(LandingV2ModeContext);
  if (!links) {
    throw new Error("useLandingV2Links must be used within LandingV2ModeProvider");
  }
  return links;
}

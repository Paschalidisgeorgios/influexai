"use client";

import { createContext, useContext, type ReactNode } from "react";
import { LightFrame } from "@/components/LightFrame";
import { useDemoReveal } from "./use-demo-reveal";

const DemoVisibleContext = createContext(false);

export function useDemoVisible() {
  return useContext(DemoVisibleContext);
}

type ToolDemoBeatProps = {
  problem: string;
  benefit: ReactNode;
  children: ReactNode;
  reverse?: boolean;
};

export function ToolDemoBeat({
  problem,
  benefit,
  children,
  reverse = false,
}: ToolDemoBeatProps) {
  const { ref, visible } = useDemoReveal();

  return (
    <div
      ref={ref}
      className={[
        "tool-demo-beat",
        visible ? "is-visible" : "",
        reverse ? "tool-demo-beat--reverse" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="tool-demo-beat__problem">{problem}</p>
      <DemoVisibleContext.Provider value={visible}>
        <LightFrame className="tool-demo-beat__frame rounded-2xl border border-white/[0.08] bg-[#0f0f12]">
          {children}
        </LightFrame>
      </DemoVisibleContext.Provider>
      <p className="tool-demo-beat__benefit">{benefit}</p>
    </div>
  );
}

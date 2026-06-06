"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { ScriptGeneratorDemo } from "./ScriptGeneratorDemo";
import { NicheAnalyzerDemo } from "./NicheAnalyzerDemo";
import { ThumbnailConceptDemo } from "./ThumbnailConceptDemo";
import { OutlierDetectorDemo } from "./OutlierDetectorDemo";
import { ViralScoreDemo } from "./ViralScoreDemo";
import { AvatarDemo } from "./AvatarDemo";
import { AgentDemo } from "./AgentDemo";
import { UpscalerDemo } from "./UpscalerDemo";
import { useScrollFocus } from "./use-scroll-focus";

function FocusWrap({ children }: { children: ReactNode }) {
  const ref = useScrollFocus();

  return (
    <div ref={ref} style={{ willChange: "opacity, transform" }}>
      {children}
    </div>
  );
}

export function ToolDemosSection() {
  const t = useTranslations("landingPage.toolDemos");

  return (
    <section id="tool-demos" className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]">
      <div className="max-w-[960px] mx-auto">
        <SpringReveal>
          <div className="mb-12 md:mb-16 text-center max-w-2xl mx-auto">
            <span className="kicker mb-2.5 block">{t("section_kicker")}</span>
            <h2 className="demo-heading landing-heading text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05]">
              {t("section_headline")}
            </h2>
          </div>
        </SpringReveal>
        <div className="flex flex-col gap-16 md:gap-20">
          <FocusWrap>
            <ScriptGeneratorDemo />
          </FocusWrap>
          <FocusWrap>
            <NicheAnalyzerDemo />
          </FocusWrap>
          <FocusWrap>
            <ThumbnailConceptDemo />
          </FocusWrap>
          <FocusWrap>
            <UpscalerDemo src="/images/landing/feature-2.png" />
          </FocusWrap>
          <FocusWrap>
            <OutlierDetectorDemo />
          </FocusWrap>
          <FocusWrap>
            <ViralScoreDemo />
          </FocusWrap>
          <FocusWrap>
            <AvatarDemo />
          </FocusWrap>
          <FocusWrap>
            <AgentDemo />
          </FocusWrap>
        </div>
      </div>
    </section>
  );
}

export default ToolDemosSection;

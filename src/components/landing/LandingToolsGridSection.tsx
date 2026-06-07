"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { toolIntelligenceData } from "@/data/landingAgentDemos";
import {
  LANDING_STUDIO_TOOLS,
  resolveLandingToolHref,
} from "@/lib/landing-studio-tools";

const AGENT_HINTS = Object.fromEntries(
  toolIntelligenceData.map((entry) => [entry.toolId, entry.agentHint])
) as Record<string, string>;

function StudioToolCard({
  tool,
  title,
  description,
  agentHint,
  comingSoonLabel,
}: {
  tool: (typeof LANDING_STUDIO_TOOLS)[number];
  title: string;
  description: string;
  agentHint: string;
  comingSoonLabel: string;
}) {
  const href = resolveLandingToolHref(tool.href);
  const disabled = tool.comingSoon === true;

  const cardInner = (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={tool.image}
          alt={title}
          fill
          className={`object-cover transition-transform duration-500 ${disabled ? "" : "group-hover:scale-[1.03]"}`}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 tool-card-overlay" aria-hidden />
        {disabled && (
          <span
            className="absolute right-2 top-2 rounded-[6px] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.06em]"
            style={{
              background: "rgba(180,255,0,0.12)",
              border: "1px solid rgba(180,255,0,0.35)",
              color: "#B4FF00",
            }}
          >
            {comingSoonLabel}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3 md:p-3.5">
        <h4
          className={`tool-card-name transition-colors ${disabled ? "" : "group-hover:text-[#caffb0]"}`}
        >
          {title}
        </h4>
        <p className="tool-card-desc">{description}</p>
        <p
          className="text-[0.72rem] leading-[1.5]"
          style={{ color: "rgba(180,255,0,0.55)" }}
        >
          {agentHint}
        </p>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div
        className="glass-card flex flex-col overflow-hidden opacity-55"
        aria-disabled="true"
      >
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="glass-card group flex flex-col overflow-hidden transition-all duration-300 hover:brightness-110"
    >
      {cardInner}
    </Link>
  );
}

export function LandingToolsGridSection() {
  const tTools = useTranslations("landingPage.toolExamples");

  return (
    <section
      id="features"
      className="w-full max-w-[100vw] overflow-x-hidden px-[clamp(20px,6vw,64px)] py-16 md:py-20"
      style={{ background: "#060608" }}
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
            <div>
              <span className="kicker mb-2 block">{tTools("kicker")}</span>
              <h2 className="landing-heading text-[clamp(1.75rem,3.5vw,3rem)]">
                {tTools("headline1")}
                <br />
                <span className="acid-highlight">{tTools("headline2")}</span>
              </h2>
            </div>
            <p
              className="hidden max-w-[280px] text-right text-sm leading-[1.6] lg:block"
              style={{ color: "var(--wd)" }}
            >
              Der Agent wählt Tools automatisch — du siehst hier, wofür jedes Modul
              genutzt wird.
            </p>
          </div>
        </SpringReveal>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {LANDING_STUDIO_TOOLS.map((tool, i) => (
            <SpringReveal key={tool.id} delay={(i % 3) * 0.06}>
              <StudioToolCard
                tool={tool}
                title={tTools(`${tool.id}_title`)}
                description={tTools(`${tool.id}_desc`)}
                agentHint={AGENT_HINTS[tool.id] ?? "Agent nutzt dieses Modul im Workflow."}
                comingSoonLabel={tTools("coming_soon")}
              />
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingToolsGridSection;

"use client";

import { SpringReveal } from "@/components/ui/SpringReveal";
import { campaignModes } from "@/data/landingAgentDemos";

export function CampaignAutopilotSection() {
  return (
    <section
      id="campaign-autopilot"
      className="px-[clamp(16px,5vw,64px)] py-12 md:py-16 lg:py-20"
      style={{ background: "#060608" }}
      aria-label="Campaign Autopilot"
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="kicker mb-2 block">Campaign Autopilot</span>
          <h2 className="landing-heading mb-3 text-[clamp(1.75rem,3.5vw,3rem)]">
            EIN BRIEFING.
            <br />
            <span className="acid-highlight">EIN CONTENT-PAKET.</span>
          </h2>
          <p
            className="mb-10 max-w-[640px] text-[0.9rem] leading-[1.65] md:mb-12"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Der Agent plant 2–3 Tage, 7 Tage oder 30 Tage Content — mit Scripts,
            Hooks, Captions und Kalender.
          </p>
        </SpringReveal>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {campaignModes.map((mode, i) => (
            <SpringReveal key={mode.id} delay={i * 0.08}>
              <article
                className="glass-card flex h-full flex-col p-5 md:p-6"
                style={{ minHeight: 360 }}
              >
                <p
                  className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "#B4FF00" }}
                >
                  {mode.title}
                </p>
                <h3
                  className="landing-heading mb-4 text-2xl leading-none md:text-[1.75rem]"
                >
                  {mode.subtitle}
                </h3>

                <ul className="mb-6 flex flex-col gap-2">
                  {mode.deliverables.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[0.84rem] text-white/85"
                    >
                      <span style={{ color: "#B4FF00" }} aria-hidden>
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-auto rounded-[10px] p-4"
                  style={{
                    background: "rgba(180,255,0,0.04)",
                    border: "1px solid rgba(180,255,0,0.18)",
                  }}
                >
                  <p
                    className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.1em]"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Agent Workflow
                  </p>
                  <ul className="flex flex-col gap-2">
                    {mode.workflowSteps.map((step) => (
                      <li
                        key={step}
                        className="flex items-center gap-2 text-[0.8rem] text-white/78"
                      >
                        <span style={{ color: "#B4FF00" }} aria-hidden>
                          ✓
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CampaignAutopilotSection;

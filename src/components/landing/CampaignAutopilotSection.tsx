"use client";

import { SpringReveal } from "@/components/ui/SpringReveal";
import { useTranslations } from "next-intl";
import { CAMPAIGN_MODE_IDS } from "@/data/landingAgentDemos";

export function CampaignAutopilotSection() {
  const t = useTranslations("landingPage.demos");
  const tl = useTranslations("landingPage.demos.labels");

  return (
    <section
      id="campaign-autopilot"
      className="px-[clamp(16px,5vw,64px)] py-12 md:py-16 lg:py-20"
      style={{ background: "#060608" }}
      aria-label={t("campaignSection.kicker")}
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="kicker mb-2 block">{t("campaignSection.kicker")}</span>
          <h2 className="landing-heading mb-3 text-[clamp(1.75rem,3.5vw,3rem)]">
            {t("campaignSection.headline1")}
            <br />
            <span className="acid-highlight">{t("campaignSection.headline2")}</span>
          </h2>
          <p
            className="mb-10 max-w-[640px] text-[0.9rem] leading-[1.65] md:mb-12"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {t("campaignSection.description")}
          </p>
        </SpringReveal>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {CAMPAIGN_MODE_IDS.map((modeId, i) => {
            const prefix = `campaign.${modeId}`;
            const deliverables = t.raw(`${prefix}.deliverables`) as string[];
            const workflowSteps = t.raw(`${prefix}.workflowSteps`) as string[];

            return (
              <SpringReveal key={modeId} delay={i * 0.08}>
                <article
                  className="glass-card flex h-full flex-col p-5 md:p-6"
                  style={{ minHeight: 360 }}
                >
                  <p
                    className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em]"
                    style={{ color: "#B4FF00" }}
                  >
                    {t(`${prefix}.title`)}
                  </p>
                  <h3 className="landing-heading mb-2 text-2xl leading-none md:text-[1.75rem]">
                    {t(`${prefix}.subtitle`)}
                  </h3>
                  <p
                    className="mb-4 text-[0.66rem] font-medium uppercase tracking-[0.06em]"
                    style={{ color: "rgba(255,255,255,0.42)" }}
                  >
                    {tl("demoExampleCards")}
                  </p>

                  <ul className="mb-6 flex flex-col gap-2">
                    {deliverables.map((item) => (
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
                      className="mb-3 text-[0.66rem] font-bold uppercase tracking-[0.1em]"
                      style={{ color: "rgba(255,255,255,0.48)" }}
                    >
                      {t("campaignSection.workflowLabel")}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {workflowSteps.map((step) => (
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CampaignAutopilotSection;

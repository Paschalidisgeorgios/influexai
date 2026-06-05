"use client";

import { Crown, Rocket, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

const CARD_KEYS = ["c1", "c2", "c3"] as const;
const CARD_ICONS = [Crown, Zap, Rocket] as const;

export function FoundingCreatorsSection() {
  const t = useTranslations("founding");

  return (
    <section
      id="founding-creators"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "#060608" }}
    >
      <div className="max-w-[1160px] mx-auto">
        <SpringReveal>
          <p
            className="mb-5 text-center font-bold uppercase"
            style={{
              fontSize: 11,
              color: "var(--accent, #B4FF00)",
              letterSpacing: "0.22em",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            {t("kicker")}
          </p>
          <h2 className="landing-heading text-[clamp(2.5rem,5vw,4.5rem)] text-center mb-6 leading-[0.92]">
            {t("headline1")}
            <br />
            <span className="acid-highlight">{t("headline2")}</span>
          </h2>
          <p
            className="text-center max-w-[560px] mx-auto mb-12 text-[1.05rem] leading-[1.75]"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {t("subtext")}
          </p>
        </SpringReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {CARD_KEYS.map((key, i) => {
            const Icon = CARD_ICONS[i];
            return (
              <SpringReveal key={key} delay={0.06 + i * 0.06}>
                <div
                  className="h-full p-6 md:p-7 flex flex-col gap-4 rounded-3xl backdrop-blur-md"
                  style={{
                    background: "rgba(20,20,20,0.4)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-xl"
                    style={{
                      background: "rgba(180,255,0,0.08)",
                      border: "1px solid rgba(180,255,0,0.2)",
                    }}
                  >
                    <Icon size={22} color="var(--accent, #B4FF00)" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div>
                    <h3
                      className="text-base font-bold mb-2"
                      style={{
                        color: "#F0EFE8",
                        fontFamily: "var(--font-dm), sans-serif",
                      }}
                    >
                      {t(`${key}_title`)}
                    </h3>
                    <p
                      className="text-[0.9rem] leading-[1.65] m-0"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {t(`${key}_text`)}
                    </p>
                  </div>
                </div>
              </SpringReveal>
            );
          })}
        </div>

        <SpringReveal delay={0.24}>
          <div className="text-center">
            <AcidMotionButton
              href="/auth/sign-up"
              className="btn-acid rounded-full px-8 py-3.5 justify-center"
            >
              → {t("cta")}
            </AcidMotionButton>
          </div>
        </SpringReveal>
      </div>
    </section>
  );
}

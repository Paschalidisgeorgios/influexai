"use client";

import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

const AVATAR_SLOTS = [1, 2, 3] as const;
const TOTAL_SLOTS = 50;

export function FoundingCreatorsSection() {
  const t = useTranslations("founding");

  return (
    <section
      id="founding-creators"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "#060608" }}
    >
      <div className="mx-auto max-w-[720px] text-center">
        <SpringReveal>
          <p
            className="mb-4 font-bold uppercase tracking-[0.22em]"
            style={{
              fontSize: 11,
              color: "var(--accent, #B4FF00)",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            {t("kicker")}
          </p>
          <h2 className="landing-heading mb-6 text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.95]">
            {t("headline")}
          </h2>
          <p
            className="mx-auto mb-10 max-w-[560px] text-[1.05rem] leading-[1.75]"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {t("subtext")}
          </p>
        </SpringReveal>

        <SpringReveal delay={0.08}>
          <div className="mb-10 flex flex-wrap items-start justify-center gap-6 sm:gap-8">
            {AVATAR_SLOTS.map((slot) => (
              <div
                key={slot}
                className="flex min-w-[100px] max-w-[120px] flex-col items-center gap-2.5"
              >
                <div
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-dashed sm:h-20 sm:w-20"
                  style={{
                    borderColor: "color-mix(in srgb, var(--accent, #B4FF00) 35%, transparent)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                  aria-hidden
                >
                  <span
                    className="text-lg font-light"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    ?
                  </span>
                </div>
                <p
                  className="m-0 text-[0.72rem] leading-snug"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {t("slot_label", { slot, total: TOTAL_SLOTS })}
                </p>
              </div>
            ))}
          </div>
        </SpringReveal>

        <SpringReveal delay={0.16}>
          <AcidMotionButton
            href="/auth/sign-up"
            className="btn-acid justify-center rounded-full px-8 py-3.5"
          >
            → {t("cta")}
          </AcidMotionButton>
          <p
            className="mt-4 text-[0.78rem]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {t("note")}
          </p>
        </SpringReveal>
      </div>
    </section>
  );
}

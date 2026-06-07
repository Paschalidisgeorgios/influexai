"use client";

import { SpringReveal } from "@/components/ui/SpringReveal";
import { qualityChecks } from "@/data/landingAgentDemos";

export function QualityIntelligenceSection() {
  return (
    <section
      id="quality-intelligence"
      className="px-[clamp(16px,5vw,64px)] py-12 md:py-16 lg:py-20"
      style={{ background: "var(--bg-1)" }}
      aria-label="Quality Intelligence"
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="kicker mb-2 block">Quality Intelligence</span>
          <h2 className="landing-heading mb-3 text-[clamp(1.75rem,3.5vw,3rem)]">
            QUALITÄT,
            <br />
            <span className="acid-highlight">BEVOR DU EXPORTIERST.</span>
          </h2>
          <p
            className="mb-10 max-w-[580px] text-[0.9rem] leading-[1.65] md:mb-12"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Der Agent prüft und verbessert Outputs, bevor sie final werden — kein
            Blind-Export.
          </p>
        </SpringReveal>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {qualityChecks.map((area, i) => (
            <SpringReveal key={area.id} delay={i * 0.08}>
              <article
                className="glass-card h-full p-5 md:p-6"
                style={{ minHeight: 280 }}
              >
                <h3
                  className="landing-heading mb-4 text-xl md:text-2xl"
                  style={{ color: "#B4FF00" }}
                >
                  {area.title}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {area.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[0.84rem] text-white/82"
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.6rem]"
                        style={{
                          background: "rgba(180,255,0,0.12)",
                          border: "1px solid rgba(180,255,0,0.35)",
                          color: "#B4FF00",
                        }}
                        aria-hidden
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QualityIntelligenceSection;

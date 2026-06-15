"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { LANDING_DEMO_CREDITS } from "@/lib/landing-demo-credits";

const TABS = [
  { id: "script", label: "Script" },
  { id: "product", label: "Produkt Werbung" },
  { id: "viral_hook", label: "Viral Hook" },
  { id: "content_kalender", label: "Content Kalender" },
  { id: "avatar", label: "Avatar" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SCRIPT_CREDITS = LANDING_DEMO_CREDITS.script;

function DemoBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block text-sm rounded-[6px] px-2.5 py-1"
      style={{
        background: "rgba(180,255,0,0.1)",
        border: "1px solid rgba(180,255,0,0.3)",
        color: "#B4FF00",
      }}
    >
      {children}
    </span>
  );
}

function OutputShell({
  input,
  output,
  badge,
}: {
  input: ReactNode;
  output: ReactNode;
  badge: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
      <div
        className="rounded-[12px] p-4 md:p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="mb-3 text-sm font-semibold tracking-wide"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Input
        </p>
        <div
          className="text-[0.84rem] leading-[1.65]"
          style={{ color: "rgba(255,255,255,0.72)" }}
        >
          {input}
        </div>
      </div>

      <div
        className="relative rounded-[12px] px-5 py-5 md:px-6"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(180,255,0,0.25)",
        }}
      >
        <div
          className="text-[0.84rem] leading-[1.65]"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          {output}
        </div>
        <div className="mt-4 flex justify-end">{badge}</div>
      </div>
    </div>
  );
}

function ScriptTab() {
  return (
    <OutputShell
      input={
        <>
          <p className="mb-2">
            <span style={{ color: "#B4FF00" }}>Thema:</span>
            <br />
            &quot;So kaufst du deine erste Immobilie mit 25&quot;
          </p>
          <p>
            <span style={{ color: "#B4FF00" }}>Plattform:</span>
            <br />
            TikTok · Länge: 30s
          </p>
        </>
      }
      output={
        <>
          <p className="mb-3">
            <span style={{ color: "#B4FF00" }}>🎬 Hook:</span>
            <br />
            &quot;Die meisten glauben, Immobilien kaufen ist nur was für Reiche.
            Ich hab mit 25 angefangen — hier ist der Weg, den ich vorher gern
            gekannt hätte.&quot;
          </p>
          <p className="mb-3">
            <span style={{ color: "#B4FF00" }}>📖 Story:</span>
            <br />
            Kein Erbe, kein riesiges Gehalt. Erst Budget verstehen, Eigenkapital
            aufbauen, Förderoptionen prüfen und die erste Wohnung nicht
            emotional, sondern als Content-Idee bewerten — kein Finanzrat.
          </p>
          <p>
            <span style={{ color: "#B4FF00" }}>🎯 CTA:</span>
            <br />
            &quot;Kommentiere &apos;START&apos; — ich schick dir die
            Schritt-für-Schritt-Checkliste.&quot;
          </p>
        </>
      }
      badge={
        <DemoBadge>Script Generator · {SCRIPT_CREDITS} Credits</DemoBadge>
      }
    />
  );
}

function ProductTab() {
  return (
    <OutputShell
      input={
        <>
          <p className="mb-2">
            <span style={{ color: "#B4FF00" }}>Produkt:</span>
            <br />
            &quot;KI-Steuer-App für Selbstständige&quot;
          </p>
          <p>
            <span style={{ color: "#B4FF00" }}>Plattform:</span>
            <br />
            Instagram Reels · Ton: Vertrauensvoll
          </p>
        </>
      }
      output={
        <>
          <p className="mb-3">
            <span style={{ color: "#B4FF00" }}>🎬 Hook:</span>
            <br />
            &quot;Du verlierst Zeit in deiner Buchhaltung — weil deine Belege
            immer noch manuell sortiert werden.&quot;
          </p>
          <p className="mb-3">
            <span style={{ color: "#B4FF00" }}>📖 Spot-Text:</span>
            <br />
            TaxMind erkennt Belege, kategorisiert Ausgaben und bereitet deine
            Buchhaltung KI-gestützt vor. DATEV-kompatibel, DSGVO-konform — als
            Content-Mockup, keine Steuerberatung.
          </p>
          <p>
            <span style={{ color: "#B4FF00" }}>#️⃣ Hashtags:</span>
            <br />
            #Steuer #Selbstständig #FinanzTipp #KI #Buchhaltung
          </p>
        </>
      }
      badge={
        <DemoBadge>
          Produkt Werbung · {LANDING_DEMO_CREDITS.product} Credits
        </DemoBadge>
      }
    />
  );
}

function ViralHookTab() {
  const hooks = [
    "Ich hab meine komplette Beauty-Routine auf nachhaltig umgestellt — für unter 30€. Das brauchst du wirklich.",
    "Warum gibst du 80€ für Gesichtscreme aus, wenn deine Routine auch einfacher funktionieren kann?",
    "POV: Du findest heraus, dass dein Lieblingsprodukt nicht cruelty-free ist.",
    "Diese 5 Produkte ersetzen 12 meiner alten — und kosten zusammen weniger als eine Serum-Flasche.",
    "Das Ergebnis nach 30 Tagen nachhaltiger Skincare hat mich selbst überrascht.",
  ];

  return (
    <OutputShell
      input={
        <>
          <p className="mb-2">
            <span style={{ color: "#B4FF00" }}>Thema:</span>
            <br />
            &quot;Nachhaltige Beauty-Routine unter 30€&quot;
          </p>
          <p>
            <span style={{ color: "#B4FF00" }}>Nische:</span>
            <br />
            Beauty &amp; Lifestyle · Plattform: TikTok
          </p>
        </>
      }
      output={
        <ol className="m-0 list-decimal space-y-2.5 pl-4">
          {hooks.map((hook) => (
            <li key={hook}>{hook}</li>
          ))}
        </ol>
      }
      badge={
        <DemoBadge>
          Viral Hook Extraktor · {LANDING_DEMO_CREDITS.viralHook} Credit
        </DemoBadge>
      }
    />
  );
}

function ContentKalenderTab() {
  const rows = [
    ["Mo", "ETF-Erklärvideo: \"Was ist der MSCI World?\"", "Reel 30s"],
    ["Di", "Tipp: \"Sparrate berechnen in 2 Min\"", "Carousel"],
    ["Mi", "Story: Meine Depot-Routine diese Woche", "Story"],
    ["Do", "Vergleich: \"Tagesgeld vs. ETF 2026\"", "Reel 60s"],
    ["Fr", "Community-Frage: \"Was ist euer Sparziel?\"", "Post"],
  ];

  return (
    <OutputShell
      input={
        <>
          <p className="mb-2">
            <span style={{ color: "#B4FF00" }}>Nische:</span>
            <br />
            Personal Finance / Geldanlage
          </p>
          <p>
            <span style={{ color: "#B4FF00" }}>Plattform:</span>
            <br />
            Instagram · Frequenz: 5× pro Woche
          </p>
        </>
      }
      output={
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] border-collapse text-sm">
              <tbody>
                {rows.map(([day, topic, format]) => (
                  <tr
                    key={day}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <td
                      className="py-1.5 pr-2 font-bold align-top"
                      style={{ color: "#B4FF00", width: "2.5rem" }}
                    >
                      {day}
                    </td>
                    <td className="py-1.5 pr-2 align-top">{topic}</td>
                    <td
                      className="py-1.5 align-top whitespace-nowrap"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {format}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-[0.8rem]">
            <p>
              <span style={{ color: "#B4FF00" }}>⏰ Beste Posting-Zeit:</span>{" "}
              18:00–20:00 Uhr
            </p>
            <p>
              <span style={{ color: "#B4FF00" }}>📈 Reichweiten-Potenzial:</span>{" "}
              Hoch
            </p>
            <p>
              <span style={{ color: "#B4FF00" }}>🔥 Trend-Signal:</span> Steigend
            </p>
          </div>
        </>
      }
      badge={
        <DemoBadge>
          Content Kalender KI · {LANDING_DEMO_CREDITS.contentKalender} Credits
        </DemoBadge>
      }
    />
  );
}

function AvatarTab() {
  return (
    <OutputShell
      input={
        <>
          <p className="mb-2">1 Foto hochgeladen</p>
          <p className="mb-2">
            <span style={{ color: "#B4FF00" }}>Stil:</span> Professional /
            Tech-Creator
          </p>
          <p>
            <span style={{ color: "#B4FF00" }}>Hintergrund:</span> Modern Office
          </p>
        </>
      }
      output={
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-[120px] w-full max-w-[200px] items-center justify-center rounded-[12px] border border-dashed"
            style={{ borderColor: "#B4FF00" }}
          >
            <div
              className="rounded-full"
              style={{
                width: 80,
                height: 80,
                background: "rgba(180,255,0,0.2)",
              }}
              aria-hidden
            />
          </div>
          <p className="mb-3 font-semibold" style={{ color: "#B4FF00" }}>
            KI-Avatar Preview
          </p>
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {["Professional", "Studio BG", "Face Consistent"].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-0.5 text-sm"
                style={{
                  border: "1px solid rgba(180,255,0,0.25)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Konsistentes Gesicht in jedem generierten Bild.
          </p>
        </div>
      }
      badge={
        <DemoBadge>
          Mein KI-Ich · {LANDING_DEMO_CREDITS.kiIch} Credits
        </DemoBadge>
      }
    />
  );
}

function TabPanel({ tabId }: { tabId: TabId }) {
  switch (tabId) {
    case "script":
      return <ScriptTab />;
    case "product":
      return <ProductTab />;
    case "viral_hook":
      return <ViralHookTab />;
    case "content_kalender":
      return <ContentKalenderTab />;
    case "avatar":
      return <AvatarTab />;
    default:
      return null;
  }
}

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<TabId>("script");

  return (
    <section
      id="interactive-demo"
      className="w-full max-w-[100vw] overflow-x-hidden px-[clamp(20px,6vw,64px)] py-16 md:py-24"
      style={{ background: "#060608" }}
    >
      <div className="mx-auto max-w-[960px]">
        <SpringReveal>
          <div className="mb-6 text-center md:mb-8">
            <span className="kicker mb-2 block">Live Preview</span>
            <h2 className="landing-heading mb-2 text-[clamp(1.85rem,4vw,2.75rem)] leading-[1.05]">
              SIEH WIE ES{" "}
              <span className="acid-highlight">FUNKTIONIERT</span>
            </h2>
            <p
              className="text-[0.9rem]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Wähle ein Tool — sieh den Output direkt.
            </p>
          </div>
        </SpringReveal>

        <SpringReveal delay={0.08}>
          <div
            className="interactive-demo-tabs mb-6 flex gap-1.5 overflow-x-auto pb-1 md:mb-8"
            role="tablist"
            aria-label="Demo Tools"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-shrink-0 rounded-[8px] px-3.5 py-2 text-[0.82rem] transition-colors duration-200 md:px-4"
                  style={{
                    background: active ? "#B4FF00" : "transparent",
                    color: active ? "#060608" : "rgba(255,255,255,0.5)",
                    fontWeight: active ? 600 : 500,
                    border: active
                      ? "1px solid #B4FF00"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" key={activeTab} className="interactive-demo-output">
            <TabPanel tabId={activeTab} />
          </div>
        </SpringReveal>
      </div>
    </section>
  );
}

export default InteractiveDemo;

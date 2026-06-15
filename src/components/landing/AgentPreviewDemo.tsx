"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from "react";

const SCENE_DURATION = 7000;
const STEP_INTERVAL = 420;
const TRANSITION_MS = 320;
const VISIBLE_STEP_WINDOW = 4;

type SceneBlock = { l: string; t: string; bold?: boolean };
type Scene = {
  id: string;
  tool: string;
  user: string;
  agent: string;
  tags: string[];
  steps: string[];
  title: string;
  score: string;
  blocks: SceneBlock[];
  hashtags: string[];
  scores: [string, string][];
};

const SCENES: Scene[] = [
  {
    id: "script",
    tool: "Script Generator",
    user: "Schreib mir ein TikTok-Script über meine Immobilien-Seite.",
    agent: "Ich erstelle Hook, Story, CTA und Hashtags für maximale Retention.",
    tags: ["Immobilien", "TikTok", "3 Credits"],
    steps: [
      "Anfrage verstanden",
      "DNA geladen",
      "Zielgruppe erkannt",
      "Plattform geprüft",
      "Trend-Fit analysiert",
      "Hook generiert",
      "Story strukturiert",
      "CTA optimiert",
      "Caption erstellt",
      "Hashtags gesetzt",
      "Risiko geprüft",
      "Paket bereit",
    ],
    title: "SCRIPT BEREIT",
    score: "Hook Score 91 · Risk LOW",
    blocks: [
      {
        l: "Hook",
        t: '"Diese Wohnung war 4 Stunden online — dann war sie weg."',
        bold: true,
      },
      {
        l: "Story",
        t: "Als Makler sehe ich täglich, was wirklich verkauft. Diese 3 Faktoren entscheiden.",
      },
      { l: "CTA", t: "Kostenlose Bewertung — Link in Bio." },
    ],
    hashtags: ["#Immobilien", "#Makler", "#TikTokDE"],
    scores: [
      ["Hook Score", "91"],
      ["Klarheit", "88"],
      ["CTA", "85"],
    ],
  },
  {
    id: "viral-hook",
    tool: "Viral Hook Extraktor",
    user: "Gib mir 5 virale Hooks für meine Immobilien-Seite.",
    agent: "Ich analysiere Trend-Muster und extrahiere 5 starke Hooks.",
    tags: ["Immobilien", "Instagram", "1 Credit"],
    steps: [
      "Anfrage verstanden",
      "Nische erkannt",
      "Plattform geprüft",
      "Trend-Muster analysiert",
      "Hook-Winkel erstellt",
      "Varianten generiert",
      "stärkste Hooks bewertet",
      "Risiko geprüft",
      "Klarheit optimiert",
      "CTA ergänzt",
      "Ergebnis formatiert",
      "Paket bereit",
    ],
    title: "5 HOOKS BEREIT",
    score: "Avg. Score 87 · Risk LOW",
    blocks: [
      {
        l: "Hook 1",
        t: '"Diese Wohnung hat sich in 4 Stunden verkauft."',
        bold: true,
      },
      { l: "Hook 2", t: '"Die meisten Makler verschweigen dir das."' },
      {
        l: "Hook 3",
        t: '"Deine Wohnung ist mehr wert, als du denkst."',
      },
    ],
    hashtags: ["#Immobilien", "#Makler", "#Wohnung"],
    scores: [
      ["Viral-Fit", "91"],
      ["Klarheit", "85"],
      ["CTA", "82"],
    ],
  },
  {
    id: "produkt",
    tool: "Produkt-Werbung",
    user: "Erstelle eine Reel-Ad für meine KI-Steuer-App.",
    agent: "Ich erstelle Hook, Spot-Text, CTA und Caption für dein Reel.",
    tags: ["Finance", "Instagram Reels", "5 Credits"],
    steps: [
      "Anfrage verstanden",
      "Produkt analysiert",
      "Zielgruppe erkannt",
      "Plattform geprüft",
      "Ad-Angle erstellt",
      "Hook generiert",
      "Spot-Text geschrieben",
      "CTA optimiert",
      "Caption erstellt",
      "Compliance geprüft",
      "Format angepasst",
      "Paket bereit",
    ],
    title: "AD SCRIPT BEREIT",
    score: "Hook Score 88 · Risk LOW",
    blocks: [
      {
        l: "Hook",
        t: '"Selbstständig und trotzdem keine Steuer-Panik."',
        bold: true,
      },
      {
        l: "Spot-Text",
        t: "Früher jede Erklärung verschoben. Jetzt dauert's 12 Minuten.",
      },
      { l: "CTA", t: "14 Tage kostenlos — Link in Bio." },
    ],
    hashtags: ["#Steuern2026", "#Freelancer", "#KI"],
    scores: [
      ["Hook Score", "88"],
      ["Klarheit", "91"],
      ["CTA", "82"],
    ],
  },
  {
    id: "kalender",
    tool: "Content Kalender",
    user: "Erstelle einen Content-Kalender für 1 Woche TikTok.",
    agent: "Ich plane 7 Tage Content mit Formaten, Hooks und Posting-Zeiten.",
    tags: ["Content Plan", "TikTok", "2 Credits"],
    steps: [
      "Anfrage verstanden",
      "Brand DNA geladen",
      "Plattform geprüft",
      "Formate ausgewählt",
      "Posting-Zeiten gesetzt",
      "Mo–Mi geplant",
      "Do–Fr geplant",
      "Sa–So geplant",
      "Hooks optimiert",
      "Reichweite geschätzt",
      "Kalender formatiert",
      "Paket bereit",
    ],
    title: "KALENDER BEREIT",
    score: "Plattform-Fit HIGH · Risk LOW",
    blocks: [
      { l: "Mo", t: "Behind the Scenes — wie dein Produkt entsteht" },
      { l: "Mi", t: "Tutorial — 3 Tricks in 30 Sekunden" },
      { l: "Fr", t: "UGC-Testimonial — authentisch & direkt" },
    ],
    hashtags: ["#ContentPlan", "#TikTok", "#Creator"],
    scores: [
      ["Posts", "7"],
      ["Formate", "4"],
      ["Reach", "HIGH"],
    ],
  },
  {
    id: "avatar",
    tool: "Mein KI-Ich",
    user: "Erstelle meinen KI-Avatar aus meinem Foto.",
    agent: "Ich erstelle deinen personalisierten Avatar mit Face-Match.",
    tags: ["Avatar", "fal.ai", "3 Credits"],
    steps: [
      "Anfrage verstanden",
      "Foto analysiert",
      "Gesicht erkannt",
      "Consent geprüft",
      "Stil ausgewählt",
      "Avatar generiert",
      "Face-Match validiert",
      "Qualität geprüft",
      "Safety-Check",
      "Export vorbereitet",
      "Gallery gespeichert",
      "Paket bereit",
    ],
    title: "AVATAR BEREIT",
    score: "Face-Match HIGH · Consent ✓",
    blocks: [
      {
        l: "Status",
        t: "Gesicht erkannt — Avatar generiert",
        bold: true,
      },
      { l: "Stil", t: "Professional Creator Look — clean, modern" },
      { l: "Consent", t: "Nur dein eigenes Bildmaterial verwendet." },
    ],
    hashtags: ["#KIAvatar", "#Creator", "#InfluexAI"],
    scores: [
      ["Face-Fit", "98%"],
      ["Stil", "HIGH"],
      ["Safety", "✓"],
    ],
  },
];

const CARD_SHELL: CSSProperties = {
  background: "rgba(6, 6, 8, 0.88)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(180,255,0,0.22)",
  borderRadius: 22,
  boxShadow:
    "0 24px 80px rgba(0,0,0,0.55), 0 0 48px rgba(180,255,0,0.10)",
  padding: "clamp(18px, 3vw, 26px)",
  overflow: "visible",
};

function revealStyle(
  visible: boolean,
  animate: boolean,
  offset = 10
): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${offset}px)`,
    transition: animate
      ? `opacity ${TRANSITION_MS}ms ease-out, transform ${TRANSITION_MS}ms ease-out`
      : "none",
    pointerEvents: visible ? "auto" : "none",
  };
}

function FadeBlock({
  visible,
  animate,
  children,
  style,
}: {
  visible: boolean;
  animate: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...revealStyle(visible, animate), ...style }}>{children}</div>
  );
}

function ScenePanel({
  scene,
  active,
  panelActive,
  activeStep,
  animate,
}: {
  scene: Scene;
  active: boolean;
  panelActive: boolean;
  activeStep: number;
  animate: boolean;
}) {
  const stepCount = scene.steps.length;
  const progressIndex = Math.max(0, Math.min(activeStep - 2, stepCount - 1));
  const progressPct = Math.round(((progressIndex + 1) / stepCount) * 100);
  const showUser = activeStep >= 0;
  const showAgent = activeStep >= 1;
  const showTags = activeStep >= 2;
  const showProgress = activeStep >= 2;
  const showResult = activeStep >= 9;
  const showActions = activeStep >= 10;

  const windowStart = Math.max(
    0,
    Math.min(progressIndex - 1, stepCount - VISIBLE_STEP_WINDOW)
  );
  const visibleSteps = scene.steps.slice(
    windowStart,
    windowStart + VISIBLE_STEP_WINDOW
  );

  const panelStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflow: "hidden",
    opacity: panelActive ? 1 : 0,
    transform: panelActive ? "translateY(0) scale(1)" : "translateY(16px) scale(0.985)",
    filter: panelActive ? "blur(0)" : "blur(3px)",
    pointerEvents: panelActive ? "auto" : "none",
    transition: animate
      ? `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease, filter ${TRANSITION_MS}ms ease`
      : "none",
  };

  return (
    <div style={panelStyle} aria-hidden={!panelActive}>
      <FadeBlock visible={showUser && active} animate={animate && panelActive}>
        <div
          style={{
            background: "rgba(180,255,0,0.07)",
            border: "1px solid rgba(180,255,0,0.18)",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#B4FF00",
              letterSpacing: "0.12em",
              fontWeight: 700,
              textTransform: "none",
              marginBottom: 4,
            }}
          >
            Du
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.5,
            }}
          >
            {scene.user}
          </div>
        </div>
      </FadeBlock>

      <FadeBlock visible={showAgent && active} animate={animate && panelActive}>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.12em",
              fontWeight: 700,
              textTransform: "none",
              marginBottom: 4,
            }}
          >
            Agent
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
            }}
          >
            {scene.agent}
          </div>
        </div>
      </FadeBlock>

      <FadeBlock visible={showTags && active} animate={animate && panelActive}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {scene.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 11,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </FadeBlock>

      <div style={{ flexShrink: 0, minHeight: 72 }}>
        <FadeBlock
          visible={showProgress && active}
          animate={animate && panelActive}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.08em",
                textTransform: "none",
              }}
            >
              Ausführung
            </span>
            <span style={{ fontSize: 11, color: "#B4FF00", fontWeight: 700 }}>
              {Math.min(progressIndex + 1, stepCount)} / {stepCount}
            </span>
          </div>
          <div
            style={{
              height: 3,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "#B4FF00",
                borderRadius: 99,
                transition: animate
                  ? `width ${TRANSITION_MS}ms ease-out`
                  : "none",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${VISIBLE_STEP_WINDOW}, minmax(0, 1fr))`,
              gap: 5,
              minHeight: 44,
            }}
          >
            {visibleSteps.map((label, i) => {
              const stepIdx = windowStart + i;
              const isDone = stepIdx < progressIndex;
              const isCurrent = stepIdx === progressIndex;
              return (
                <div
                  key={`${scene.id}-${label}-${stepIdx}`}
                  style={{
                    padding: "6px 4px",
                    borderRadius: 8,
                    textAlign: "center",
                    fontSize: 9,
                    lineHeight: 1.25,
                    border: isCurrent
                      ? "1px solid #B4FF00"
                      : isDone
                        ? "1px solid rgba(180,255,0,0.28)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background: isCurrent
                      ? "#B4FF00"
                      : isDone
                        ? "rgba(180,255,0,0.06)"
                        : "rgba(255,255,255,0.03)",
                    color: isCurrent
                      ? "#060608"
                      : isDone
                        ? "rgba(180,255,0,0.75)"
                        : "rgba(255,255,255,0.32)",
                    fontWeight: isCurrent ? 700 : 400,
                    transition: animate
                      ? `opacity ${TRANSITION_MS}ms ease-out, transform ${TRANSITION_MS}ms ease-out`
                      : "none",
                  }}
                >
                  {isDone ? "✓ " : ""}
                  {label}
                </div>
              );
            })}
          </div>
        </FadeBlock>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            borderRadius: 14,
            border: "1px solid rgba(180,255,0,0.2)",
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
            ...revealStyle(showResult && active, animate && panelActive, 12),
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#B4FF00",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "none",
              }}
            >
              ✓ {scene.title}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.42)" }}>
              {scene.score}
            </span>
          </div>

          <div
            style={{
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {scene.blocks.map((block) => (
              <div key={block.l}>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(180,255,0,0.6)",
                    letterSpacing: "0.1em",
                    textTransform: "none",
                    fontWeight: 700,
                    marginBottom: 3,
                  }}
                >
                  {block.l}
                </div>
                <div
                  style={{
                    fontSize: block.bold ? 13 : 12,
                    color: block.bold ? "#fff" : "rgba(255,255,255,0.76)",
                    fontWeight: block.bold ? 600 : 400,
                    lineHeight: 1.45,
                  }}
                >
                  {block.t}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {scene.hashtags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    color: "rgba(180,255,0,0.72)",
                    background: "rgba(180,255,0,0.08)",
                    border: "1px solid rgba(180,255,0,0.14)",
                    borderRadius: 6,
                    padding: "3px 7px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 6,
              }}
            >
              {scene.scores.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "7px 8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      color: "rgba(255,255,255,0.35)",
                      letterSpacing: "0.06em",
                      textTransform: "none",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#B4FF00",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "8px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 8,
              flexShrink: 0,
              ...revealStyle(showActions && active, animate && panelActive, 8),
            }}
          >
            <button
              type="button"
              tabIndex={panelActive ? 0 : -1}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(180,255,0,0.28)",
                background: "transparent",
                color: "rgba(180,255,0,0.85)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Kopieren
            </button>
            <button
              type="button"
              tabIndex={panelActive ? 0 : -1}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#B4FF00",
                color: "#060608",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Exportieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentPreviewDemo({ compact = false }: { compact?: boolean }) {
  const [activeScene, setActiveScene] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scene = SCENES[activeScene];
  const maxStep = scene ? scene.steps.length + 1 : 11;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setActiveStep(maxStep);
      return;
    }
    setActiveStep(0);
  }, [activeScene, reducedMotion, maxStep]);

  useEffect(() => {
    if (reducedMotion || paused) return;

    const sceneTimer = window.setInterval(() => {
      setActiveScene((prev) => (prev + 1) % SCENES.length);
    }, SCENE_DURATION);

    return () => window.clearInterval(sceneTimer);
  }, [reducedMotion, paused]);

  useEffect(() => {
    if (reducedMotion || paused) return;

    const stepTimer = window.setInterval(() => {
      setActiveStep((prev) => {
        const steps = SCENES[activeScene]?.steps.length ?? 12;
        const cap = steps + 1;
        return prev >= cap ? cap : prev + 1;
      });
    }, STEP_INTERVAL);

    return () => window.clearInterval(stepTimer);
  }, [activeScene, reducedMotion, paused]);

  const selectScene = useCallback(
    (index: number) => {
      setActiveScene(index);
      setActiveStep(reducedMotion ? maxStep : 0);
    },
    [reducedMotion, maxStep]
  );

  const handleFocusIn = useCallback(() => setPaused(true), []);
  const handleFocusOut = useCallback((e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setPaused(false);
    }
  }, []);

  const animate = !reducedMotion;
  const displayStep = reducedMotion ? maxStep : activeStep;

  const shellHeight = compact
    ? "clamp(420px, 52vh, 520px)"
    : "clamp(520px, 60vh, 650px)";

  return (
    <div
      className={`w-full ${compact ? "max-w-[520px]" : "max-w-[560px]"}`}
      style={{ fontFamily: "var(--font-dm, DM Sans), sans-serif" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
    >
      <div style={CARD_SHELL}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 10,
                color: "#B4FF00",
                letterSpacing: "0.14em",
                fontWeight: 700,
                textTransform: "none",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#B4FF00",
                  boxShadow: "0 0 8px rgba(180,255,0,0.65)",
                  flexShrink: 0,
                }}
              />
              InfluexAI Agent
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.3,
              }}
            >
              {scene?.tool}
            </div>
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              fontWeight: 700,
              textTransform: "none",
              color: paused ? "rgba(255,255,255,0.45)" : "#B4FF00",
              border: `1px solid ${paused ? "rgba(255,255,255,0.12)" : "rgba(180,255,0,0.35)"}`,
              borderRadius: 999,
              padding: "5px 10px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {paused ? "Paused" : reducedMotion ? "Static" : "Auto Running"}
          </div>
        </div>

        <div
          className={`mb-4 flex gap-2 ${compact ? "flex-nowrap overflow-x-auto pb-1" : "flex-wrap"}`}
          role="tablist"
          aria-label="Agent Tool Demos"
          style={compact ? { scrollbarWidth: "none" } : undefined}
        >
          {SCENES.map((s, index) => {
            const isActive = index === activeScene;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectScene(index)}
                style={{
                  flexShrink: compact ? 0 : undefined,
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: isActive
                    ? "1px solid #B4FF00"
                    : "1px solid rgba(255,255,255,0.10)",
                  background: isActive ? "#B4FF00" : "rgba(255,255,255,0.04)",
                  color: isActive ? "#060608" : "rgba(255,255,255,0.55)",
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                }}
              >
                {s.tool}
              </button>
            );
          })}
        </div>

        <div
          className="agent-preview-shell relative w-full overflow-hidden"
          style={{
            height: shellHeight,
            minHeight: compact ? 420 : 520,
          }}
        >
          {SCENES.map((s, index) => (
            <ScenePanel
              key={s.id}
              scene={s}
              active={index === activeScene}
              panelActive={index === activeScene}
              activeStep={index === activeScene ? displayStep : 0}
              animate={animate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

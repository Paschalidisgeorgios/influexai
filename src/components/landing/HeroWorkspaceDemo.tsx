"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { heroScenes } from "@/data/landingAgentDemos";

const PHASE_MS = 1100;
const SCENE_COUNT = heroScenes.length;
const TRANSITION_MS = 320;

const SCENES = heroScenes;

const GLASS: CSSProperties = {
  background: "rgba(6, 6, 8, 0.72)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(180,255,0,0.18)",
  borderRadius: 20,
  boxShadow:
    "0 0 0 1px rgba(180,255,0,0.05), 0 20px 60px rgba(0,0,0,0.45), 0 0 32px rgba(180,255,0,0.06)",
};

function panelMotion(
  visible: boolean,
  animate: boolean,
  y = 14,
  scale = 0.98
): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible
      ? "translateY(0) scale(1)"
      : `translateY(${y}px) scale(${scale})`,
    filter: visible ? "blur(0)" : "blur(4px)",
    transition: animate
      ? `opacity ${TRANSITION_MS}ms ease-out, transform ${TRANSITION_MS}ms ease-out, filter ${TRANSITION_MS}ms ease-out`
      : "none",
    pointerEvents: visible ? "auto" : "none",
  };
}

function GlassPanel({
  visible,
  animate,
  style,
  children,
}: {
  visible: boolean;
  animate: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        ...GLASS,
        position: "absolute",
        ...panelMotion(visible, animate),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function HeroWorkspaceDemo({ compact = false }: { compact?: boolean }) {
  const [activeScene, setActiveScene] = useState(0);
  const [phase, setPhase] = useState(0);
  const [agentStepIdx, setAgentStepIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scene = SCENES[activeScene];
  const staticPhase = reducedMotion ? 5 : phase;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setPhase(5);
      setAgentStepIdx(scene.agentSteps.length - 1);
      return;
    }
    setPhase(0);
    setAgentStepIdx(0);
  }, [activeScene, reducedMotion, scene.agentSteps.length]);

  useEffect(() => {
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setPhase((prev) => {
        if (prev >= 5) {
          setActiveScene((s) => (s + 1) % SCENE_COUNT);
          return 0;
        }
        return prev + 1;
      });
    }, PHASE_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || staticPhase < 2) return;

    const id = window.setInterval(() => {
      setAgentStepIdx((prev) =>
        prev >= scene.agentSteps.length - 1 ? prev : prev + 1
      );
    }, PHASE_MS * 0.85);

    return () => window.clearInterval(id);
  }, [activeScene, reducedMotion, staticPhase, scene.agentSteps.length]);

  const animate = !reducedMotion;
  const showStatus = staticPhase >= 0;
  const showPrompt = staticPhase >= 1;
  const showAgent = staticPhase >= 2;
  const showOutputs = staticPhase >= 3;
  const showResult = staticPhase >= 4;

  const stageStyle: CSSProperties = compact
    ? {
        width: "100%",
        maxWidth: 520,
        height: "clamp(420px, 55vh, 520px)",
      }
    : {
        width: "min(46vw, 620px)",
        height: "clamp(520px, 62vh, 680px)",
      };

  return (
    <div
      className="relative mx-auto lg:mx-0"
      style={{
        ...stageStyle,
        fontFamily: "var(--font-dm, DM Sans), sans-serif",
      }}
      aria-live="polite"
      aria-label="InfluexAI Agent Workspace Demo"
    >
      {/* Status pill */}
      <GlassPanel
        visible={showStatus}
        animate={animate}
        style={{ top: 0, left: 0, padding: "8px 14px", borderRadius: 999 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 9,
            letterSpacing: "0.12em",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#B4FF00",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#B4FF00",
              boxShadow: "0 0 8px rgba(180,255,0,0.6)",
            }}
          />
          InfluexAI Agent · Auto Running
        </div>
      </GlassPanel>

      {/* Tool label */}
      <GlassPanel
        visible={showStatus}
        animate={animate}
        style={{
          top: 0,
          right: 0,
          padding: "8px 12px",
          borderRadius: 999,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.65)",
            fontWeight: 600,
          }}
        >
          {scene.toolLabel}
        </span>
      </GlassPanel>

      {/* Prompt panel — center */}
      <GlassPanel
        visible={showPrompt}
        animate={animate}
        style={{
          top: "18%",
          left: "6%",
          right: "8%",
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "rgba(180,255,0,0.7)",
            letterSpacing: "0.1em",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Prompt
        </div>
        <div
          style={{
            fontSize: compact ? 12 : 14,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.5,
          }}
        >
          {scene.prompt}
        </div>
      </GlassPanel>

      {/* Agent thinking */}
      <GlassPanel
        visible={showAgent}
        animate={animate}
        style={{
          top: "38%",
          left: "10%",
          right: "12%",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Agent
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.45,
          }}
        >
          {staticPhase >= 4
            ? scene.agentSummary
            : scene.agentSteps[Math.min(agentStepIdx, scene.agentSteps.length - 1)]}
          {!reducedMotion && staticPhase >= 2 && staticPhase < 4 ? "…" : ""}
        </div>
      </GlassPanel>

      {/* Output cards — left stack */}
      <GlassPanel
        visible={showOutputs}
        animate={animate}
        style={{
          top: "52%",
          left: 0,
          width: compact ? "68%" : "62%",
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "rgba(180,255,0,0.65)",
            letterSpacing: "0.1em",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Output
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scene.outputs.map((out) => (
            <div key={out.label}>
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.38)",
                  marginBottom: 2,
                }}
              >
                {out.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.4,
                }}
              >
                {out.text}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Result card — top right */}
      <GlassPanel
        visible={showResult}
        animate={animate}
        style={{
          top: "34%",
          right: 0,
          width: compact ? "50%" : "46%",
          padding: "14px 16px",
          borderColor: "rgba(180,255,0,0.28)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#B4FF00",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          ✓ {scene.resultTitle}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
          {scene.resultSubtitle}
        </div>
        {scene.resultScore ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(180,255,0,0.75)",
              letterSpacing: "0.04em",
            }}
          >
            {scene.resultScore}
          </div>
        ) : null}
      </GlassPanel>

      {/* Mini preview — bottom right */}
      <GlassPanel
        visible={showResult}
        animate={animate}
        style={{
          bottom: "4%",
          right: "4%",
          width: compact ? "56%" : "52%",
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "rgba(180,255,0,0.6)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Preview
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
          {scene.miniLabel}
        </div>
      </GlassPanel>

      {/* Scene dots */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          paddingTop: 8,
        }}
        aria-hidden
      >
        {SCENES.map((s, i) => (
          <span
            key={s.id}
            style={{
              width: i === activeScene ? 18 : 6,
              height: 6,
              borderRadius: 99,
              background:
                i === activeScene ? "#B4FF00" : "rgba(255,255,255,0.2)",
              transition: animate ? `all ${TRANSITION_MS}ms ease-out` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import type { StudioDemoScenario } from "@/lib/landing-v2-studio-demo-scenarios";

const PANELS = [
  { id: "cockpit", index: "01", label: "Cockpit" },
  { id: "agent", index: "02", label: "Agent" },
  { id: "workflow", index: "03", label: "Workflow" },
  { id: "gallery", index: "04", label: "Galerie" },
] as const;

function SceneHeader({ index, label }: { index: string; label: string }) {
  return (
    <header className="landing-v2-studio-scene__header">
      <span className="landing-v2-studio-scene__index">{index}</span>
      <span className="landing-v2-studio-scene__label">{label}</span>
    </header>
  );
}

function CockpitScene({ scenario }: { scenario: StudioDemoScenario }) {
  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--cockpit"
    >
      <SceneHeader index={PANELS[0].index} label={PANELS[0].label} />
      <div className="landing-v2-studio-scene__body">
        <p className="landing-v2-studio-scene__command">{scenario.cockpit.command}</p>
        <dl className="landing-v2-studio-scene__signals">
          {scenario.cockpit.signals.map((signal) => (
            <div key={signal.label} className="landing-v2-studio-scene__signal">
              <dt className="landing-v2-studio-scene__signal-label">{signal.label}</dt>
              <dd className="landing-v2-studio-scene__signal-value">{signal.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </li>
  );
}

function AgentScene({ scenario }: { scenario: StudioDemoScenario }) {
  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--agent"
    >
      <SceneHeader index={PANELS[1].index} label={PANELS[1].label} />
      <div className="landing-v2-studio-scene__body">
        <div className="landing-v2-studio-scene__prompt-block">
          <p className="landing-v2-studio-scene__prompt-label">Original</p>
          <p className="landing-v2-studio-scene__prompt-text">{scenario.agent.original}</p>
        </div>
        <div className="landing-v2-studio-scene__prompt-block landing-v2-studio-scene__prompt-block--optimized">
          <p className="landing-v2-studio-scene__prompt-label">Optimiert</p>
          <p className="landing-v2-studio-scene__prompt-text landing-v2-studio-scene__prompt-text--optimized">
            {scenario.agent.optimized}
          </p>
        </div>
        <div className="landing-v2-studio-scene__chips">
          {scenario.agent.chips.map((chip) => (
            <span key={chip} className="landing-v2-studio-scene__chip">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}

function WorkflowScene({ scenario }: { scenario: StudioDemoScenario }) {
  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--workflow"
    >
      <SceneHeader index={PANELS[2].index} label={PANELS[2].label} />
      <div className="landing-v2-studio-scene__body">
        <p className="landing-v2-studio-scene__route">{scenario.workflow.title}</p>
        <ul className="landing-v2-studio-scene__options">
          {scenario.workflow.rows.map((row) => (
            <li key={row.label} className="landing-v2-studio-scene__option">
              <span className="landing-v2-studio-scene__option-label">{row.label}</span>
              <span className="landing-v2-studio-scene__option-value">{row.value}</span>
            </li>
          ))}
        </ul>
        <div className="landing-v2-studio-scene__actions-group">
          <p className="landing-v2-studio-scene__actions-label">Next Actions</p>
          <div className="landing-v2-studio-scene__actions">
            {scenario.workflow.actions.map((action) => (
              <span key={action} className="landing-v2-studio-scene__action">
                {action}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

function GalleryScene({ scenario }: { scenario: StudioDemoScenario }) {
  const { gallery } = scenario;

  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--gallery"
    >
      <SceneHeader index={PANELS[3].index} label={PANELS[3].label} />
      <div className="landing-v2-studio-scene__body">
        {gallery.thumbnails?.length ? (
          <>
            <div className="landing-v2-studio-scene__thumb-row" aria-label="Referenzbilder Demo">
              {gallery.thumbnails.map((thumb) => (
                <img
                  key={thumb.src}
                  src={thumb.src}
                  alt={thumb.alt}
                  className="landing-v2-studio-scene__thumb"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
            {gallery.demoNote ? (
              <p className="landing-v2-studio-scene__demo-note">{gallery.demoNote}</p>
            ) : null}
          </>
        ) : null}
        <ul className="landing-v2-studio-scene__assets">
          {gallery.assets.map((asset) => (
            <li key={asset} className="landing-v2-studio-scene__asset">
              <span className="landing-v2-studio-scene__asset-dot" aria-hidden />
              {asset}
            </li>
          ))}
        </ul>
        <div className="landing-v2-studio-scene__actions-group">
          <p className="landing-v2-studio-scene__actions-label">Actions</p>
          <div className="landing-v2-studio-scene__actions">
            {gallery.actions.map((action) => (
              <span key={action} className="landing-v2-studio-scene__action">
                {action}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

type LandingV2StudioProductScenesProps = {
  scenario: StudioDemoScenario;
};

/** Four product scenes — Cockpit, Agent, Workflow, Galerie */
export function LandingV2StudioProductScenes({ scenario }: LandingV2StudioProductScenesProps) {
  return (
    <ul
      className="landing-v2-studio-scenes"
      aria-label={`Studio Produktionsflächen — ${scenario.label}`}
      key={scenario.id}
    >
      <CockpitScene scenario={scenario} />
      <AgentScene scenario={scenario} />
      <WorkflowScene scenario={scenario} />
      <GalleryScene scenario={scenario} />
    </ul>
  );
}

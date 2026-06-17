"use client";

import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";

const scenes = LANDING_V2_COPY.studio.scenes;

function SceneHeader({ index, label }: { index: string; label: string }) {
  return (
    <header className="landing-v2-studio-scene__header">
      <span className="landing-v2-studio-scene__index">{index}</span>
      <span className="landing-v2-studio-scene__label">{label}</span>
    </header>
  );
}

function CockpitScene() {
  const scene = scenes[0];
  if (!scene || scene.id !== "cockpit") return null;

  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--cockpit"
    >
      <SceneHeader index={scene.index} label={scene.label} />
      <div className="landing-v2-studio-scene__body">
        <p className="landing-v2-studio-scene__command">{scene.command}</p>
        <dl className="landing-v2-studio-scene__signals">
          {scene.signals.map((signal) => (
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

function AgentScene() {
  const scene = scenes[1];
  if (!scene || scene.id !== "agent") return null;

  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--agent"
    >
      <SceneHeader index={scene.index} label={scene.label} />
      <div className="landing-v2-studio-scene__body">
        <div className="landing-v2-studio-scene__prompt-block">
          <p className="landing-v2-studio-scene__prompt-label">Original</p>
          <p className="landing-v2-studio-scene__prompt-text">{scene.original}</p>
        </div>
        <div className="landing-v2-studio-scene__prompt-block landing-v2-studio-scene__prompt-block--optimized">
          <p className="landing-v2-studio-scene__prompt-label">Optimiert</p>
          <p className="landing-v2-studio-scene__prompt-text landing-v2-studio-scene__prompt-text--optimized">
            {scene.optimized}
          </p>
        </div>
        <div className="landing-v2-studio-scene__chips">
          {scene.chips.map((chip) => (
            <span key={chip} className="landing-v2-studio-scene__chip">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}

function WorkflowScene() {
  const scene = scenes[2];
  if (!scene || scene.id !== "workflow") return null;

  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--workflow"
    >
      <SceneHeader index={scene.index} label={scene.label} />
      <div className="landing-v2-studio-scene__body">
        <p className="landing-v2-studio-scene__route">{scene.route}</p>
        <ul className="landing-v2-studio-scene__options">
          {scene.options.map((opt) => (
            <li key={opt.label} className="landing-v2-studio-scene__option">
              <span className="landing-v2-studio-scene__option-label">{opt.label}</span>
              <span className="landing-v2-studio-scene__option-value">{opt.value}</span>
            </li>
          ))}
        </ul>
        <div className="landing-v2-studio-scene__actions-group">
          <p className="landing-v2-studio-scene__actions-label">Next Actions</p>
          <div className="landing-v2-studio-scene__actions">
            {scene.nextActions.map((action) => (
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

function GalleryScene() {
  const scene = scenes[3];
  if (!scene || scene.id !== "gallery") return null;

  return (
    <li
      data-studio-scene
      className="landing-v2-studio-scene landing-v2-studio-scene--gallery"
    >
      <SceneHeader index={scene.index} label={scene.label} />
      <div className="landing-v2-studio-scene__body">
        <ul className="landing-v2-studio-scene__assets">
          {scene.assets.map((asset) => (
            <li key={asset} className="landing-v2-studio-scene__asset">
              <span className="landing-v2-studio-scene__asset-dot" aria-hidden />
              {asset}
            </li>
          ))}
        </ul>
        <div className="landing-v2-studio-scene__actions-group">
          <p className="landing-v2-studio-scene__actions-label">Actions</p>
          <div className="landing-v2-studio-scene__actions">
            {scene.actions.map((action) => (
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

/** Four product scenes — Cockpit, Agent, Workflow, Galerie */
export function LandingV2StudioProductScenes() {
  return (
    <ul className="landing-v2-studio-scenes" aria-label="Studio Produktionsflächen">
      <CockpitScene />
      <AgentScene />
      <WorkflowScene />
      <GalleryScene />
    </ul>
  );
}

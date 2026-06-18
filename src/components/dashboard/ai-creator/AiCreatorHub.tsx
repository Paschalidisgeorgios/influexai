"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Film,
  ImageIcon,
  Megaphone,
  ScanFace,
  Sparkles,
  UserRound,
  Users,
  Video,
  Wand2,
} from "lucide-react";
import {
  AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
  AI_CREATOR_SELF_WORKFLOW_HREF,
  characterTypeLabel,
  HUB_PHASE_LABELS,
  HUB_PHASE_TONE,
  mapCharacterStatusToHubPhase,
} from "@/lib/ai-creator/hub-status";
import type { CharacterType } from "@/lib/ai-creator/types";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardKicker,
  DashboardPageHeader,
  DashboardPanel,
  DashboardSection,
} from "@/components/dashboard/core/DashboardSurface";

type WizardPath = "self" | "fictional";

type HubCharacter = {
  id: string;
  name: string;
  characterType: CharacterType | "unknown" | null;
  trainingStatus: string;
  previewImageUrl: string | null;
  source?: string;
};

function friendlyCharacterLoadError(error?: string): string {
  if (
    !error ||
    error === "generation_failed" ||
    error === "table_missing" ||
    error === "Nicht eingeloggt."
  ) {
    return "Character-Liste derzeit nicht verfügbar. Du kannst trotzdem einen Workflow starten.";
  }
  return error;
}

type WizardStep = {
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
};

const SELF_WIZARD_STEPS: WizardStep[] = [
  {
    title: "Referenzbilder vorbereiten",
    description: "Sammle klare Fotos von dir — verschiedene Winkel, gutes Licht, ohne Filter.",
    href: AI_CREATOR_SELF_WORKFLOW_HREF,
    hrefLabel: "KI-Ich öffnen",
  },
  {
    title: "Rechte & Zustimmung bestätigen",
    description: "Bestätige vor Uploads, dass du Rechte und Einwilligung für alle Referenzen hast.",
  },
  {
    title: "Persona-Profil ergänzen",
    description: "Name, Stil und Einsatzzweck festlegen — für konsistente spätere Visuals.",
    href: AI_CREATOR_SELF_WORKFLOW_HREF,
    hrefLabel: "KI-Ich öffnen",
  },
  {
    title: "Character vorbereiten",
    description: "Referenzen hochladen und Trainingsset im bestehenden LoRA-Workflow vorbereiten.",
    href: AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
    hrefLabel: "LoRA-Workflow öffnen",
  },
  {
    title: "Training vorbereiten",
    description: "Trainingsset finalisieren — echtes Training startet erst im Workflow mit Consent.",
    href: AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
    hrefLabel: "LoRA-Workflow öffnen",
  },
  {
    title: "Später in Workflows nutzen",
    description: "Bilder, UGC, Video und Kampagnen aus einem vorbereiteten Character ableiten.",
    href: "/dashboard/gallery",
    hrefLabel: "Zur Galerie",
  },
];

const FICTIONAL_WIZARD_STEPS: WizardStep[] = [
  {
    title: "Persona beschreiben",
    description:
      "Zielgruppe, Nische und Rolle der Persona für Marken oder Kampagnen im LoRA-Workflow definieren.",
    href: AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
    hrefLabel: "LoRA-Workflow öffnen",
  },
  {
    title: "Look & Stil definieren",
    description:
      "Stilrichtung und visuelle Leitlinien im bestehenden Character-/LoRA-Workflow festlegen.",
    href: AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
    hrefLabel: "Character vorbereiten",
  },
  {
    title: "Referenzset vorbereiten",
    description: "Generierte oder hochgeladene Referenzen für konsistente Visuals sammeln.",
    href: AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
    hrefLabel: "Referenzen vorbereiten",
  },
  {
    title: "Zustimmung & Rechte prüfen",
    description: "Keine echten Personen ohne Erlaubnis nachahmen — Consent ist pro Workflow erforderlich.",
  },
  {
    title: "Character vorbereiten",
    description:
      "Trainingsset und Persona im LoRA-Workflow vorbereiten — nicht zentral im Hub gespeichert.",
    href: AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
    hrefLabel: "LoRA-Workflow öffnen",
  },
  {
    title: "In Workflows verwenden",
    description: "Persona später in Bild-, UGC- und Kampagnen-Workflows wiederverwenden.",
    href: "/dashboard/ugc-video",
    hrefLabel: "UGC Video öffnen",
  },
];

const PRODUCTION_PATHS = [
  {
    label: "LoRA Training",
    description:
      "Persona, Referenzen und LoRA-Vorbereitung für fiktive Characters — bestehender Produktionsweg.",
    href: AI_CREATOR_FICTIONAL_WORKFLOW_HREF,
    icon: Sparkles,
  },
  {
    label: "KI-Ich",
    description: "Eigener Character mit Referenzbildern und Digital-Twin-Vorbereitung.",
    href: AI_CREATOR_SELF_WORKFLOW_HREF,
    icon: UserRound,
  },
  {
    label: "Character Studio",
    description: "Character Swap und Video-Identitäten in bestehenden Akool-Workflows.",
    href: "/dashboard/character-studio",
    icon: ScanFace,
  },
  {
    label: "UGC Video",
    description: "Avatar-basierte UGC-Clips aus vorbereiteten Characters ableiten.",
    href: "/dashboard/ugc-video",
    icon: Video,
  },
  {
    label: "Live Creator",
    description: "Live-Portrait und Echtzeit-Character-Workflows — bestehender Produktionsweg.",
    href: "/dashboard/live-creator",
    icon: Camera,
  },
] as const;

function StatusPill({ status }: { status: string }) {
  const phase = mapCharacterStatusToHubPhase(status);
  const tone = HUB_PHASE_TONE[phase];
  const colors = {
    muted: { bg: "rgba(255,255,255,0.06)", text: DASHBOARD_MUTED },
    active: { bg: "rgba(180,255,0,0.12)", text: DASHBOARD_ACCENT },
    success: { bg: "rgba(52,211,153,0.12)", text: "#34d399" },
    error: { bg: "rgba(248,113,113,0.12)", text: "#f87171" },
  }[tone];

  return (
    <span
      className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: colors.bg, color: colors.text }}
    >
      {HUB_PHASE_LABELS[phase]}
    </span>
  );
}

function PathOptionCard({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  icon: typeof UserRound;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full min-w-0 flex-col rounded-2xl border p-5 text-left transition-colors hover:border-white/16"
      style={{
        borderColor: selected ? "rgba(180,255,0,0.35)" : "rgba(255,255,255,0.08)",
        background: selected ? "rgba(180,255,0,0.06)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "rgba(180,255,0,0.1)", color: DASHBOARD_ACCENT }}
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="text-base font-semibold" style={{ color: DASHBOARD_TEXT }}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
        {description}
      </p>
    </button>
  );
}

function WizardSteps({ steps, pathLabel }: { steps: WizardStep[]; pathLabel: string }) {
  return (
    <DashboardPanel title={`Wizard — ${pathLabel}`} className="mt-6">
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex min-w-0 gap-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: "rgba(180,255,0,0.12)",
                color: DASHBOARD_ACCENT,
              }}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: DASHBOARD_TEXT }}>
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
                {step.description}
              </p>
              {step.href && step.hrefLabel ? (
                <Link
                  href={step.href}
                  className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 text-xs font-medium no-underline transition-opacity hover:opacity-80"
                  style={{ color: DASHBOARD_ACCENT }}
                >
                  {step.hrefLabel}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
        Schritte verlinken bestehende Workflows. Speichern und Training laufen dort — nicht
        zentral im Hub.
      </p>
    </DashboardPanel>
  );
}

export function AiCreatorHub() {
  const [wizardPath, setWizardPath] = useState<WizardPath | null>(null);
  const [characters, setCharacters] = useState<HubCharacter[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [charactersError, setCharactersError] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    setCharactersLoading(true);
    setCharactersError(null);
    try {
      const res = await fetch("/api/ai-creator/characters");
      const data = (await res.json()) as {
        success?: boolean;
        characters?: HubCharacter[];
        error?: string;
      };
      if (!res.ok || !data.success) {
        setCharacters([]);
        if (res.status !== 401) {
          setCharactersError(
            friendlyCharacterLoadError(data.error ?? undefined)
          );
        }
        return;
      }
      setCharacters(data.characters ?? []);
    } catch {
      setCharacters([]);
      setCharactersError("Characters konnten nicht geladen werden.");
    } finally {
      setCharactersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  const readyCharacters = characters.filter(
    (c) => mapCharacterStatusToHubPhase(c.trainingStatus) === "ready"
  );
  const hasCharacters = characters.length > 0;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <DashboardPageHeader
        kicker="AI Creator"
        title="Bereite einen wiederverwendbaren Character für deine Workflows vor"
        subtitle="Characters, Personas und Digital Twins sind der Kern für konsistente Bilder, UGC, Video und Kampagnen — nicht isolierte Einzeltools."
      />

      <DashboardSection title="Wer ist dein Charakter?">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <PathOptionCard
            title="Ich bin der Charakter"
            description="Für Creator, Gründer oder Personen, die mit eigenen Referenzbildern einen konsistenten AI-Character vorbereiten möchten."
            icon={UserRound}
            selected={wizardPath === "self"}
            onSelect={() => setWizardPath("self")}
          />
          <PathOptionCard
            title="Ich erstelle einen fiktiven Charakter"
            description="Für Marken, Kampagnen und AI Influencer, die eine neue Persona entwickeln möchten."
            icon={Users}
            selected={wizardPath === "fictional"}
            onSelect={() => setWizardPath("fictional")}
          />
        </div>
      </DashboardSection>

      {wizardPath === "self" ? (
        <WizardSteps steps={SELF_WIZARD_STEPS} pathLabel="Eigener Character" />
      ) : null}
      {wizardPath === "fictional" ? (
        <WizardSteps steps={FICTIONAL_WIZARD_STEPS} pathLabel="Fiktive Persona" />
      ) : null}

      <DashboardPanel className="mt-8" title="Consent & Sicherheit">
        <div className="flex gap-3">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0"
            style={{ color: DASHBOARD_ACCENT }}
            aria-hidden
          />
          <ul className="space-y-2 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            <li>Lade nur Bilder hoch, für die du Rechte und Zustimmung hast.</li>
            <li>Imitiere keine echten Personen ohne Erlaubnis.</li>
            <li>Keine Prominenten oder geschützten Personen nachbauen.</li>
            <li>
              Training oder identitätsnahe Workflows erfordern explizite Zustimmung im jeweiligen
              Schritt.
            </li>
            <li>Ohne Zustimmung starten Uploads und Provider-Flows serverseitig nicht.</li>
          </ul>
        </div>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Hinweise ersetzen keine Rechtsberatung. Consent wird pro Workflow geprüft — eine
          dauerhafte Speicherung in der Datenbank ist in dieser Version noch nicht Teil des Hubs.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-3 inline-flex text-xs font-medium no-underline transition-opacity hover:opacity-80"
          style={{ color: DASHBOARD_ACCENT }}
        >
          Einstellungen & Account-Kontext
          <ArrowRight size={12} className="ml-1 inline" aria-hidden />
        </Link>
      </DashboardPanel>

      <DashboardSection title="Deine Characters" className="mt-10">
        {charactersLoading ? (
          <DashboardPanel>
            <p className="text-sm" style={{ color: DASHBOARD_MUTED }}>
              Characters werden geladen…
            </p>
          </DashboardPanel>
        ) : charactersError ? (
          <DashboardPanel>
            <p className="text-sm" style={{ color: DASHBOARD_MUTED }}>
              {charactersError}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setWizardPath("fictional")}
                className="inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: DASHBOARD_TEXT }}
              >
                Fiktiven Character vorbereiten
              </button>
              <button
                type="button"
                onClick={() => setWizardPath("self")}
                className="inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: DASHBOARD_TEXT }}
              >
                Eigenen Character vorbereiten
              </button>
            </div>
          </DashboardPanel>
        ) : hasCharacters ? (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: DASHBOARD_MUTED }}>
              Alle gespeicherten Characters — Status kann je nach Workflow variieren. „Bereit“
              bedeutet trainiert/verfügbar, nicht automatisch kampagnenfertig.
            </p>
            <ul className="space-y-3">
              {characters.map((character) => {
                const phase = mapCharacterStatusToHubPhase(character.trainingStatus);
                const isSelfCharacter =
                  character.characterType === "self" ||
                  character.source === "uploaded";
                const continueHref = isSelfCharacter
                  ? AI_CREATOR_SELF_WORKFLOW_HREF
                  : AI_CREATOR_FICTIONAL_WORKFLOW_HREF;
                const typeLabel = characterTypeLabel(
                  character.characterType,
                  character.source
                );

                return (
                  <li key={character.id}>
                    <DashboardPanel className="!p-4">
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border"
                            style={{ borderColor: "rgba(255,255,255,0.08)" }}
                          >
                            {character.previewImageUrl ? (
                              <Image
                                src={character.previewImageUrl}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div
                                className="flex h-full w-full items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                              >
                                <UserRound size={22} style={{ color: DASHBOARD_MUTED }} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <p
                                className="truncate text-sm font-semibold"
                                style={{ color: DASHBOARD_TEXT }}
                              >
                                {character.name}
                              </p>
                              <StatusPill status={character.trainingStatus} />
                            </div>
                            <p className="mt-0.5 text-xs" style={{ color: DASHBOARD_MUTED }}>
                              {typeLabel}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            href={continueHref}
                            className="inline-flex min-h-[40px] items-center rounded-full px-4 text-xs font-semibold no-underline"
                            style={{ background: DASHBOARD_ACCENT, color: "#080808" }}
                          >
                            {phase === "ready" ? "Öffnen" : "Weiterarbeiten"}
                          </Link>
                          {phase === "ready" ? (
                            <Link
                              href="/dashboard/gallery"
                              className="inline-flex min-h-[40px] items-center rounded-full border px-4 text-xs font-medium no-underline"
                              style={{
                                borderColor: "rgba(255,255,255,0.12)",
                                color: DASHBOARD_TEXT,
                              }}
                            >
                              Galerie
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </DashboardPanel>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <DashboardPanel>
            <p className="text-sm font-medium" style={{ color: DASHBOARD_TEXT }}>
              Noch kein Character vorbereitet.
            </p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
              Starte mit einem eigenen Character oder einer fiktiven Persona — der Hub zeigt dir
              den Weg, Speichern passiert in den verlinkten Workflows.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setWizardPath("fictional")}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold"
                style={{ background: DASHBOARD_ACCENT, color: "#080808" }}
              >
                Fiktiven Character vorbereiten
              </button>
              <button
                type="button"
                onClick={() => setWizardPath("self")}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-5 text-sm font-medium"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: DASHBOARD_TEXT }}
              >
                Eigenen Character vorbereiten
              </button>
            </div>
          </DashboardPanel>
        )}
      </DashboardSection>

      <DashboardSection title="Nächste Schritte" className="mt-10">
        <p className="text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Aktionen für vorbereitete oder fertige Characters — einige Flows öffnen bestehende
          Produktionswege, andere folgen in späteren Phasen.
        </p>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Bild erstellen",
              href: "/dashboard/image-generator",
              icon: ImageIcon,
              enabled: readyCharacters.length > 0,
              hint: readyCharacters.length > 0 ? undefined : "Character muss bereit sein",
            },
            {
              label: "UGC Video vorbereiten",
              href: "/dashboard/ugc-video",
              icon: Video,
              enabled: true,
              hint: "Über bestehenden UGC-Workflow",
            },
            {
              label: "Motion Ad vorbereiten",
              href: undefined,
              icon: Film,
              enabled: false,
              hint: "Bald — über Video-Workflows",
            },
            {
              label: "Kampagne erstellen",
              href: "/dashboard/campaigns",
              icon: Megaphone,
              enabled: true,
              hint: "Kampagnen aus Galerie vorbereiten",
            },
            {
              label: "Galerie öffnen",
              href: "/dashboard/gallery",
              icon: ImageIcon,
              enabled: true,
            },
            {
              label: "Upscale",
              href: undefined,
              icon: Wand2,
              enabled: false,
              hint: "Bald — über Upscaler",
            },
          ].map((action) => {
            const Icon = action.icon;
            const inner = (
              <>
                <Icon size={18} style={{ color: action.enabled ? DASHBOARD_ACCENT : DASHBOARD_MUTED }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: DASHBOARD_TEXT }}>
                    {action.label}
                  </p>
                  {action.hint ? (
                    <p className="mt-0.5 text-[11px]" style={{ color: DASHBOARD_MUTED }}>
                      {action.hint}
                    </p>
                  ) : null}
                </div>
              </>
            );

            if (action.enabled && action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex min-h-[72px] min-w-0 items-start gap-3 rounded-2xl border p-4 no-underline transition-colors hover:border-white/16"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={action.label}
                className="flex min-h-[72px] min-w-0 items-start gap-3 rounded-2xl border p-4 opacity-60"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.01)",
                }}
                aria-disabled
              >
                {inner}
              </div>
            );
          })}
        </div>
      </DashboardSection>

      <section className="mt-10" aria-labelledby="ai-creator-production-paths">
        <DashboardKicker>Bestehende Produktionswege</DashboardKicker>
        <h2
          id="ai-creator-production-paths"
          className="mb-2 text-base font-semibold"
          style={{ color: DASHBOARD_TEXT }}
        >
          Verwandte Produktionswege
        </h2>
        <p className="mb-4 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          AI Creator bündelt Characters zentral — diese Workflows bleiben die konkreten
          Produktionsschritte darunter.
        </p>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {PRODUCTION_PATHS.map((path) => {
            const Icon = path.icon;
            return (
              <Link
                key={path.href}
                href={path.href}
                className="flex min-w-0 gap-3 rounded-2xl border p-4 no-underline transition-colors hover:border-white/16"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(180,255,0,0.08)", color: DASHBOARD_ACCENT }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: DASHBOARD_TEXT }}>
                    {path.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
                    {path.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

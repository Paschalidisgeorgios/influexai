"use client";

/**
 * PreviewSettings — Full settings view with 8 sections.
 * Warm ivory panels for form groups — editorial luxury feel.
 *
 * ALL DATA IS MOCK. No API calls, no DB writes, no auth changes.
 * Isolated to /dashboard/design-preview.
 *
 * Note: "Support Tickets" is listed as Coming Soon — no form, no API.
 */

import { useState } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT    = "#b4ff00";
const IVORY     = "#F4F0E8";
const STONE     = "#DDD4C4";
const DARK_TEXT = "#080808";
const HEADLINE_FONT: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsSection =
  | "account"
  | "billing"
  | "workspace"
  | "brand"
  | "generation"
  | "privacy"
  | "notifications"
  | "api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function IvoryPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`p-6 md:p-8 ${className}`}
      style={{ background: IVORY, border: "1px solid rgba(8,8,8,0.06)" }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="mb-2 block font-mono text-[10px] tracking-[0.22em] uppercase"
      style={{ color: "rgba(8,8,8,0.40)" }}
    >
      {children}
    </label>
  );
}

function TextInput({
  defaultValue,
  placeholder,
}: {
  defaultValue?: string;
  placeholder?:  string;
}) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full border-b py-2 text-[14px] outline-none transition-colors focus:border-black/20"
      style={{
        background:  "transparent",
        borderColor: "rgba(8,8,8,0.12)",
        color:       DARK_TEXT,
      }}
    />
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ background: on ? ACCENT : "rgba(8,8,8,0.12)" }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
        style={{
          background: on ? DARK_TEXT : "rgba(8,8,8,0.35)",
          transform:  on ? "translateX(18px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-6 text-xl font-extrabold tracking-tight text-white"
      style={HEADLINE_FONT}
    >
      {children}
    </h3>
  );
}

function ComingSoonBadge() {
  return (
    <span
      className="inline-block px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase"
      style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)" }}
    >
      Coming Soon
    </span>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function AccountSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Account</SectionTitle>

      {/* MOCK — all values are placeholder data */}
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "rgba(8,8,8,0.35)" }}>
          Persönliche Informationen · Mock
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            { label: "Vorname",       val: "Max"                    },
            { label: "Nachname",      val: "Mustermann"             },
            { label: "E-Mail",        val: "max@influexai.com"      },
            { label: "Unternehmen",   val: "InfluexAI GmbH"         },
          ].map(({ label, val }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <TextInput defaultValue={val} />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 px-5 py-2.5 font-mono text-[11px] tracking-widest uppercase"
          style={{ background: DARK_TEXT, color: IVORY }}
        >
          Speichern
        </button>
      </IvoryPanel>

      {/* Password */}
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "rgba(8,8,8,0.35)" }}>
          Passwort ändern
        </p>
        <div className="flex flex-col gap-5 md:max-w-sm">
          {["Aktuelles Passwort", "Neues Passwort", "Passwort bestätigen"].map((l) => (
            <div key={l}>
              <FieldLabel>{l}</FieldLabel>
              <TextInput placeholder="••••••••" />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 px-5 py-2.5 font-mono text-[11px] tracking-widest uppercase"
          style={{ background: DARK_TEXT, color: IVORY }}
        >
          Passwort aktualisieren
        </button>
      </IvoryPanel>

      {/* Danger Zone */}
      <div className="border border-red-900/20 p-6">
        <p className="mb-3 font-mono text-[10px] tracking-[0.22em] uppercase text-red-800/60">
          Danger Zone
        </p>
        <p className="mb-4 text-[13px] leading-[1.6] text-neutral-500">
          Account dauerhaft löschen. Alle Daten, Assets und Credits werden entfernt.
        </p>
        <button
          type="button"
          className="border border-red-900/25 px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-red-700/60 transition-colors hover:border-red-700/40 hover:text-red-600/80"
        >
          Account löschen
        </button>
      </div>
    </div>
  );
}

function BillingSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Billing & Credits</SectionTitle>

      {/* Plan card — MOCK */}
      <div
        className="relative overflow-hidden border border-white/[0.04] p-7"
        style={{ background: "#0d0d0f" }}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }} />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-1 font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-600">
              Aktueller Plan · Mock
            </p>
            <p className="text-2xl font-extrabold text-white" style={HEADLINE_FONT}>Pro Plan</p>
            <p className="mt-1 text-[13px] text-neutral-500">€79/Monat · Automatische Verlängerung am 01. Jul 2026</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[11px] text-neutral-700">Credits</p>
            <p className="text-3xl font-extrabold" style={{ ...HEADLINE_FONT, color: ACCENT }}>240</p>
            <p className="font-mono text-[10px] text-neutral-700">verbleibend</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-neutral-400 transition-colors hover:text-white border border-white/[0.05]">
            Plan upgraden
          </button>
          <button type="button" className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-neutral-600 transition-colors hover:text-neutral-400">
            Kündigen
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <p className="mb-4 font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-700">
          Letzte Transaktionen · Mock
        </p>
        {[
          { date: "01 Jun 2026", desc: "Pro Plan — Monatlich",   amount: "€79,00", type: "charge"   },
          { date: "28 Mai 2026", desc: "Credits Top-Up 500",      amount: "€49,00", type: "charge"   },
          { date: "01 Mai 2026", desc: "Pro Plan — Monatlich",   amount: "€79,00", type: "charge"   },
          { date: "12 Apr 2026", desc: "API-Fehler Rückerstattung",amount: "€2,40", type: "refund"   },
        ].map(({ date, desc, amount, type }) => (
          <div
            key={desc}
            className="flex items-center justify-between border-b border-white/[0.03] py-4"
          >
            <div>
              <p className="text-[13px] text-white">{desc}</p>
              <p className="font-mono text-[10px] text-neutral-700">{date}</p>
            </div>
            <p
              className="font-mono text-[12px]"
              style={{ color: type === "refund" ? ACCENT : "rgba(255,255,255,0.45)" }}
            >
              {type === "refund" ? `+${amount}` : `-${amount}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspaceSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Workspace</SectionTitle>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "rgba(8,8,8,0.35)" }}>
          Workspace-Einstellungen · Mock
        </p>
        <div className="flex flex-col gap-5">
          {[
            { label: "Workspace-Name",   val: "InfluexAI Studio" },
            { label: "Default-Projekt",  val: "Kampagnen Q3 2026" },
            { label: "Default-Sprache",  val: "Deutsch"           },
          ].map(({ label, val }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <TextInput defaultValue={val} />
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(8,8,8,0.08)" }}>
            <div>
              <p className="text-[14px] font-medium" style={{ color: DARK_TEXT }}>Kollaboration aktivieren</p>
              <p className="mt-0.5 text-[12px]" style={{ color: "rgba(8,8,8,0.40)" }}>Team-Mitglieder können Outputs sehen</p>
            </div>
            <Toggle defaultChecked />
          </div>
        </div>
      </IvoryPanel>
    </div>
  );
}

function BrandDefaultsSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Brand Defaults</SectionTitle>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "rgba(8,8,8,0.35)" }}>
          Marken-Identität · Mock
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            { label: "Markenname",    val: "InfluexAI GmbH"             },
            { label: "Zielgruppe",    val: "Creator & E-Commerce Brands" },
            { label: "Keywords",      val: "AI, Creator, Premium, Viral"  },
            { label: "Brand Voice",   val: "Professionell, direkt, modern" },
          ].map(({ label, val }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <TextInput defaultValue={val} />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <FieldLabel>Farb-Palette</FieldLabel>
          <div className="mt-2 flex gap-2">
            {["#000000", "#ffffff", "#b4ff00", "#1a1a1a"].map((color) => (
              <div
                key={color}
                className="h-8 w-8 cursor-pointer border transition-colors"
                style={{
                  background: color,
                  borderColor: "rgba(8,8,8,0.12)",
                }}
              />
            ))}
            <div className="flex h-8 w-8 cursor-pointer items-center justify-center border border-dashed" style={{ borderColor: "rgba(8,8,8,0.12)" }}>
              <span className="text-[12px]" style={{ color: "rgba(8,8,8,0.30)" }}>+</span>
            </div>
          </div>
        </div>
      </IvoryPanel>
    </div>
  );
}

function GenerationDefaultsSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Generation Defaults</SectionTitle>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "rgba(8,8,8,0.35)" }}>
          Standard-Einstellungen · Mock
        </p>
        <div className="flex flex-col gap-6">
          {[
            { label: "Standard-Bildformat",   options: ["1:1 Square", "16:9 Landscape", "9:16 Portrait", "4:5 Portrait"],   default: "1:1 Square"    },
            { label: "Standard-Videoformat",  options: ["16:9 Landscape", "9:16 Portrait", "1:1 Square"],                  default: "9:16 Portrait"  },
            { label: "Standard-Sprache",      options: ["Deutsch", "English", "Français", "Español"],                      default: "Deutsch"        },
            { label: "Standard-Stil",         options: ["Editorial Luxury", "Cinematic", "Minimal Clean", "UGC Authentic"], default: "Editorial Luxury" },
          ].map(({ label, options, default: def }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <select
                className="w-full border-b py-2 text-[13px] outline-none md:max-w-sm"
                defaultValue={def}
                style={{ background: "transparent", borderColor: "rgba(8,8,8,0.12)", color: DARK_TEXT }}
              >
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(8,8,8,0.08)" }}>
            <div>
              <p className="text-[14px] font-medium" style={{ color: DARK_TEXT }}>Auto-Save aktivieren</p>
              <p className="mt-0.5 text-[12px]" style={{ color: "rgba(8,8,8,0.40)" }}>Outputs automatisch in Gallery speichern</p>
            </div>
            <Toggle defaultChecked />
          </div>
        </div>
      </IvoryPanel>
    </div>
  );
}

function PrivacySection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Datenschutz</SectionTitle>
      <div className="flex flex-col gap-4">
        {[
          { label: "Nutzungsdaten teilen",         desc: "Hilft uns, InfluexAI zu verbessern.",              default: true  },
          { label: "Marketing-E-Mails erhalten",   desc: "Neuigkeiten, Tipps und Feature-Updates.",          default: false },
          { label: "Session-Tracking zulassen",    desc: "Für personalisierte Tool-Empfehlungen.",            default: true  },
          { label: "Anonyme Fehlerberichte",       desc: "Technische Fehler automatisch melden.",             default: true  },
        ].map(({ label, desc, default: def }) => (
          <div
            key={label}
            className="flex items-center justify-between border border-white/[0.04] p-5"
          >
            <div>
              <p className="text-[14px] text-white">{label}</p>
              <p className="mt-0.5 text-[12px] text-neutral-600">{desc}</p>
            </div>
            <Toggle defaultChecked={def} />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Benachrichtigungen</SectionTitle>
      <div className="flex flex-col gap-4">
        {[
          { label: "Generation abgeschlossen",  desc: "Push-Notification wenn ein Asset fertig ist.",    default: true  },
          { label: "Credits niedrig",           desc: "Warnung bei unter 50 verbleibenden Credits.",      default: true  },
          { label: "Neue Features",             desc: "Infos zu neuen Tools und Verbesserungen.",         default: false },
          { label: "Wöchentliche Zusammenfassung",desc: "Summary deiner Studio-Aktivitäten.",              default: false },
          { label: "API-Fehler",                desc: "Sofortige Benachrichtigung bei API-Problemen.",   default: true  },
        ].map(({ label, desc, default: def }) => (
          <div
            key={label}
            className="flex items-center justify-between border border-white/[0.04] p-5"
          >
            <div>
              <p className="text-[14px] text-white">{label}</p>
              <p className="mt-0.5 text-[12px] text-neutral-600">{desc}</p>
            </div>
            <Toggle defaultChecked={def} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>API & Integrationen</SectionTitle>

      {/* API Key — MOCK */}
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "rgba(8,8,8,0.35)" }}>
          API-Schlüssel · Mock
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <FieldLabel>Aktiver API Key</FieldLabel>
            <TextInput defaultValue="ix_live_a1b2c3d4e5f6g7h8i9j0_mock" />
          </div>
          <button
            type="button"
            className="shrink-0 px-4 py-2 font-mono text-[10px] tracking-widest uppercase"
            style={{ background: DARK_TEXT, color: IVORY }}
          >
            Neu generieren
          </button>
        </div>
        <p className="mt-3 font-mono text-[10px] text-neutral-700">
          Erstellt: 01 Jun 2026 · Zuletzt verwendet: 16 Jun 2026
        </p>
      </IvoryPanel>

      {/* Integrations */}
      <div>
        <p className="mb-4 font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-700">
          Verbundene Dienste · Mock
        </p>
        <div className="flex flex-col gap-3">
          {[
            { name: "Zapier",    status: "connected",     desc: "Workflow-Automation"      },
            { name: "Make",      status: "connected",     desc: "No-Code Automation"        },
            { name: "Shopify",   status: "disconnected",  desc: "E-Commerce Integration"    },
            { name: "Meta Ads",  status: "disconnected",  desc: "Paid Advertising"          },
          ].map(({ name, status, desc }) => (
            <div key={name} className="flex items-center justify-between border border-white/[0.04] p-5">
              <div>
                <p className="text-[14px] font-medium text-white">{name}</p>
                <p className="mt-0.5 text-[12px] text-neutral-600">{desc}</p>
              </div>
              <button
                type="button"
                className="font-mono text-[10px] tracking-widest uppercase transition-colors"
                style={{
                  color: status === "connected" ? ACCENT : "rgba(255,255,255,0.35)",
                }}
              >
                {status === "connected" ? "Verbunden" : "Verbinden"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Support Tickets — Coming Soon (no form, no API) */}
      <div className="border border-white/[0.04] p-6">
        <div className="mb-3 flex items-center gap-3">
          <p className="text-[16px] font-semibold text-white" style={HEADLINE_FONT}>
            Support Tickets
          </p>
          <ComingSoonBadge />
        </div>
        <p className="text-[13px] leading-[1.6] text-neutral-500">
          Direkte Support-Tickets innerhalb von InfluexAI — bald verfügbar.
          In der Zwischenzeit erreichst du uns über support@influexai.com.
        </p>
        {/* NOTE: No form, no email API, no database. Planned separately. */}
      </div>
    </div>
  );
}

// ─── Section map ──────────────────────────────────────────────────────────────

const SECTION_NAV: { id: SettingsSection; label: string }[] = [
  { id: "account",       label: "Account"              },
  { id: "billing",       label: "Billing & Credits"    },
  { id: "workspace",     label: "Workspace"            },
  { id: "brand",         label: "Brand Defaults"       },
  { id: "generation",    label: "Generation Defaults"  },
  { id: "privacy",       label: "Datenschutz"          },
  { id: "notifications", label: "Benachrichtigungen"   },
  { id: "api",           label: "API & Integrationen"  },
];

const SECTION_CONTENT: Record<SettingsSection, React.ReactNode> = {
  account:       <AccountSection />,
  billing:       <BillingSection />,
  workspace:     <WorkspaceSection />,
  brand:         <BrandDefaultsSection />,
  generation:    <GenerationDefaultsSection />,
  privacy:       <PrivacySection />,
  notifications: <NotificationsSection />,
  api:           <ApiSection />,
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PreviewSettings() {
  const [active, setActive] = useState<SettingsSection>("account");

  return (
    <div className="pb-24 pt-10 md:pt-16">
      <p className="mb-5 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
        Settings
      </p>
      <h2
        className="mb-10 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl"
        style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
      >
        Workspace
        <br />
        Settings.
      </h2>

      <div className="flex flex-col gap-8 md:flex-row">

        {/* Settings nav — left column */}
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto pb-1 md:w-[200px] md:flex-col md:overflow-visible md:pb-0" style={{ scrollbarWidth: "none" }}>
          {SECTION_NAV.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className="shrink-0 py-2 text-left text-[13px] transition-colors"
                style={{
                  paddingLeft: "12px",
                  borderLeft:  isActive ? "2px solid #b4ff00" : "2px solid transparent",
                  color:       isActive ? "#ffffff" : "rgba(255,255,255,0.30)",
                  whiteSpace:  "nowrap",
                } as React.CSSProperties}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {SECTION_CONTENT[active]}
        </div>

      </div>
    </div>
  );
}

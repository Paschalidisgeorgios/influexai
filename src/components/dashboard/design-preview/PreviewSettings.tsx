"use client";

/**
 * PreviewSettings — Complete settings preview with 8 sections + Coming Soon support.
 * ALL DATA IS MOCK. No API calls, no DB writes, no auth changes.
 * Isolated to /dashboard/design-preview.
 */

import { useState } from "react";
import { useLang } from "./PreviewLang";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT    = "#b4ff00";
const IVORY     = "#F4F0E8";
const DARK_TEXT = "#080808";
const MUTED_ON_LIGHT = "rgba(8,8,8,0.45)";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

type Section = keyof ReturnType<typeof useLang>["t"]["settings"]["sections"];

// ─── Shared primitives ────────────────────────────────────────────────────────

function IvoryPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 md:p-8" style={{ background: IVORY, border: "1px solid rgba(8,8,8,0.06)" }}>
      {children}
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color:"rgba(8,8,8,0.38)" }}>
      {text}
    </label>
  );
}

function TextInput({ defaultValue, placeholder }: { defaultValue?:string; placeholder?:string }) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full border-b py-2 text-[14px] outline-none transition-colors focus:border-black/20"
      style={{ background:"transparent", borderColor:"rgba(8,8,8,0.12)", color:DARK_TEXT }}
    />
  );
}

function Toggle({ on = false }: { on?: boolean }) {
  const [state, setState] = useState(on);
  return (
    <button
      type="button"
      onClick={() => setState(!state)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ background: state ? ACCENT : "rgba(8,8,8,0.12)" }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
        style={{ background: state ? DARK_TEXT : "rgba(8,8,8,0.35)", transform: state ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-6 text-xl font-extrabold tracking-tight"
      style={{ ...HL, color: DARK_TEXT }}
    >
      {children}
    </h3>
  );
}

function SaveBtn({ label }: { label: string }) {
  return (
    <button type="button" className="mt-6 px-5 py-2.5 font-mono text-[11px] tracking-widest uppercase" style={{ background:DARK_TEXT, color:IVORY }}>
      {label}
    </button>
  );
}

// ─── Section: Account ─────────────────────────────────────────────────────────

function AccountSection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>Account</SectionHead>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: MUTED_ON_LIGHT }}>
          Persönliche Informationen
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[["Vorname","Max"],["Nachname","Mustermann"],["E-Mail","max@influexai.com"],["Unternehmen","InfluexAI GmbH"]].map(([l,v])=>(
            <div key={l}><FieldLabel text={l} /><TextInput defaultValue={v} /></div>
          ))}
        </div>
        <SaveBtn label={ts.save} />
      </IvoryPanel>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color:"rgba(8,8,8,0.35)" }}>
          Passwort ändern
        </p>
        <div className="flex flex-col gap-5 md:max-w-sm">
          {["Aktuelles Passwort","Neues Passwort","Bestätigen"].map((l)=>(
            <div key={l}><FieldLabel text={l} /><TextInput placeholder="••••••••" /></div>
          ))}
        </div>
        <SaveBtn label={ts.update} />
      </IvoryPanel>
      <div className="border border-red-900/20 p-6">
        <p className="mb-3 font-mono text-[10px] tracking-[0.22em] uppercase text-red-800/50">{ts.dangerZone}</p>
        <p className="mb-4 text-[13px] leading-[1.6] text-neutral-500">{ts.dangerDesc}</p>
        <button type="button" className="border border-red-900/25 px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-red-700/50 transition-colors hover:text-red-600/70">
          {ts.delete}
        </button>
      </div>
    </div>
  );
}

// ─── Section: Billing ─────────────────────────────────────────────────────────

function BillingSection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>{ts.sections.billing}</SectionHead>
      {/* Plan card */}
      <div className="relative overflow-hidden border border-white/[0.05] bg-[#0d0d10] p-7">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full opacity-15" style={{ background:`radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }} />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-1 font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-500">Plan</p>
            <p className="text-2xl font-extrabold text-white" style={HL}>{t.proPlan}</p>
            <p className="mt-1 text-[13px] text-neutral-500">€79/Monat · Verlängerung 01 Jul 2026</p>
          </div>
          <div className="shrink-0 md:text-right">
            <p className="font-mono text-[11px] text-neutral-700">{t.credits}</p>
            <p className="text-3xl font-extrabold" style={{ ...HL, color:ACCENT }}>240</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" className="border border-white/[0.06] px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-neutral-400 transition-colors hover:text-white">Plan upgraden</button>
        </div>
      </div>
      {/* Transactions */}
      <div className="border border-white/[0.05] bg-[#0d0d10] p-6">
        <p className="mb-4 font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-500">
          Letzte Transaktionen
        </p>
        {[
          ["01 Jun 2026","Pro Plan — Monatlich","−€79,00","charge"],
          ["28 Mai 2026","Credits Top-Up 500","−€49,00","charge"],
          ["12 Apr 2026","API-Fehler Rückerstattung","+€2,40","refund"],
        ].map(([date,desc,amount,type])=>(
          <div key={desc} className="flex items-center justify-between border-b border-white/[0.03] py-4">
            <div>
              <p className="text-[13px] text-white">{desc}</p>
              <p className="font-mono text-[10px] text-neutral-700">{date}</p>
            </div>
            <p className="font-mono text-[12px]" style={{ color: type==="refund" ? ACCENT : "rgba(255,255,255,0.40)" }}>{amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Workspace ───────────────────────────────────────────────────────

function WorkspaceSection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>{ts.sections.workspace}</SectionHead>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color:"rgba(8,8,8,0.35)" }}>
          Team & Projekt-Einstellungen
        </p>
        <div className="flex flex-col gap-5">
          {[["Workspace-Name","InfluexAI Studio"],["Default-Projekt","Kampagnen Q3 2026"],["Sprache","Deutsch"]].map(([l,v])=>(
            <div key={l}><FieldLabel text={l} /><TextInput defaultValue={v} /></div>
          ))}
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor:"rgba(8,8,8,0.08)" }}>
            <div>
              <p className="text-[14px] font-medium" style={{ color:DARK_TEXT }}>Kollaboration</p>
              <p className="mt-0.5 text-[12px]" style={{ color:"rgba(8,8,8,0.40)" }}>Team kann Outputs sehen</p>
            </div>
            <Toggle on />
          </div>
        </div>
        <SaveBtn label={ts.save} />
      </IvoryPanel>
    </div>
  );
}

// ─── Section: Brand ───────────────────────────────────────────────────────────

function BrandSection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>{ts.sections.brand}</SectionHead>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color:"rgba(8,8,8,0.35)" }}>
          Markenidentität & Voice
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[["Markenname","InfluexAI GmbH"],["Zielgruppe","Creator & E-Commerce Brands"],["Keywords","AI, Creator, Premium, Viral"],["Brand Voice","Professionell, direkt, modern"]].map(([l,v])=>(
            <div key={l}><FieldLabel text={l} /><TextInput defaultValue={v} /></div>
          ))}
        </div>
        <div className="mt-5">
          <FieldLabel text="Farb-Palette" />
          <div className="mt-2 flex gap-2">
            {["#000000","#ffffff","#b4ff00","#1a1a1a"].map((c)=>(
              <div key={c} className="h-8 w-8 cursor-pointer border border-black/[0.12]" style={{ background:c }} />
            ))}
            <div className="flex h-8 w-8 cursor-pointer items-center justify-center border border-dashed border-black/[0.12]">
              <span className="text-[14px]" style={{ color:"rgba(8,8,8,0.28)" }}>+</span>
            </div>
          </div>
        </div>
        <SaveBtn label={ts.save} />
      </IvoryPanel>
    </div>
  );
}

// ─── Section: Generation ─────────────────────────────────────────────────────

function GenerationSection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>{ts.sections.generation}</SectionHead>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color:"rgba(8,8,8,0.35)" }}>
          Defaults für Bild & Video
        </p>
        <div className="flex flex-col gap-5">
          {[
            { l:"Standard-Bildformat",  opts:["1:1 Square","4:5 Portrait","16:9 Landscape"],  def:"1:1 Square"   },
            { l:"Standard-Videoformat", opts:["9:16 Portrait","16:9 Landscape","1:1 Square"], def:"9:16 Portrait" },
            { l:"Standard-Stil",        opts:["Editorial Luxury","Cinematic","Minimal Clean"], def:"Editorial Luxury" },
          ].map(({ l, opts, def })=>(
            <div key={l}>
              <FieldLabel text={l} />
              <select className="w-full border-b py-2 text-[13px] outline-none md:max-w-sm" defaultValue={def} style={{ background:"transparent", borderColor:"rgba(8,8,8,0.12)", color:DARK_TEXT }}>
                {opts.map((o)=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor:"rgba(8,8,8,0.08)" }}>
            <div>
              <p className="text-[14px] font-medium" style={{ color:DARK_TEXT }}>Auto-Save</p>
              <p className="mt-0.5 text-[12px]" style={{ color:"rgba(8,8,8,0.40)" }}>Outputs automatisch speichern</p>
            </div>
            <Toggle on />
          </div>
        </div>
        <SaveBtn label={ts.save} />
      </IvoryPanel>
    </div>
  );
}

// ─── Section: Privacy ────────────────────────────────────────────────────────

function PrivacySection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>{ts.sections.privacy}</SectionHead>
      <div className="flex flex-col gap-3">
        {[
          { l:"Nutzungsdaten teilen",       d:"Hilft uns, InfluexAI zu verbessern.", on:true  },
          { l:"Marketing-E-Mails",          d:"Neuigkeiten und Feature-Updates.",    on:false },
          { l:"Session-Tracking",           d:"Für personalisierte Empfehlungen.",   on:true  },
          { l:"Anonyme Fehlerberichte",     d:"Technische Fehler automatisch melden.",on:true  },
        ].map(({ l, d, on })=>(
          <div key={l} className="flex items-center justify-between border border-white/[0.04] bg-[#0c0c10] p-5">
            <div><p className="text-[14px] text-white">{l}</p><p className="mt-0.5 text-[12px] text-neutral-600">{d}</p></div>
            <Toggle on={on} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────

function NotificationsSection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>{ts.sections.notifications}</SectionHead>
      <div className="flex flex-col gap-3">
        {[
          { l:"Generierung abgeschlossen", d:"Push wenn ein Asset fertig ist.",     on:true  },
          { l:"Credits niedrig",           d:"Warnung unter 50 Credits.",            on:true  },
          { l:"Neue Features",             d:"Infos zu neuen Tools.",                on:false },
          { l:"Wöchentliche Zusammenfassung",d:"Summary deiner Aktivitäten.",        on:false },
          { l:"API-Fehler",                d:"Sofortige Meldung bei Problemen.",     on:true  },
        ].map(({ l, d, on })=>(
          <div key={l} className="flex items-center justify-between border border-white/[0.04] bg-[#0c0c10] p-5">
            <div><p className="text-[14px] text-white">{l}</p><p className="mt-0.5 text-[12px] text-neutral-600">{d}</p></div>
            <Toggle on={on} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: API ─────────────────────────────────────────────────────────────

function ApiSection() {
  const { t } = useLang();
  const ts = t.settings;
  return (
    <div className="flex flex-col gap-6">
      <SectionHead>{ts.sections.api}</SectionHead>
      <IvoryPanel>
        <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color:"rgba(8,8,8,0.35)" }}>
          API-Zugang & Schlüssel
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <FieldLabel text="Aktiver API Key" />
            <TextInput defaultValue="ix_live_a1b2c3d4e5f6_mock" />
          </div>
          <button type="button" className="shrink-0 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background:DARK_TEXT, color:IVORY }}>
            Neu generieren
          </button>
        </div>
        <p className="mt-3 font-mono text-[10px] text-neutral-700">Erstellt: 01 Jun 2026 · Zuletzt verwendet: 16 Jun 2026</p>
      </IvoryPanel>

      {/* Integrations */}
      <div>
        <p className="mb-4 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: MUTED_ON_LIGHT }}>
          Verbundene Dienste
        </p>
        {[
          { n:"Zapier",   s:"connected"    },
          { n:"Make",     s:"connected"    },
          { n:"Shopify",  s:"disconnected" },
          { n:"Meta Ads", s:"disconnected" },
        ].map(({ n, s })=>(
          <div key={n} className="flex items-center justify-between border border-white/[0.04] bg-[#0c0c10] p-5">
            <p className="text-[14px] font-medium text-white">{n}</p>
            <button type="button" className="font-mono text-[10px] tracking-widest uppercase transition-colors" style={{ color: s==="connected" ? ACCENT : "rgba(255,255,255,0.30)" }}>
              {s === "connected" ? ts.connected : ts.connect}
            </button>
          </div>
        ))}
      </div>

      {/* Support Tickets — Coming Soon (no form, no API, no DB) */}
      <div className="border border-white/[0.04] bg-[#0c0c10] p-6">
        <div className="mb-3 flex items-center gap-3">
          <p className="text-[16px] font-semibold text-white" style={HL}>{ts.supportTitle}</p>
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.22)", padding:"2px 8px" }}>
            {ts.comingSoon}
          </span>
        </div>
        <p className="text-[13px] leading-[1.6] text-neutral-500">{ts.supportDesc}</p>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

const SECTIONS: Section[] = ["account","billing","workspace","brand","generation","privacy","notifications","api"];

const SECTION_CONTENT: Record<Section, React.ReactNode> = {
  account:       <AccountSection />,
  billing:       <BillingSection />,
  workspace:     <WorkspaceSection />,
  brand:         <BrandSection />,
  generation:    <GenerationSection />,
  privacy:       <PrivacySection />,
  notifications: <NotificationsSection />,
  api:           <ApiSection />,
};

export function PreviewSettings() {
  const { t } = useLang();
  const ts = t.settings;
  const [active, setActive] = useState<Section>("account");

  return (
    <div className="pb-8 pt-4 md:pt-8">
      <p
        className="mb-5 font-mono text-[10px] tracking-[0.28em] uppercase"
        style={{ color: "rgba(245,242,234,0.45)" }}
      >
        {ts.overline}
      </p>
      <h2
        className="mb-8 text-3xl font-extrabold text-white md:mb-10 md:text-4xl"
        style={{ ...HL, letterSpacing: "-0.03em" }}
      >
        {ts.headline}
      </h2>

      <div className="flex flex-col gap-8 md:flex-row">
        <nav
          className="flex shrink-0 flex-row gap-0.5 overflow-x-auto pb-1 md:w-[200px] md:flex-col md:overflow-visible md:pb-0"
          style={{ scrollbarWidth: "none" }}
        >
          {SECTIONS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className="shrink-0 py-2.5 text-left text-[13px] transition-colors"
              style={{
                paddingLeft: "12px",
                borderLeft:
                  active === id ? "2px solid #b4ff00" : "2px solid transparent",
                color:
                  active === id ? "#f5f2ea" : "rgba(245,242,234,0.42)",
                whiteSpace: "nowrap",
                fontWeight: active === id ? 600 : 400,
              }}
            >
              {ts.sections[id]}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">{SECTION_CONTENT[active]}</div>
      </div>
    </div>
  );
}

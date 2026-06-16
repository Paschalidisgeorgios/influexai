"use client";

/**
 * SettingsView — Krea-style zweispaltiges Einstellungs-Interface
 *
 * Layout: 3-Spalten-Grid
 *   col 1 → vertikale Tab-Navigation
 *   col 2-3 → Inhalt der aktiven Sektion
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Zap, Eye, EyeOff, Check, Loader2,
  ExternalLink, RotateCcw, TriangleAlert, Trash2, Key,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SettingsViewProps {
  credits:       number;
  creditsLoaded: boolean;
}

type TabId = "profile" | "api" | "danger";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profil & Guthaben"          },
  { id: "api",     label: "API-Integrationen"           },
  { id: "danger",  label: "Gefahrenzone & Rechtliches"  },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] uppercase tracking-widest text-neutral-500">
      {children}
    </p>
  );
}

function FlatInput({
  type = "text", value, onChange, placeholder, disabled,
}: {
  type?: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded border p-2 text-xs text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-white/20 disabled:opacity-40"
      style={{ background: "#090909", borderColor: "rgba(255,255,255,0.05)" }}
    />
  );
}

// ─── Tab: Profil & Guthaben ───────────────────────────────────────────────────

function ProfileTab({ credits, creditsLoaded }: SettingsViewProps) {
  const [email, setEmail]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    void (async () => {
      const { data: { user } } = await sb.auth.getUser();
      setEmail(user?.email ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* E-Mail */}
      <div>
        <Label>Registrierte E-Mail</Label>
        <p className="text-neutral-300">
          {loading
            ? <span className="inline-block h-3 w-44 animate-pulse rounded bg-white/8" />
            : (email ?? "—")}
        </p>
      </div>

      {/* Credits */}
      <div>
        <Label>Guthaben</Label>
        <p className="text-[22px] font-light tracking-tight text-white">
          {creditsLoaded
            ? <>{credits} <span className="text-[14px] text-neutral-500">Credits ⚡</span></>
            : <span className="inline-block h-6 w-20 animate-pulse rounded bg-white/8" />}
        </p>
      </div>

      {/* Aufladen */}
      <div>
        <a
          href="/dashboard/credits"
          className="inline-flex items-center gap-1.5 rounded border border-white/5 bg-neutral-900 px-3 py-1.5 text-xs text-white transition-colors hover:bg-neutral-800"
        >
          <Zap size={11} style={{ color: "#b4ff00" }} />
          Credits aufladen
        </a>
      </div>
    </div>
  );
}

// ─── Tab: API-Integrationen ───────────────────────────────────────────────────

function ApiTab() {
  const [falKey,    setFalKey]    = useState("");
  const [akoolKey,  setAkoolKey]  = useState("");
  const [showFal,   setShowFal]   = useState(false);
  const [showAkool, setShowAkool] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, []);

  return (
    <div className="space-y-5">
      {/* fal.ai */}
      <div>
        <Label>fal.ai API Key</Label>
        <div className="relative">
          <FlatInput
            type={showFal ? "text" : "password"}
            value={falKey}
            onChange={setFalKey}
            placeholder="fal-…"
          />
          <button
            type="button"
            onClick={() => setShowFal((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 transition-colors hover:text-neutral-400"
          >
            {showFal ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>

      {/* Akool */}
      <div>
        <Label>Akool API Key</Label>
        <div className="relative">
          <FlatInput
            type={showAkool ? "text" : "password"}
            value={akoolKey}
            onChange={setAkoolKey}
            placeholder="ak-…"
          />
          <button
            type="button"
            onClick={() => setShowAkool((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 transition-colors hover:text-neutral-400"
          >
            {showAkool ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving || (!falKey && !akoolKey)}
        className="flex items-center gap-1.5 rounded border border-white/5 bg-neutral-900 px-3 py-1.5 text-xs text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {saving  ? <Loader2 size={11} className="animate-spin" />
        : saved   ? <Check   size={11} className="text-green-400" />
                  : <Key     size={11} />}
        {saved ? "Gespeichert" : saving ? "Speichern…" : "Keys speichern"}
      </button>

      {/* Abonnement */}
      <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Label>Abonnement</Label>
        <p className="mb-3 text-neutral-400">
          InfluexAI Pro Plan · monatliche Abrechnung
        </p>
        <a
          href="/dashboard/credits"
          className="inline-flex items-center gap-1.5 rounded border border-white/5 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-white"
        >
          <ExternalLink size={11} />
          Credits & Abo verwalten
        </a>
      </div>
    </div>
  );
}

// ─── Tab: Gefahrenzone ────────────────────────────────────────────────────────

type RevokeState = "idle" | "loading" | "sent" | "error";
type DeleteStep  = "idle" | "confirm" | "loading" | "error";
const CONFIRM_WORD = "LÖSCHEN";

function DangerTab() {
  const router = useRouter();

  const [revokeState, setRevokeState] = useState<RevokeState>("idle");
  const [deleteStep,  setDeleteStep]  = useState<DeleteStep>("idle");
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleRevoke = useCallback(async () => {
    setRevokeState("loading");
    try {
      const res = await fetch("/api/dashboard/revoke-contract", { method: "POST" });
      setRevokeState(res.ok ? "sent" : "error");
    } catch {
      setRevokeState("error");
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteInput.trim() !== CONFIRM_WORD) {
      setDeleteError(`Bitte tippe exakt „${CONFIRM_WORD}".`);
      return;
    }
    setDeleteError(null);
    setDeleteStep("loading");
    try {
      const res = await fetch("/api/dashboard/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen.");
      router.push("/?deleted=1");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setDeleteStep("error");
    }
  }, [deleteInput, router]);

  return (
    <div className="space-y-7">

      {/* ── Widerruf ──────────────────────────────────────────────────────── */}
      <div>
        <Label>Vertrags-Widerruf · § 355 BGB</Label>
        <p className="mb-3 leading-relaxed text-neutral-500">
          Möchtest du dein Abonnement oder einen kürzlich getätigten Kauf widerrufen?
          Gemäß gesetzlicher Vorgaben kannst du deinen Vertrag hier formlos widerrufen.
          Du erhältst eine Bestätigung per E-Mail.
        </p>
        {revokeState === "sent" ? (
          <span className="flex items-center gap-1.5 text-xs text-green-400/80">
            <Check size={11} /> Widerruf eingegangen — E-Mail wird versendet.
          </span>
        ) : revokeState === "error" ? (
          <p className="text-xs text-red-400/70">
            Fehler. Bitte schreib an support@influexai.com.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void handleRevoke()}
            disabled={revokeState === "loading"}
            className="flex items-center gap-1.5 rounded border border-white/5 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 transition-all hover:border-red-500/20 hover:text-red-400 disabled:opacity-40"
          >
            {revokeState === "loading"
              ? <Loader2 size={11} className="animate-spin" />
              : <RotateCcw size={11} />}
            {revokeState === "loading" ? "Wird gesendet…" : "Vertrag jetzt widerrufen"}
          </button>
        )}
      </div>

      {/* ── Account löschen ───────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(239,68,68,0.10)", paddingTop: "1.5rem" }}>
        <div className="mb-1 flex items-center gap-2">
          <Label>Account löschen</Label>
          <span className="mb-1.5 text-[9px] text-red-500/40">Art. 17 DSGVO</span>
        </div>
        <p className="mb-3 leading-relaxed text-neutral-500">
          Löscht dein Profil, alle Credits und deine gesamte Galerie unwiderruflich.
          Steuerrechtlich aufbewahrungspflichtige Daten (Stripe-Rechnungen) werden
          DSGVO-konform gesperrt.
        </p>

        {deleteStep === "idle" || deleteStep === "error" ? (
          <>
            <button
              type="button"
              onClick={() => { setDeleteStep("confirm"); setDeleteInput(""); setDeleteError(null); }}
              className="flex items-center gap-1.5 rounded border border-red-500/25 bg-red-950/20 px-3 py-1.5 text-xs text-red-400 transition-all hover:bg-red-500 hover:text-white"
            >
              <Trash2 size={11} />
              Account unwiderruflich löschen
            </button>
            {deleteStep === "error" && deleteError && (
              <p className="mt-2 text-xs text-red-400/70">{deleteError}</p>
            )}
          </>
        ) : deleteStep === "confirm" ? (
          <div className="space-y-2.5">
            <p className="text-neutral-500">
              Zur Bestätigung{" "}
              <span className="font-mono text-red-400/80">{CONFIRM_WORD}</span>
              {" "}eingeben:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(null); }}
              placeholder={CONFIRM_WORD}
              autoFocus
              className="w-full rounded border p-2 font-mono text-xs text-red-300 outline-none transition-colors placeholder:text-red-900/50 focus:border-red-500/40"
              style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.18)" }}
            />
            {deleteError && (
              <p className="text-xs text-red-400/70">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={deleteInput.trim() !== CONFIRM_WORD}
                className="flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-all hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 size={11} /> Endgültig löschen
              </button>
              <button
                type="button"
                onClick={() => { setDeleteStep("idle"); setDeleteInput(""); setDeleteError(null); }}
                className="rounded border border-white/5 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-red-400/60">
            <Loader2 size={11} className="animate-spin" />
            Account wird gelöscht…
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function SettingsView({ credits, creditsLoaded }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="w-full pb-16">

      {/* Page title */}
      <div className="mb-6">
        <p className="text-[15px] font-medium text-white/70">Einstellungen</p>
        <p className="mt-0.5 text-[11px] text-neutral-600">
          Konto, Integrationen und rechtliche Optionen
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-8 text-xs text-neutral-300 md:grid-cols-3">

        {/* ── Left: Tab-Navigation ────────────────────────────────────────── */}
        <nav className="flex flex-col gap-0.5 md:col-span-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-2 py-1.5 text-left text-[12px] transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
              style={activeTab === tab.id ? { background: "rgba(255,255,255,0.04)" } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Right: Tab-Inhalt ────────────────────────────────────────────── */}
        <div className="md:col-span-2">
          {activeTab === "profile" && (
            <ProfileTab credits={credits} creditsLoaded={creditsLoaded} />
          )}
          {activeTab === "api" && <ApiTab />}
          {activeTab === "danger" && <DangerTab />}
        </div>

      </div>
    </div>
  );
}

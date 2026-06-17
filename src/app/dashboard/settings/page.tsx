"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPageHeader,
  DashboardPanel,
} from "@/components/dashboard/core/DashboardSurface";
import { StudioCreditsSection } from "@/components/dashboard/core/StudioCreditsSection";

type SettingsSection =
  | "account"
  | "billing"
  | "memory"
  | "generation"
  | "privacy"
  | "integrations"
  | "admin";

const BASE_SECTIONS: { id: Exclude<SettingsSection, "admin">; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "billing", label: "Billing & Credits" },
  { id: "memory", label: "Brand Defaults" },
  { id: "generation", label: "Generation Defaults" },
  { id: "privacy", label: "Datenschutz & Sicherheit" },
  { id: "integrations", label: "Integrationen & API" },
];

const inputClassName =
  "w-full rounded-[18px] border px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#B4FF00]/40 focus:shadow-[0_0_0_4px_rgba(180,255,0,0.08)]";

const inputStyle = {
  background: "rgba(255,255,255,0.65)",
  borderColor: "rgba(8,8,8,0.12)",
  color: DASHBOARD_TEXT,
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="mb-1.5 block text-[0.78rem] font-semibold tracking-wide"
      style={{ color: DASHBOARD_MUTED }}
    >
      {children}
    </label>
  );
}

function StatusMessage({ type, text }: { type: "ok" | "err"; text: string }) {
  return (
    <div
      className="rounded-lg px-3.5 py-2.5 text-sm"
      style={{
        background: type === "ok" ? "rgba(180,255,0,0.10)" : "rgba(255,71,87,0.08)",
        border: `1px solid ${type === "ok" ? "rgba(180,255,0,0.28)" : "rgba(255,71,87,0.25)"}`,
        color: type === "ok" ? "#3d5200" : "#b91c1c",
      }}
    >
      {text}
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-4 py-2.5 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
      style={{
        borderColor: "rgba(8,8,8,0.12)",
        background: "#FFFCF7",
        color: DASHBOARD_TEXT,
      }}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tDelete = useTranslations("settings.deleteAccount");
  const supabase = createClient();
  const { isAdmin } = usePlatformAdmin();

  const sections = useMemo(() => {
    if (!isAdmin) return BASE_SECTIONS;
    return [...BASE_SECTIONS, { id: "admin" as const, label: "Admin" }];
  }, [isAdmin]);

  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dailyIdeasEmail, setDailyIdeasEmail] = useState(true);
  const [savingDailyEmail, setSavingDailyEmail] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [msgPw, setMsgPw] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isAgencyOwner, setIsAgencyOwner] = useState(false);
  const [creatorNische, setCreatorNische] = useState("");
  const [creatorZielgruppe, setCreatorZielgruppe] = useState("");
  const [creatorTonalitaet, setCreatorTonalitaet] = useState("");
  const [creatorPlattformen, setCreatorPlattformen] = useState("");
  const [creatorProdukte, setCreatorProdukte] = useState("");
  const [savingCreatorMemory, setSavingCreatorMemory] = useState(false);
  const [msgCreatorMemory, setMsgCreatorMemory] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isAdmin && activeSection === "admin") {
      setActiveSection("account");
    }
  }, [isAdmin, activeSection]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, email, daily_suggestions_email, stripe_subscription_id"
        )
        .eq("id", user.id)
        .single();

      if (data) {
        setName(data.full_name ?? "");
        setEmail(data.email ?? "");
        setDailyIdeasEmail(data.daily_suggestions_email !== false);
        setHasActiveSubscription(Boolean(data.stripe_subscription_id));
      }

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      setIsAgencyOwner(Boolean(tenant));

      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("nische, zielgruppe, tonalitaet, plattformen, produkte")
        .eq("user_id", user.id)
        .maybeSingle();

      if (creatorProfile) {
        setCreatorNische(creatorProfile.nische ?? "");
        setCreatorZielgruppe(creatorProfile.zielgruppe ?? "");
        setCreatorTonalitaet(creatorProfile.tonalitaet ?? "");
        setCreatorPlattformen((creatorProfile.plattformen ?? []).join(", "));
        setCreatorProdukte((creatorProfile.produkte ?? []).join(", "));
      }
    };
    void load();
  }, [supabase]);

  const saveCreatorMemory = async () => {
    setSavingCreatorMemory(true);
    setMsgCreatorMemory(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const plattformen = creatorPlattformen
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const produkte = creatorProdukte
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase.from("creator_profiles").upsert({
      user_id: user.id,
      nische: creatorNische.trim() || null,
      zielgruppe: creatorZielgruppe.trim() || null,
      tonalitaet: creatorTonalitaet.trim() || null,
      plattformen,
      produkte,
      updated_at: new Date().toISOString(),
    });

    setMsgCreatorMemory(
      error
        ? { type: "err", text: "Speichern fehlgeschlagen." }
        : { type: "ok", text: "Brand Defaults gespeichert." }
    );
    setSavingCreatorMemory(false);
  };

  const resetCreatorMemory = async () => {
    setSavingCreatorMemory(true);
    setMsgCreatorMemory(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("creator_profiles")
      .delete()
      .eq("user_id", user.id);

    if (!error) {
      setCreatorNische("");
      setCreatorZielgruppe("");
      setCreatorTonalitaet("");
      setCreatorPlattformen("");
      setCreatorProdukte("");
    }

    setMsgCreatorMemory(
      error
        ? { type: "err", text: "Zurücksetzen fehlgeschlagen." }
        : { type: "ok", text: "Brand Defaults zurückgesetzt." }
    );
    setSavingCreatorMemory(false);
  };

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user.id);
    setMsg(
      error
        ? { type: "err", text: "Fehler beim Speichern." }
        : { type: "ok", text: "Name gespeichert." }
    );
    setSaving(false);
  };

  const saveDailyIdeasEmail = async (enabled: boolean) => {
    setSavingDailyEmail(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingDailyEmail(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ daily_suggestions_email: enabled })
      .eq("id", user.id);
    if (!error) setDailyIdeasEmail(enabled);
    setSavingDailyEmail(false);
  };

  const savePw = async () => {
    if (!newPw || newPw !== confirmPw) {
      setMsgPw({ type: "err", text: "Passwörter stimmen nicht überein." });
      return;
    }
    if (newPw.length < 6) {
      setMsgPw({ type: "err", text: "Mindestens 6 Zeichen." });
      return;
    }
    setSavingPw(true);
    setMsgPw(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setMsgPw(
      error
        ? { type: "err", text: "Fehler: " + error.message }
        : { type: "ok", text: "Passwort geändert." }
    );
    if (!error) {
      setNewPw("");
      setConfirmPw("");
    }
    setSavingPw(false);
  };

  const sectionContent: Record<SettingsSection, React.ReactNode> = {
    account: (
      <DashboardPanel title="Account">
        <p className="mb-4 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Profil und öffentliche Creator-Identität verwalten.
        </p>
        <Link
          href="/dashboard/profile/public"
          className="mb-5 block rounded-lg border px-3.5 py-3 text-sm font-semibold no-underline transition-colors hover:opacity-90"
          style={{
            background: "rgba(180,255,0,0.10)",
            borderColor: "rgba(180,255,0,0.28)",
            color: DASHBOARD_TEXT,
          }}
        >
          Öffentliches Creator-Profil einrichten →
        </Link>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Name</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel>E-Mail</FieldLabel>
            <input
              value={email}
              disabled
              className={inputClassName}
              style={{ ...inputStyle, opacity: 0.55, cursor: "not-allowed" }}
            />
          </div>
        </div>
        {msg ? <div className="mt-4"><StatusMessage {...msg} /></div> : null}
        <div className="mt-5">
          <PrimaryButton disabled={saving} onClick={() => void saveName()}>
            {saving ? "Wird gespeichert…" : "Name speichern"}
          </PrimaryButton>
        </div>
      </DashboardPanel>
    ),

    billing: (
      <StudioCreditsSection showPackages={false} showApi={false} />
    ),

    memory: (
      <DashboardPanel title="Brand Defaults">
        <p className="mb-4 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Nische, Zielgruppe und Tonalität für den KI Agent — echte Profildaten aus deinem
          Workspace.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Nische</FieldLabel>
            <input
              value={creatorNische}
              onChange={(e) => setCreatorNische(e.target.value)}
              placeholder="z. B. Fitness, Immobilien"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel>Zielgruppe</FieldLabel>
            <input
              value={creatorZielgruppe}
              onChange={(e) => setCreatorZielgruppe(e.target.value)}
              placeholder="z. B. Berufstätige 25–40"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel>Tonalität</FieldLabel>
            <input
              value={creatorTonalitaet}
              onChange={(e) => setCreatorTonalitaet(e.target.value)}
              placeholder="z. B. locker, direkt, vertrauensvoll"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel>Plattformen (kommagetrennt)</FieldLabel>
            <input
              value={creatorPlattformen}
              onChange={(e) => setCreatorPlattformen(e.target.value)}
              placeholder="TikTok, Instagram, YouTube"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Produkte (kommagetrennt)</FieldLabel>
            <input
              value={creatorProdukte}
              onChange={(e) => setCreatorProdukte(e.target.value)}
              placeholder="Kurse, Coaching, physische Produkte"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
        </div>
        {msgCreatorMemory ? (
          <div className="mt-4">
            <StatusMessage {...msgCreatorMemory} />
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <PrimaryButton
            disabled={savingCreatorMemory}
            onClick={() => void saveCreatorMemory()}
          >
            Speichern
          </PrimaryButton>
          <SecondaryButton
            disabled={savingCreatorMemory}
            onClick={() => setResetConfirmOpen(true)}
          >
            Zurücksetzen
          </SecondaryButton>
        </div>
      </DashboardPanel>
    ),

    generation: (
      <DashboardPanel title="Generation Defaults">
        <p className="text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Standard-Formate und Stil-Presets für Bild- und Video-Tools werden pro
          Generierung im jeweiligen Tool gewählt.
        </p>
        <div
          className="mt-5 rounded-lg border border-dashed px-4 py-8 text-center text-sm"
          style={{ borderColor: "rgba(8,8,8,0.12)", color: DASHBOARD_MUTED }}
        >
          Noch keine Workspace-weiten Generation Defaults gespeichert.
        </div>
      </DashboardPanel>
    ),

    privacy: (
      <div className="space-y-4">
        <DashboardPanel title="Passwort">
          <div className="grid max-w-md gap-4">
            <div>
              <FieldLabel>Neues Passwort</FieldLabel>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className={inputClassName}
                style={inputStyle}
              />
            </div>
            <div>
              <FieldLabel>Passwort bestätigen</FieldLabel>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Passwort wiederholen"
                className={inputClassName}
                style={inputStyle}
              />
            </div>
          </div>
          {msgPw ? <div className="mt-4"><StatusMessage {...msgPw} /></div> : null}
          <div className="mt-5">
            <PrimaryButton disabled={savingPw} onClick={() => void savePw()}>
              {savingPw ? "Wird gespeichert…" : "Passwort ändern"}
            </PrimaryButton>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Benachrichtigungen">
          <p className="mb-3 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {t("daily_suggestions_email_desc")}
          </p>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm font-medium" style={{ color: DASHBOARD_TEXT }}>
              {t("daily_suggestions_email_label")}
            </span>
            <input
              type="checkbox"
              checked={dailyIdeasEmail}
              disabled={savingDailyEmail}
              onChange={(e) => void saveDailyIdeasEmail(e.target.checked)}
              className="h-5 w-5 accent-[#B4FF00]"
            />
          </label>
        </DashboardPanel>

        <DashboardPanel title="Konto löschen">
          <p className="mb-4 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {tDelete("danger_desc")}
          </p>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
            style={{
              borderColor: "rgba(185,28,28,0.25)",
              color: "#991b1b",
              background: "#FFFCF7",
            }}
          >
            {tDelete("danger_button")}
          </button>
        </DashboardPanel>
      </div>
    ),

    integrations: (
      <DashboardPanel title="Integrationen & API">
        <p className="mb-4 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          API-Zugang und externe Integrationen verwalten — keine Keys in dieser Übersicht.
        </p>
        <Link
          href="/dashboard/api"
          className="inline-flex rounded-lg border px-4 py-2.5 text-sm font-semibold no-underline transition-colors hover:border-[#B4FF00]/30"
          style={{
            borderColor: "rgba(8,8,8,0.12)",
            background: "#FFFCF7",
            color: DASHBOARD_TEXT,
          }}
        >
          API-Dashboard öffnen →
        </Link>
      </DashboardPanel>
    ),

    admin: (
      <DashboardPanel title="Admin">
        <p className="mb-4 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Plattform, Nutzer und interne Werkzeuge verwalten.
        </p>
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center rounded-lg border px-4 py-2.5 text-sm font-semibold no-underline transition-colors hover:border-black/16"
          style={{
            borderColor: "rgba(8,8,8,0.12)",
            background: "#FFFCF7",
            color: DASHBOARD_TEXT,
          }}
        >
          Admin Panel öffnen →
        </Link>
      </DashboardPanel>
    ),
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl">
      <DashboardPageHeader
        title="Einstellungen"
        subtitle="Account, Workspace, Brand Defaults und Sicherheit verwalten."
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <nav
          className="flex shrink-0 gap-1 overflow-x-auto pb-1 lg:w-[220px] lg:flex-col lg:overflow-visible lg:pb-0"
          style={{ scrollbarWidth: "none" }}
          aria-label="Einstellungsbereiche"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className="shrink-0 rounded-lg py-2.5 text-left text-[13px] transition-colors lg:w-full"
              style={{
                paddingLeft: "12px",
                borderLeft:
                  activeSection === section.id
                    ? `2px solid ${DASHBOARD_ACCENT}`
                    : "2px solid transparent",
                color:
                  activeSection === section.id ? DASHBOARD_TEXT : DASHBOARD_MUTED,
                fontWeight: activeSection === section.id ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">{sectionContent[activeSection]}</div>
      </div>

      {resetConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-memory-title"
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border p-5 shadow-xl"
            style={{
              background: "#FFFCF7",
              borderColor: "rgba(8,8,8,0.10)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="reset-memory-title"
              className="text-sm leading-relaxed"
              style={{ color: DASHBOARD_TEXT }}
            >
              Brand Defaults zurücksetzen? Der Agent vergisst Nische und Tonalität.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <SecondaryButton onClick={() => setResetConfirmOpen(false)}>
                Abbrechen
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  setResetConfirmOpen(false);
                  void resetCreatorMemory();
                }}
              >
                Zurücksetzen
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        hasActiveSubscription={hasActiveSubscription}
        isAgencyOwner={isAgencyOwner}
      />
    </div>
  );
}

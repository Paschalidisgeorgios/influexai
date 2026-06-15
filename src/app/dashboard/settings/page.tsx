"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import "@/styles/settings-glass.css";
import "@/styles/studio-glass.css";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dailyIdeasEmail, setDailyIdeasEmail] = useState(true);
  const [savingDailyEmail, setSavingDailyEmail] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [msgPw, setMsgPw] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
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
  const tDelete = useTranslations("settings.deleteAccount");
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, daily_suggestions_email, stripe_subscription_id")
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
    load();
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
        : { type: "ok", text: "Studio-Gedächtnis gespeichert! ✓" }
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
        : { type: "ok", text: "Gedächtnis zurückgesetzt." }
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
        : { type: "ok", text: "Name gespeichert! ✓" }
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
        : { type: "ok", text: "Passwort geändert! ✓" }
    );
    if (!error) {
      setNewPw("");
      setConfirmPw("");
    }
    setSavingPw(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "rgba(24, 24, 27, 0.6)",
    border: "1px solid rgba(39, 39, 42, 0.6)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none",
    fontFamily: "var(--font-dm), sans-serif",
    transition: "border-color 0.2s",
  };

  const label = (text: string) => (
    <label
      style={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.65)",
        display: "block",
        marginBottom: 6,
        letterSpacing: "0.04em",
      }}
    >
      {text}
    </label>
  );

  const card = (children: React.ReactNode) => (
    <div className="studio-glass-card flex flex-col gap-3.5 p-6">{children}</div>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            fontSize: "clamp(2rem,4vw,3rem)",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 6,
          }}
        >
          ⚙️ Einstellungen
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
          Profil und Sicherheit verwalten
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Profil */}
        {card(
          <>
            <h2
              style={{
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                fontSize: "1.2rem",
                letterSpacing: "0.02em",
                color: "#F0EFE8",
              }}
            >
              Profil
            </h2>
            <Link
              href="/dashboard/profile/public"
              style={{
                display: "block",
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(180,255,0,0.08)",
                border: "1px solid rgba(180,255,0,0.2)",
                color: "#B4FF00",
                fontSize: "0.88rem",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              Öffentliches Creator-Profil einrichten →
            </Link>
            <div>
              {label("Name")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
                style={inputStyle}
                onFocus={(e) =>
                  ((e.target as HTMLInputElement).style.borderColor =
                    "rgba(180,255,0,0.4)")
                }
                onBlur={(e) =>
                  ((e.target as HTMLInputElement).style.borderColor =
                    "rgba(255,255,255,0.09)")
                }
              />
            </div>
            <div>
              {label("E-Mail (nicht änderbar)")}
              <input
                value={email}
                disabled
                style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
              />
            </div>
            {msg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 9,
                  fontSize: "0.85rem",
                  background:
                    msg.type === "ok"
                      ? "rgba(180,255,0,0.08)"
                      : "rgba(255,71,87,0.08)",
                  border: `1px solid ${msg.type === "ok" ? "rgba(180,255,0,0.25)" : "rgba(255,71,87,0.25)"}`,
                  color: msg.type === "ok" ? "#B4FF00" : "#ff6b7a",
                }}
              >
                {msg.text}
              </div>
            )}
            <button
              onClick={saveName}
              disabled={saving}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: saving ? "#2a2a2a" : "#B4FF00",
                color: saving ? "rgba(255,255,255,0.65)" : "#060608",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: saving ? "default" : "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {saving ? "Wird gespeichert..." : "Name speichern"}
            </button>
          </>
        )}

        {card(
          <>
            <h2
              style={{
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                fontSize: "1.2rem",
                letterSpacing: "0.02em",
                color: "#F0EFE8",
              }}
            >
              {t("growth_agent_title")}
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              {t("daily_suggestions_email_desc")}
            </p>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                cursor: savingDailyEmail ? "wait" : "pointer",
              }}
            >
              <span style={{ color: "#F0EFE8", fontSize: "0.92rem", fontWeight: 600 }}>
                {t("daily_suggestions_email_label")}
              </span>
              <input
                type="checkbox"
                checked={dailyIdeasEmail}
                disabled={savingDailyEmail}
                onChange={(e) => void saveDailyIdeasEmail(e.target.checked)}
                style={{
                  width: 44,
                  height: 24,
                  accentColor: "#B4FF00",
                  cursor: savingDailyEmail ? "wait" : "pointer",
                }}
              />
            </label>
          </>
        )}

        {card(
          <>
            <h2
              style={{
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                fontSize: "1.2rem",
                letterSpacing: "0.02em",
                color: "#F0EFE8",
              }}
            >
              Was dein Studio über dich weiß
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.5,
              }}
            >
              Der KI Agent merkt sich hier deine Nische, Produkte und
              Plattformen — du kannst alles jederzeit anpassen.
            </p>
            <div>
              {label("Nische")}
              <input
                value={creatorNische}
                onChange={(e) => setCreatorNische(e.target.value)}
                placeholder="z. B. Fitness, Immobilien"
                style={inputStyle}
              />
            </div>
            <div>
              {label("Zielgruppe")}
              <input
                value={creatorZielgruppe}
                onChange={(e) => setCreatorZielgruppe(e.target.value)}
                placeholder="z. B. Berufstätige 25–40"
                style={inputStyle}
              />
            </div>
            <div>
              {label("Tonalität")}
              <input
                value={creatorTonalitaet}
                onChange={(e) => setCreatorTonalitaet(e.target.value)}
                placeholder="z. B. locker, direkt, vertrauensvoll"
                style={inputStyle}
              />
            </div>
            <div>
              {label("Plattformen (kommagetrennt)")}
              <input
                value={creatorPlattformen}
                onChange={(e) => setCreatorPlattformen(e.target.value)}
                placeholder="TikTok, Instagram, YouTube"
                style={inputStyle}
              />
            </div>
            <div>
              {label("Produkte (kommagetrennt)")}
              <input
                value={creatorProdukte}
                onChange={(e) => setCreatorProdukte(e.target.value)}
                placeholder="Kurse, Coaching, physische Produkte"
                style={inputStyle}
              />
            </div>
            {msgCreatorMemory && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 9,
                  fontSize: "0.85rem",
                  background:
                    msgCreatorMemory.type === "ok"
                      ? "rgba(180,255,0,0.08)"
                      : "rgba(255,71,87,0.08)",
                  border: `1px solid ${msgCreatorMemory.type === "ok" ? "rgba(180,255,0,0.25)" : "rgba(255,71,87,0.25)"}`,
                  color:
                    msgCreatorMemory.type === "ok" ? "#B4FF00" : "#ff6b7a",
                }}
              >
                {msgCreatorMemory.text}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void saveCreatorMemory()}
                disabled={savingCreatorMemory}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: savingCreatorMemory ? "#2a2a2a" : "#B4FF00",
                  color: savingCreatorMemory ? "rgba(255,255,255,0.65)" : "#060608",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: savingCreatorMemory ? "default" : "pointer",
                }}
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                disabled={savingCreatorMemory}
                className="settings-memory-reset-btn"
              >
                Gedächtnis zurücksetzen
              </button>
            </div>
          </>
        )}

        {/* Passwort */}
        <div className="settings-glass-card flex flex-col gap-3.5 rounded-2xl p-6">
          <h2
            style={{
              fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
              margin: 0,
            }}
          >
            Passwort ändern
          </h2>
          <div>
            {label("Neues Passwort")}
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              className="settings-glass-input"
            />
          </div>
          <div>
            {label("Passwort bestätigen")}
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Passwort wiederholen"
              className="settings-glass-input"
            />
          </div>
          {msgPw && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 9,
                fontSize: "0.85rem",
                background:
                  msgPw.type === "ok"
                    ? "rgba(180,255,0,0.08)"
                    : "rgba(255,71,87,0.08)",
                border: `1px solid ${msgPw.type === "ok" ? "rgba(180,255,0,0.25)" : "rgba(255,71,87,0.25)"}`,
                color: msgPw.type === "ok" ? "#B4FF00" : "#ff6b7a",
              }}
            >
              {msgPw.text}
            </div>
          )}
          <button
            type="button"
            onClick={() => void savePw()}
            disabled={savingPw}
            className="settings-glass-btn-outline w-full"
          >
            {savingPw ? "Wird gespeichert..." : "Passwort ändern"}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="settings-danger-card settings-glass-card flex flex-col gap-3.5 rounded-2xl border border-red-900/30 bg-red-950/5 p-6 backdrop-blur-md">
          <h2 className="m-0 font-mono text-sm font-bold tracking-[0.2em] text-red-400 [text-shadow:0_0_14px_rgba(248,113,113,0.35)]">
            GEFAHRENZONE
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {tDelete("danger_desc")}
          </p>
          <button
            type="button"
            className="settings-danger-delete-btn"
            onClick={() => setDeleteModalOpen(true)}
          >
            {tDelete("danger_button")}
          </button>
        </div>

        {resetConfirmOpen ? (
          <div
            className="settings-confirm-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-memory-title"
            onClick={() => setResetConfirmOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-xl border border-zinc-800/60 bg-zinc-950/80 p-5 shadow-[0_12px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p
                id="reset-memory-title"
                className="m-0 text-sm leading-relaxed text-zinc-300"
              >
                Bist du sicher? Die KI vergisst deine Nische und Tonalität
                vollständig.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(false)}
                  className="settings-glass-btn-outline !px-3 !py-2 text-xs"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetConfirmOpen(false);
                    void resetCreatorMemory();
                  }}
                  className="settings-memory-reset-btn !px-3 !py-2 text-xs"
                >
                  Zurücksetzen
                </button>
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
    </div>
  );
}

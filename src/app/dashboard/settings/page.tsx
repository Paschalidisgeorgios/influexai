"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";

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
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isAgencyOwner, setIsAgencyOwner] = useState(false);
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
    };
    load();
  }, [supabase]);

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
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
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
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        background: "#0f0f12",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column" as const,
        gap: 14,
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
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
                fontFamily: "var(--font-bebas), sans-serif",
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
                fontFamily: "var(--font-bebas), sans-serif",
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

        {/* Passwort */}
        {card(
          <>
            <h2
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "1.2rem",
                letterSpacing: "0.02em",
                color: "#F0EFE8",
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
              {label("Passwort bestätigen")}
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Passwort wiederholen"
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
              onClick={savePw}
              disabled={savingPw}
              style={{
                padding: "12px",
                borderRadius: 10,
                background: savingPw ? "#2a2a2a" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: savingPw ? "rgba(255,255,255,0.65)" : "#F0EFE8",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: savingPw ? "default" : "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {savingPw ? "Wird gespeichert..." : "Passwort ändern"}
            </button>
          </>
        )}

        {/* Danger Zone */}
        {card(
          <>
            <h2
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "1.2rem",
                letterSpacing: "0.02em",
                color: "#ff6b7a",
              }}
            >
              Gefahrenzone
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.65,
              }}
            >
              {tDelete("danger_desc")}
            </p>
            <button
              type="button"
              style={{
                padding: "11px",
                borderRadius: 10,
                cursor: "pointer",
                background: "rgba(255,71,87,0.08)",
                border: "1px solid rgba(255,71,87,0.25)",
                color: "#ff6b7a",
                fontWeight: 700,
                fontSize: "0.875rem",
                fontFamily: "var(--font-dm), sans-serif",
              }}
              onClick={() => setDeleteModalOpen(true)}
            >
              {tDelete("danger_button")}
            </button>
          </>
        )}

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

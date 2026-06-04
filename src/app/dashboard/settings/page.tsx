"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [msgPw, setMsgPw] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles").select("full_name, email").eq("id", user.id).single();
      if (data) { setName(data.full_name ?? ""); setEmail(data.email ?? ""); }
    };
    load();
  }, []);

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true); setMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles").update({ full_name: name }).eq("id", user.id);
    setMsg(error ? { type: "err", text: "Fehler beim Speichern." } : { type: "ok", text: "Name gespeichert! ✓" });
    setSaving(false);
  };

  const savePw = async () => {
    if (!newPw || newPw !== confirmPw) {
      setMsgPw({ type: "err", text: "Passwörter stimmen nicht überein." }); return;
    }
    if (newPw.length < 6) {
      setMsgPw({ type: "err", text: "Mindestens 6 Zeichen." }); return;
    }
    setSavingPw(true); setMsgPw(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setMsgPw(error ? { type: "err", text: "Fehler: " + error.message } : { type: "ok", text: "Passwort geändert! ✓" });
    if (!error) { setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    setSavingPw(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "#18181d", border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8", fontSize: "0.95rem", outline: "none",
    fontFamily: "var(--font-dm), sans-serif", transition: "border-color 0.2s",
  };

  const label = (text: string) => (
    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#505055", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
      {text}
    </label>
  );

  const card = (children: React.ReactNode) => (
    <div style={{ padding: 24, borderRadius: 16, background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" as const, gap: 14 }}>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "0.02em",
          color: "#F0EFE8", marginBottom: 6,
        }}>⚙️ Einstellungen</h1>
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>Profil und Sicherheit verwalten</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Profil */}
        {card(<>
          <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.2rem", letterSpacing: "0.02em", color: "#F0EFE8" }}>
            Profil
          </h2>
          <div>
            {label("Name")}
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(180,255,0,0.4)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)"} />
          </div>
          <div>
            {label("E-Mail (nicht änderbar)")}
            <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
          </div>
          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 9, fontSize: "0.85rem",
              background: msg.type === "ok" ? "rgba(180,255,0,0.08)" : "rgba(255,71,87,0.08)",
              border: `1px solid ${msg.type === "ok" ? "rgba(180,255,0,0.25)" : "rgba(255,71,87,0.25)"}`,
              color: msg.type === "ok" ? "#B4FF00" : "#ff6b7a",
            }}>{msg.text}</div>
          )}
          <button onClick={saveName} disabled={saving} style={{
            padding: "12px", borderRadius: 10, border: "none",
            background: saving ? "#2a2a2a" : "#B4FF00",
            color: saving ? "#505055" : "#060608",
            fontWeight: 700, fontSize: "0.9rem", cursor: saving ? "default" : "pointer",
            fontFamily: "var(--font-dm), sans-serif",
          }}>
            {saving ? "Wird gespeichert..." : "Name speichern"}
          </button>
        </>)}

        {/* Passwort */}
        {card(<>
          <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.2rem", letterSpacing: "0.02em", color: "#F0EFE8" }}>
            Passwort ändern
          </h2>
          <div>
            {label("Neues Passwort")}
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Mindestens 6 Zeichen" style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(180,255,0,0.4)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)"} />
          </div>
          <div>
            {label("Passwort bestätigen")}
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="Passwort wiederholen" style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(180,255,0,0.4)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)"} />
          </div>
          {msgPw && (
            <div style={{
              padding: "10px 14px", borderRadius: 9, fontSize: "0.85rem",
              background: msgPw.type === "ok" ? "rgba(180,255,0,0.08)" : "rgba(255,71,87,0.08)",
              border: `1px solid ${msgPw.type === "ok" ? "rgba(180,255,0,0.25)" : "rgba(255,71,87,0.25)"}`,
              color: msgPw.type === "ok" ? "#B4FF00" : "#ff6b7a",
            }}>{msgPw.text}</div>
          )}
          <button onClick={savePw} disabled={savingPw} style={{
            padding: "12px", borderRadius: 10,
            background: savingPw ? "#2a2a2a" : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: savingPw ? "#505055" : "#F0EFE8",
            fontWeight: 700, fontSize: "0.9rem", cursor: savingPw ? "default" : "pointer",
            fontFamily: "var(--font-dm), sans-serif",
          }}>
            {savingPw ? "Wird gespeichert..." : "Passwort ändern"}
          </button>
        </>)}

        {/* Danger Zone */}
        {card(<>
          <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.2rem", letterSpacing: "0.02em", color: "#ff6b7a" }}>
            Gefahrenzone
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#505055", lineHeight: 1.65 }}>
            Konto löschen entfernt alle deine Daten und Credits permanent.
          </p>
          <button style={{
            padding: "11px", borderRadius: 10, cursor: "pointer",
            background: "rgba(255,71,87,0.08)",
            border: "1px solid rgba(255,71,87,0.25)",
            color: "#ff6b7a", fontWeight: 700, fontSize: "0.875rem",
            fontFamily: "var(--font-dm), sans-serif",
          }}
          onClick={() => alert("Bitte kontaktiere uns: support@influexai.com")}>
            Konto löschen
          </button>
        </>)}
      </div>
    </div>
  );
}

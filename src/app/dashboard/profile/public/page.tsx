"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getPublicProfileSettings,
  savePublicProfile,
  listMyGenerationsForShowcase,
  setGenerationPinned,
  checkUsernameAvailable,
  type GenerationRow,
} from "@/app/actions/public-profile";
import { setGenerationPublic } from "@/app/actions/community-creations";
import {
  SITE_URL,
  generationTypeBadge,
  badgeColor,
  isValidUsername,
  normalizeUsername,
} from "@/lib/creator-profile";

const MAX_BIO = 160;

export default function PublicProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isPublic, setIsPublic] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [generations, setGenerations] = useState<GenerationRow[]>([]);
  const [usernameHint, setUsernameHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [settings, gens] = await Promise.all([
      getPublicProfileSettings(),
      listMyGenerationsForShowcase(),
    ]);
    if ("error" in settings) {
      setError(settings.error);
    } else {
      setIsPublic(settings.isPublic);
      setUsername(settings.username ?? "");
      setBio(settings.bio ?? "");
      setYoutubeUrl(settings.youtubeUrl ?? "");
      setTiktokUrl(settings.tiktokUrl ?? "");
      setInstagramUrl(settings.instagramUrl ?? "");
    }
    setGenerations(gens);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pinnedCount = generations.filter((g) => g.is_pinned).length;
  const profileUrl =
    username.trim() && isValidUsername(normalizeUsername(username))
      ? `${SITE_URL}/profile/${normalizeUsername(username)}`
      : null;

  const handleUsernameBlur = async () => {
    const n = normalizeUsername(username);
    if (!n) {
      setUsernameHint(null);
      return;
    }
    if (!isValidUsername(n)) {
      setUsernameHint("3–30 Zeichen: a-z, 0-9, _");
      return;
    }
    const res = await checkUsernameAvailable(n);
    setUsernameHint(res.available ? "✓ Verfügbar" : "Bereits vergeben");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await savePublicProfile({
      isPublic,
      username,
      bio,
      youtubeUrl,
      tiktokUrl,
      instagramUrl,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    await load();
  };

  const togglePublic = async (id: string, currentlyPublic: boolean) => {
    setError(null);
    const res = await setGenerationPublic(id, !currentlyPublic);
    if (!res.success) {
      setError(res.error ?? "Fehler");
      return;
    }
    await load();
  };

  const togglePin = async (id: string, currentlyPinned: boolean) => {
    setError(null);
    const res = await setGenerationPinned(id, !currentlyPinned);
    if (!res.success) {
      setError(res.error);
      return;
    }
    await load();
  };

  const copyLink = async () => {
    if (!profileUrl) return;
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none" as const,
    fontFamily: "var(--font-dm), sans-serif",
  };

  const labelStyle = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.65)",
    display: "block" as const,
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "none" as const,
  };

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          color: "rgba(255,255,255,0.65)",
          padding: 40,
        }}
      >
        Laden…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Link
        href="/dashboard/settings"
        style={{
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.65)",
          textDecoration: "none",
          fontFamily: "var(--font-dm), sans-serif",
        }}
      >
        ← Einstellungen
      </Link>

      <h1
        style={{
          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
          fontSize: "clamp(2rem, 4vw, 2.5rem)",
          margin: "12px 0 6px",
          color: "#F0EFE8",
        }}
      >
        Öffentliches Profil
      </h1>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", marginBottom: 28 }}>
        Teile dein Creator-Profil unter influexaicreator.com/creator/dein-name
      </p>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            background: "rgba(255,71,87,0.08)",
            border: "1px solid rgba(255,71,87,0.25)",
            color: "#ff6b7a",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            background: "rgba(180,255,0,0.08)",
            border: "1px solid rgba(180,255,0,0.25)",
            color: "#B4FF00",
            fontSize: "0.875rem",
          }}
        >
          Profil gespeichert.
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: 24,
          borderRadius: 16,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
          marginBottom: 20,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#F0EFE8",
          }}
        >
          Öffentliches Profil aktivieren
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ accentColor: "#B4FF00", width: 20, height: 20 }}
          />
        </label>

        <div>
          <label style={labelStyle}>Username</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem" }}>@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/\s/g, ""));
                setUsernameHint(null);
              }}
              onBlur={handleUsernameBlur}
              placeholder="dein_handle"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          {usernameHint && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "0.78rem",
                color: usernameHint.startsWith("✓") ? "#B4FF00" : "#ff6b7a",
              }}
            >
              {usernameHint}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.65)",
              textAlign: "right",
            }}
          >
            {bio.length}/{MAX_BIO}
          </p>
        </div>

        <div>
          <label style={labelStyle}>YouTube URL</label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/@..."
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>TikTok URL</label>
          <input
            type="url"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://tiktok.com/@..."
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Instagram URL</label>
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/..."
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            onClick={copyLink}
            disabled={!profileUrl || !isPublic}
            style={{
              padding: "10px 16px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: profileUrl && isPublic ? "#F0EFE8" : "rgba(255,255,255,0.65)",
              fontSize: "0.85rem",
              cursor: profileUrl && isPublic ? "pointer" : "default",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            {copied ? "✓ Kopiert!" : "Profil-Link kopieren"}
          </button>
          {profileUrl && isPublic && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 16px",
                borderRadius: 9,
                border: "1px solid rgba(180,255,0,0.3)",
                background: "rgba(180,255,0,0.08)",
                color: "#B4FF00",
                fontSize: "0.85rem",
                textDecoration: "none",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              Profil vorschauen →
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 11,
            border: "none",
            background: "#B4FF00",
            color: "#060608",
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            fontSize: "1.15rem",
            letterSpacing: "0.04em",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "SPEICHERN…" : "SPEICHERN"}
        </button>
      </div>

      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            fontSize: "1.2rem",
            margin: "0 0 8px",
            color: "#F0EFE8",
          }}
        >
          Showcase Content
        </h2>
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>
          Pinne bis zu 3 Einträge ({pinnedCount}/3)
        </p>

        {generations.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>
            Noch keine Generierungen. Erstelle Content, um dein Profil zu
            füllen.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {generations.map((g) => {
              const badge = generationTypeBadge(g.type);
              const color = badgeColor(badge);
              return (
                <li
                  key={g.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    background: g.is_pinned
                      ? "rgba(180,255,0,0.06)"
                      : "#18181d",
                    border: g.is_pinned
                      ? "1px solid rgba(180,255,0,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: `${color}22`,
                        color,
                      }}
                    >
                      {badge}
                    </span>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "0.85rem",
                        color: "#F0EFE8",
                        lineHeight: 1.5,
                      }}
                    >
                      {g.prompt.length > 100
                        ? `${g.prompt.slice(0, 99)}…`
                        : g.prompt}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => togglePublic(g.id, g.is_public)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: g.is_public
                          ? "rgba(180,255,0,0.2)"
                          : "rgba(255,255,255,0.08)",
                        color: g.is_public ? "#B4FF00" : "rgba(255,255,255,0.65)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "var(--font-dm), sans-serif",
                      }}
                    >
                      {g.is_public ? "Öffentlich" : "Teilen"}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePin(g.id, g.is_pinned)}
                      disabled={!g.is_pinned && pinnedCount >= 3}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: g.is_pinned
                          ? "#B4FF00"
                          : "rgba(255,255,255,0.08)",
                        color: g.is_pinned ? "#060608" : "rgba(255,255,255,0.65)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor:
                          !g.is_pinned && pinnedCount >= 3
                            ? "default"
                            : "pointer",
                        fontFamily: "var(--font-dm), sans-serif",
                      }}
                    >
                      {g.is_pinned ? "Gepinnt" : "Pinnen"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

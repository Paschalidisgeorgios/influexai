"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  adminCreateChallenge,
  adminDeleteCommunityPost,
  getAdminCommunityData,
} from "@/app/actions/community";
import {
  adminGetCreationReports,
  adminHidePublicCreation,
} from "@/app/actions/community-creations";
import { PostCard } from "@/components/community/post-card";

export function AdminCommunityTab() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getAdminCommunityData>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [creationReports, setCreationReports] = useState<
    Awaited<ReturnType<typeof adminGetCreationReports>> | null
  >(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getAdminCommunityData(), adminGetCreationReports()]).then(
      ([res, reports]) => {
        setData(res);
        setCreationReports(reports);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Post wirklich löschen?")) return;
    await adminDeleteCommunityPost(postId);
    load();
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await adminCreateChallenge({
      title,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
    setCreating(false);
    if (res.success) {
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      load();
    } else {
      alert(res.error ?? "Fehler");
    }
  };

  if (loading) {
    return (
      <p style={{ color: "rgba(255,255,255,0.65)", padding: 40, textAlign: "center" }}>
        Lade…
      </p>
    );
  }

  if (!data || "error" in data) {
    return (
      <p style={{ color: "#ff6b7a", padding: 40, textAlign: "center" }}>
        {data && "error" in data ? data.error : "Fehler"}
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          { label: "Posts gesamt", value: data.stats.totalPosts },
          {
            label: "Aktive Creator (7 Tage)",
            value: data.stats.activeUsersWeek,
          },
          { label: "Top Post", value: data.stats.topPostPreview, small: true },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: 18,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: s.small ? "0.95rem" : "2rem",
                color: "#B4FF00",
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(180,255,0,0.15)",
          marginBottom: 28,
        }}
      >
        <h3 style={{ color: "#F0EFE8", marginBottom: 16, fontSize: "1rem" }}>
          Challenge erstellen
        </h3>
        <form onSubmit={handleCreateChallenge}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            required
            style={inputStyle}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung"
            rows={2}
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {creating ? "…" : "Challenge anlegen"}
          </button>
        </form>
      </div>

      {creationReports &&
        !("error" in creationReports) &&
        creationReports.reports.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: "#ff6b7a", marginBottom: 12 }}>
              Creation Reports ({creationReports.reports.length})
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {creationReports.reports.map((r) => (
                <li
                  key={r.id}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 10,
                    background: "#18181d",
                    border: "1px solid rgba(255,107,122,0.2)",
                  }}
                >
                  <p style={{ color: "#F0EFE8", fontSize: "0.82rem", margin: 0 }}>
                    {r.creation?.prompt?.slice(0, 80) ?? r.generation_id}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.72rem" }}>
                    {r.reason}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await adminHidePublicCreation(r.generation_id);
                      load();
                    }}
                    style={{
                      marginTop: 8,
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "#ff6b7a",
                      color: "#fff",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                    }}
                  >
                    Aus Community entfernen
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

      {data.reports.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ color: "#ff6b7a", marginBottom: 12 }}>
            Post Reports ({data.reports.length})
          </h3>
          {data.reports.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 14,
                marginBottom: 10,
                borderRadius: 10,
                background: "rgba(255,107,122,0.06)",
                border: "1px solid rgba(255,107,122,0.2)",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "0.82rem",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {r.reason} · {new Date(r.created_at).toLocaleString("de-DE")}
              </p>
              {r.post && (
                <div
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <div style={{ flex: 1 }}>
                    <PostCard post={r.post} isLoggedIn={false} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.post_id)}
                    style={deleteBtnStyle}
                  >
                    Löschen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h3 style={{ color: "#F0EFE8", marginBottom: 16 }}>Alle Posts</h3>
      {data.posts.map((post) => (
        <div key={post.id} style={{ position: "relative", marginBottom: 8 }}>
          <PostCard post={post} isLoggedIn={false} />
          <button
            type="button"
            onClick={() => handleDelete(post.id)}
            style={{
              ...deleteBtnStyle,
              position: "absolute",
              top: 16,
              right: 16,
            }}
          >
            Löschen
          </button>
        </div>
      ))}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#18181d",
  color: "#F0EFE8",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  marginBottom: 10,
};

const deleteBtnStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "none",
  background: "#ff6b7a",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.72rem",
  cursor: "pointer",
  fontFamily: "inherit",
  flexShrink: 0,
};

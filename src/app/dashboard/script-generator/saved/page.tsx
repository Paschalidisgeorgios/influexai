"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { FeatureEmptyState } from "@/components/feature-empty-state";
import {
  listSavedScripts,
  deleteSavedScript,
  type SavedScriptRow,
} from "@/app/actions/generate-script";
import { countWords } from "@/lib/script-format";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SavedScriptsPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [scripts, setScripts] = useState<SavedScriptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const rows = await listSavedScripts();
    setScripts(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteSavedScript(id);
    setDeletingId(null);
    await load();
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/script-generator"
          style={{
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.65)",
            textDecoration: "none",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          ← Script Generator
        </Link>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
          }}
        >
          <FileText size={28} color="#B4FF00" strokeWidth={2} />
          <h1
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
              margin: 0,
            }}
          >
            Gespeicherte Scripts
          </h1>
        </div>
      </div>

      {loading && (
        <div className="animate-pulse space-y-3 max-w-md mx-auto">
          <div className="h-8 rounded-xl bg-white/5 w-2/3" />
          <div className="h-24 rounded-xl bg-white/5" />
          <div className="h-24 rounded-xl bg-white/5" />
        </div>
      )}

      {!loading && scripts.length === 0 && (
        <FeatureEmptyState
          icon={FileText}
          title={t("empty_script_title")}
          description={t("empty_script_desc")}
          ctaLabel={t("empty_script_cta")}
          ctaHref="/dashboard/script-generator"
        />
      )}

      {!loading && scripts.length > 0 && (
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
          {scripts.map((row) => (
            <li
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                padding: "16px 18px",
                borderRadius: 14,
                background: "#0f0f12",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#F0EFE8",
                    fontSize: "0.95rem",
                    marginBottom: 4,
                  }}
                >
                  {row.topic}
                </div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
                  {formatDate(row.created_at)} · {countWords(row.script)} Wörter
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/script-generator?saved=${row.id}`)
                  }
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#B4FF00",
                    color: "#060608",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  Öffnen
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  disabled={deletingId === row.id}
                  aria-label="Löschen"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,71,87,0.3)",
                    background: "rgba(255,71,87,0.08)",
                    color: "#ff6b7a",
                    cursor: deletingId === row.id ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

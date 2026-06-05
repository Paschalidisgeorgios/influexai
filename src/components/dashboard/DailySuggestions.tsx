"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  isDailySuggestionsPayload,
  startOfUtcDayIso,
  type DailyVideoIdea,
} from "@/lib/daily-suggestions";
import { scriptGeneratorTopicUrl } from "@/lib/safe-url-param";

function formatTodayDate(locale: string): string {
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DailySuggestions() {
  const t = useTranslations("dashboard.growth_agent");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<DailyVideoIdea[]>([]);
  const [niche, setNiche] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("daily_suggestions")
        .select("id, niche, suggestions, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfUtcDayIso())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && isDailySuggestionsPayload(data.suggestions)) {
        setIdeas(data.suggestions.ideas);
        setNiche(data.niche);
      } else {
        setIdeas([]);
        setNiche(null);
      }
      setLoading(false);
    };

    void load();
  }, [supabase]);

  if (loading) {
    return (
      <div
        style={{
          marginBottom: 28,
          padding: 24,
          borderRadius: 16,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.65)", margin: 0, fontSize: "0.9rem" }}>
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={22} color="#B4FF00" strokeWidth={2.2} />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#F0EFE8",
                fontFamily: "var(--font-syne), sans-serif",
              }}
            >
              {t("title")}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>
              {formatTodayDate(locale)}
              {niche ? ` · ${niche}` : ""}
            </p>
          </div>
        </div>
        <span
          style={{
            padding: "6px 12px",
            borderRadius: 99,
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.05em",
            background: "rgba(180,255,0,0.12)",
            border: "1px solid rgba(180,255,0,0.35)",
            color: "#B4FF00",
          }}
        >
          {t("badge")}
        </span>
      </div>

      {ideas.length === 0 ? (
        <div
          style={{
            padding: 28,
            borderRadius: 16,
            background: "#0f0f12",
            border: "1px dashed rgba(255,255,255,0.1)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, color: "rgba(240,239,232,0.65)", lineHeight: 1.6 }}>
            {t("empty")}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {ideas.map((idea, index) => (
            <article
              key={`${idea.title}-${index}`}
              style={{
                padding: 20,
                borderRadius: 14,
                background: "#0f0f12",
                border: "1px solid rgba(180,255,0,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#B4FF00",
                  letterSpacing: "0.06em",
                }}
              >
                {t("idea_label", { n: index + 1 })}
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#F0EFE8",
                  lineHeight: 1.35,
                }}
              >
                {idea.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "#B4FF00" }}>{t("hook_label")}:</strong>{" "}
                {idea.hook}
              </p>
              {idea.why_viral && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.65)",
                    fontStyle: "italic",
                    lineHeight: 1.45,
                  }}
                >
                  {idea.why_viral}
                </p>
              )}
              <Link
                href={scriptGeneratorTopicUrl(idea.title)}
                style={{
                  marginTop: "auto",
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#B4FF00",
                  color: "#060608",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {t("generate_script")}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

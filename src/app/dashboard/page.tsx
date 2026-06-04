"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FileText,
  Flame,
  Image,
  Repeat2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FlowItem = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  color: string;
  credits: string;
  icon?: string;
  LucideIcon?: LucideIcon;
  badge?: "NEU" | "Bald verfügbar";
  locked?: boolean;
};

const FLOWS: FlowItem[] = [
  {
    id: "live",
    icon: "🎭",
    title: "Live Creator",
    desc: "Streame live ohne dein Gesicht. Dein KI-Charakter übernimmt Mimik und Stimme in Echtzeit.",
    tags: ["Echtzeit", "Face Consistent", "Multi-Platform"],
    color: "#B4FF00",
    credits: "10 Credits / Min",
    badge: "Bald verfügbar",
    locked: true,
  },
  {
    id: "ki-ich",
    icon: "📸",
    title: "Mein KI-Ich",
    desc: "Lade ein Foto hoch und erscheine in jeder Szene der Welt. Konsistentes Gesicht in jedem Bild.",
    tags: ["4K", "Face Consistent", "Sofort"],
    color: "#06b6d4",
    credits: "2 Credits / Bild",
  },
  {
    id: "produkt",
    icon: "🛍️",
    title: "Produkt-Werbung",
    desc: "URL oder Produktfoto eingeben — fertiger Werbespot in TikTok, Reel und YouTube-Format.",
    tags: ["URL-to-Video", "A/B Varianten", "Multi-Format"],
    color: "#10b981",
    credits: "5 Credits / Ad",
  },
  {
    id: "voice",
    icon: "🎵",
    title: "Stimme & Musik",
    desc: "KI-Stimme aus Script oder lizenzfreie Musik-Moods für deine Videos.",
    tags: ["TTS", "6 Stimmen", "Lizenzfrei"],
    color: "#f59e0b",
    credits: "3 Credits / Generierung",
  },
  {
    id: "niche-analyzer",
    LucideIcon: TrendingUp,
    title: "Niche Analyzer",
    desc: "Finde profitable YouTube Niche-Ideen mit KI-Analyse",
    tags: ["YouTube", "Nischen", "Growth"],
    color: "#B4FF00",
    credits: "2 Credits / Analyse",
    badge: "NEU",
  },
  {
    id: "outlier-detector",
    LucideIcon: Flame,
    title: "Outlier Detector",
    desc: "Finde viral gegangene Videos in deiner Niche und verstehe warum",
    tags: ["Viral", "Outlier", "YouTube"],
    color: "#B4FF00",
    credits: "3 Credits",
    badge: "NEU",
  },
  {
    id: "video-remix",
    LucideIcon: Repeat2,
    title: "Video Remix",
    desc: "Nimm virale Videos und remix sie mit deinem eigenen Twist",
    tags: ["Remix", "Viral", "YouTube"],
    color: "#B4FF00",
    credits: "2 Credits",
    badge: "NEU",
  },
  {
    id: "script-generator",
    LucideIcon: FileText,
    title: "Script Generator",
    desc: "Vollständige Short-Scripts mit Hook, Story & CTA in Sekunden",
    tags: ["Script", "Hook", "Shorts"],
    color: "#B4FF00",
    credits: "2 Credits",
    badge: "NEU",
  },
  {
    id: "thumbnail-concept",
    LucideIcon: Image,
    title: "Thumbnail Konzept",
    desc: "Viral-optimierte Thumbnail-Ideen mit Text, Farben & Layout",
    tags: ["Thumbnail", "CTR", "YouTube"],
    color: "#B4FF00",
    credits: "1 Credit",
    badge: "NEU",
  },
  {
    id: "video-studio",
    icon: "🎬",
    title: "Video Studio",
    desc: "Sora & Kling — lange Videos aus einem Prompt. Bald in InfluexAI.",
    tags: ["Sora", "Kling", "Coming Soon"],
    color: "#505055",
    credits: "—",
    badge: "Bald verfügbar",
    locked: true,
  },
  {
    id: "brand-kit",
    icon: "✨",
    title: "Brand Kit",
    desc: "Einheitlicher Look für alle Kanäle. Logos, Farben, KI-Avatar-Stil.",
    tags: ["Branding", "Konsistenz"],
    color: "#505055",
    credits: "—",
    badge: "Bald verfügbar",
    locked: true,
  },
  {
    id: "automations",
    icon: "⚡",
    title: "Automations",
    desc: "Content-Pipelines auf Autopilot. Posten, Schedulen, A/B-Tests.",
    tags: ["Workflow", "API"],
    color: "#505055",
    credits: "—",
    badge: "Bald verfügbar",
    locked: true,
  },
];

const TYPE_ICONS: Record<string, string> = {
  "ki-ich": "📸",
  produkt: "🛍️",
  "voice-tts": "🔊",
  "stimme-clone": "🎵",
  "stimme-speak": "🔊",
  "niche-analyzer": "📈",
  "outlier-detector": "🔥",
  "video-remix": "🔁",
  "script-generator": "📝",
  "thumbnail-concept": "🖼️",
  live: "🎭",
};

function firstName(fullName: string | null): string | null {
  if (!fullName?.trim()) return null;
  return fullName.trim().split(/\s+/)[0];
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Minute${mins === 1 ? "" : "n"}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Stunde${hrs === 1 ? "" : "n"}`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

const FLOW_I18N: Record<
  string,
  "script" | "niche" | "outlier" | "thumbnail" | "remix" | "video_ad"
> = {
  "script-generator": "script",
  "niche-analyzer": "niche",
  "outlier-detector": "outlier",
  "thumbnail-concept": "thumbnail",
  "video-remix": "remix",
  produkt: "video_ad",
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tFlows = useTranslations("flows");
  const tCredits = useTranslations("credits");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const supabase = createClient();
  const [credits, setCredits] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [generations, setGenerations] = useState<
    { id: string; type: string; prompt: string; created_at: string }[]
  >([]);
  const [hoveredLocked, setHoveredLocked] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, credits")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCredits(profile.credits);
        setDisplayName(firstName(profile.full_name));
      }

      const { data: gens } = await supabase
        .from("generations")
        .select("id, type, prompt, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setGenerations(gens ?? []);
    };

    load();
    const refresh = () => load();
    window.addEventListener("credits-updated", refresh);
    return () => window.removeEventListener("credits-updated", refresh);
  }, [supabase]);

  const firstActiveFlowId = FLOWS.find((f) => !f.locked)?.id;

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "0.02em",
            lineHeight: 1,
            color: "#F0EFE8",
            marginBottom: 8,
          }}
        >
          Hey {displayName ?? "Creator"} 👋
        </h1>
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>{t("pick_flow")}</p>
      </div>

      {/* Zero credits banner */}
      {credits === 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            padding: "16px 20px",
            marginBottom: 20,
            borderRadius: 12,
            background: "rgba(180,255,0,0.08)",
            borderLeft: "4px solid #B4FF00",
            border: "1px solid rgba(180,255,0,0.15)",
            borderLeftWidth: 4,
            borderLeftColor: "#B4FF00",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#F0EFE8",
            }}
          >
            {tCredits("empty")}
          </p>
          <Link
            href="/dashboard/credits"
            style={{
              padding: "10px 20px",
              borderRadius: 9,
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            {tCredits("buy")}
          </Link>
        </div>
      )}

      {/* Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
        {FLOWS.map((flow) => {
          const isLocked = flow.locked;
          const flowKey = FLOW_I18N[flow.id];
          const flowTitle = flowKey ? tFlows(`${flowKey}.title`) : flow.title;
          const flowDesc = flowKey
            ? tFlows(`${flowKey}.description`)
            : flow.desc;
          return (
            <div
              key={flow.id}
              title={isLocked ? "Kommt bald" : undefined}
              style={{
                padding: 24,
                borderRadius: 18,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.07)",
                cursor: isLocked ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
                opacity: isLocked ? 0.5 : 1,
                boxShadow: "none",
              }}
              onMouseEnter={(e) => {
                if (isLocked) {
                  setHoveredLocked(flow.id);
                  return;
                }
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "0 0 0 1px rgba(180,255,0,0.3)";
                el.style.transform = "translateY(-2px)";
                el.style.background = "#1e1e24";
              }}
              onMouseLeave={(e) => {
                setHoveredLocked(null);
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
                el.style.background = "#18181d";
              }}
              onClick={() => {
                if (!isLocked) router.push(`/dashboard/${flow.id}`);
              }}
            >
              {isLocked && hoveredLocked === flow.id && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(6,6,8,0.75)",
                    zIndex: 2,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#F0EFE8",
                  }}
                >
                  Kommt bald
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: flow.color,
                  opacity: isLocked ? 0.25 : 0.5,
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                {flow.LucideIcon ? (
                  <flow.LucideIcon
                    size={28}
                    color={flow.color}
                    strokeWidth={2}
                  />
                ) : (
                  <span style={{ fontSize: "1.75rem" }}>{flow.icon}</span>
                )}
                {flow.badge === "NEU" && (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 5,
                      background: "rgba(180,255,0,0.12)",
                      border: "1px solid rgba(180,255,0,0.35)",
                      color: "#B4FF00",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {tCommon("new_badge")}
                  </span>
                )}
                {flow.badge === "Bald verfügbar" && (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 5,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    {tCommon("coming_soon")}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "1.45rem",
                  letterSpacing: "0.02em",
                  marginBottom: 8,
                  color: "#F0EFE8",
                }}
              >
                {flowTitle}
              </div>

              <p
                style={{
                  fontSize: "0.82rem",
                  color: "rgba(240,239,232,0.55)",
                  lineHeight: 1.65,
                  marginBottom: 12,
                }}
              >
                {flowDesc}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginBottom: 14,
                }}
              >
                {flow.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.32)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: flow.color,
                    fontWeight: 600,
                  }}
                >
                  {flow.credits}
                </span>
                {!isLocked && (
                  <span
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: flow.color,
                      color: "#060608",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      fontFamily: "var(--font-dm), sans-serif",
                    }}
                  >
                    Starten →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div
        style={{
          marginTop: 28,
          padding: 20,
          borderRadius: 16,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.25rem",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 14,
          }}
        >
          Letzte Aktivität
        </h2>

        {generations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p
              style={{
                color: "#505055",
                fontSize: "0.875rem",
                margin: "0 0 8px",
              }}
            >
              Noch keine Creations. Los geht&apos;s!
            </p>
            {firstActiveFlowId && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/${firstActiveFlowId}`)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#B4FF00",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
                aria-label="Zum ersten Flow"
              >
                ↓
              </button>
            )}
          </div>
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
            {generations.map((g) => (
              <li
                key={g.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span
                  style={{ fontSize: "1.1rem", flexShrink: 0, lineHeight: 1.4 }}
                >
                  {TYPE_ICONS[g.type] ?? "✨"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: "#F0EFE8",
                      lineHeight: 1.45,
                    }}
                  >
                    {truncate(g.prompt || g.type, 60)}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#505055",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {relativeTime(g.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

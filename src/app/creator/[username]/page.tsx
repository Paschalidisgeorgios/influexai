import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicCreatorByUsername } from "@/app/actions/public-profile";
import {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  formatMemberSince,
  profileInitials,
  generationTypeBadge,
  badgeColor,
} from "@/lib/creator-profile";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const creator = await fetchPublicCreatorByUsername(username);
  if (!creator) {
    return { title: "Profil nicht gefunden | InfluexAI" };
  }

  const displayName = creator.fullName ?? creator.username;
  const description =
    creator.bio?.trim() ||
    `${displayName} erstellt viralen KI-Content mit InfluexAI.`;

  return {
    title: `${displayName} | InfluexAI Creator`,
    description,
    openGraph: {
      title: `${displayName} | InfluexAI Creator`,
      description,
      url: `${SITE_URL}/creator/${creator.username}`,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | InfluexAI Creator`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

function primarySocialUrl(creator: {
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
}) {
  return creator.youtubeUrl || creator.tiktokUrl || creator.instagramUrl;
}

export default async function PublicCreatorPage({ params }: Props) {
  const { username } = await params;
  const creator = await fetchPublicCreatorByUsername(username);
  if (!creator) notFound();

  const displayName = creator.fullName ?? creator.username;
  const initials = profileInitials(creator.fullName, creator.username);
  const followUrl = primarySocialUrl(creator);
  const pinned = creator.pinned;
  const showPlaceholders = pinned.length === 0;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 64px" }}>
      {/* Hero */}
      <section style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            width: 120,
            height: 120,
            margin: "0 auto 20px",
            borderRadius: "50%",
            padding: 3,
            background:
              "linear-gradient(135deg, #B4FF00, rgba(180,255,0,0.25))",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "#18181d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "2.5rem",
              color: "#B4FF00",
              letterSpacing: "0.04em",
            }}
          >
            {initials}
          </div>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 6vw, 2.75rem)",
            letterSpacing: "0.02em",
            margin: "0 0 4px",
            color: "#F0EFE8",
          }}
        >
          {displayName}
        </h1>
        <p
          style={{ margin: "0 0 16px", color: "#505055", fontSize: "0.95rem" }}
        >
          @{creator.username}
          {creator.isBeta && (
            <span
              style={{
                marginLeft: 10,
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(180,255,0,0.12)",
                border: "1px solid rgba(180,255,0,0.35)",
                color: "#B4FF00",
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              BETA CREATOR
            </span>
          )}
        </p>

        {creator.bio && (
          <p
            style={{
              margin: "0 auto 18px",
              maxWidth: 480,
              fontSize: "0.95rem",
              lineHeight: 1.65,
              color: "rgba(240,239,232,0.75)",
            }}
          >
            {creator.bio}
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {creator.creatorNiche && (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 99,
                fontSize: "0.75rem",
                fontWeight: 700,
                background: "rgba(180,255,0,0.12)",
                border: "1px solid rgba(180,255,0,0.35)",
                color: "#B4FF00",
              }}
            >
              {creator.creatorNiche}
            </span>
          )}
          {creator.subscriberCount && (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 99,
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#505055",
              }}
            >
              {creator.subscriberCount}
            </span>
          )}
        </div>

        {followUrl ? (
          <a
            href={followUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "11px 28px",
              borderRadius: 10,
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            Folge mir →
          </a>
        ) : (
          <span
            style={{
              fontSize: "0.82rem",
              color: "#505055",
            }}
          >
            Social Links folgen bald
          </span>
        )}
      </section>

      {/* Stats */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
          padding: "18px 20px",
          marginBottom: 40,
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
          fontSize: "0.85rem",
          color: "rgba(240,239,232,0.7)",
        }}
      >
        <span>
          <strong style={{ color: "#B4FF00" }}>
            {creator.generationCount}
          </strong>{" "}
          Videos erstellt mit InfluexAI
        </span>
        <span style={{ color: "#2a2a2e" }}>|</span>
        <span>Mitglied seit {formatMemberSince(creator.createdAt)}</span>
        <span style={{ color: "#2a2a2e" }}>|</span>
        <Link
          href="/"
          style={{
            color: "#505055",
            textDecoration: "none",
            fontSize: "0.78rem",
          }}
        >
          Powered by <span style={{ color: "#B4FF00" }}>InfluexAI</span>
        </Link>
      </section>

      {/* Showcase */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.35rem",
            letterSpacing: "0.04em",
            marginBottom: 16,
            color: "#F0EFE8",
          }}
        >
          Featured Content
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {showPlaceholders
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    background: "#0f0f12",
                    border: "1px dashed rgba(255,255,255,0.12)",
                    minHeight: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#505055",
                    fontSize: "0.85rem",
                  }}
                >
                  Wird bald gefüllt
                </div>
              ))
            : pinned.map((item) => {
                const badge = generationTypeBadge(item.type);
                const color = badgeColor(badge);
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 18,
                      borderRadius: 14,
                      background: "#0f0f12",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: `${color}22`,
                        color,
                        border: `1px solid ${color}44`,
                      }}
                    >
                      {badge}
                    </span>
                    <p
                      style={{
                        margin: "12px 0 0",
                        fontSize: "0.88rem",
                        lineHeight: 1.55,
                        color: "rgba(240,239,232,0.8)",
                      }}
                    >
                      {item.prompt.length > 140
                        ? `${item.prompt.slice(0, 139)}…`
                        : item.prompt}
                    </p>
                  </div>
                );
              })}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "32px 24px",
          borderRadius: 18,
          background: "rgba(180,255,0,0.06)",
          border: "1px solid rgba(180,255,0,0.2)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.75rem",
            margin: "0 0 16px",
            color: "#F0EFE8",
          }}
        >
          Erstelle deinen eigenen KI-Content
        </h2>
        <Link
          href="/signup"
          style={{
            display: "inline-block",
            padding: "13px 32px",
            borderRadius: 11,
            background: "#B4FF00",
            color: "#060608",
            fontWeight: 700,
            fontSize: "0.95rem",
            textDecoration: "none",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          Kostenlos starten →
        </Link>
      </section>
    </div>
  );
}

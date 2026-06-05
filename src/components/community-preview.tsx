import Link from "next/link";
import { getRecentWinPosts } from "@/app/actions/community";
import { formatRelativeTime, initials, POST_TYPE_META } from "@/lib/community";

export const revalidate = 3600;

export async function CommunityPreview() {
  const wins = await getRecentWinPosts(3);

  return (
    <section
      style={{
        padding: "64px 24px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 10,
          }}
        >
          Was unsere Creator erreichen
        </h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1rem", margin: 0 }}>
          Echte Ergebnisse, echte Creator
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {wins.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 32,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Die Community startet bald — sei unter den Ersten!
          </div>
        ) : (
          wins.map((post) => (
            <article
              key={post.id}
              style={{
                padding: 20,
                borderRadius: 14,
                background: "#0f0f12",
                border: "1px solid rgba(180,255,0,0.12)",
              }}
            >
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(180,255,0,0.12)",
                    border: "1px solid rgba(180,255,0,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#B4FF00",
                    fontSize: "0.85rem",
                  }}
                >
                  {initials(post.author.name)}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#F0EFE8",
                      fontSize: "0.9rem",
                    }}
                  >
                    {post.author.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)" }}>
                    {POST_TYPE_META.win.badge} ·{" "}
                    {formatRelativeTime(post.createdAt)}
                  </div>
                </div>
              </div>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "0.9rem",
                  color: "rgba(240,239,232,0.8)",
                  lineHeight: 1.5,
                }}
              >
                {post.content}
              </p>
              {post.metric && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(180,255,0,0.1)",
                    color: "#B4FF00",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                  }}
                >
                  {post.metric}
                </span>
              )}
            </article>
          ))
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <Link
          href="/community#showcase"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            borderRadius: 10,
            background: "#B4FF00",
            color: "#060608",
            fontWeight: 700,
            fontSize: "0.95rem",
            textDecoration: "none",
          }}
        >
          Community beitreten →
        </Link>
      </div>
    </section>
  );
}

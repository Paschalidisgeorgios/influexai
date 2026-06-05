"use client";

import { useState } from "react";
import { getHallOfFameWins } from "@/app/actions/community";
import type { CommunityPost } from "@/lib/community";
import { PostCard } from "./post-card";

type Props = {
  initialPosts: CommunityPost[];
  isLoggedIn: boolean;
  viewerId: string | null;
  onRefresh: () => void;
};

export function HallOfFame({
  initialPosts,
  isLoggedIn,
  viewerId,
  onRefresh,
}: Props) {
  const [period, setPeriod] = useState<"month" | "all">("month");
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);

  const load = async (p: "month" | "all") => {
    setLoading(true);
    const data = await getHallOfFameWins(p, viewerId);
    setPosts(data);
    setLoading(false);
  };

  const ranks: ("gold" | "silver" | "bronze" | null)[] = [
    "gold",
    "silver",
    "bronze",
    ...Array(Math.max(0, posts.length - 3)).fill(null),
  ];

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.75rem",
            color: "#F0EFE8",
            margin: 0,
          }}
        >
          🏆 Hall of Fame
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {(
            [
              { id: "month" as const, label: "This Month" },
              { id: "all" as const, label: "All Time" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setPeriod(t.id);
                load(t.id);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background:
                  period === t.id ? "#B4FF00" : "rgba(255,255,255,0.06)",
                color: period === t.id ? "#060608" : "rgba(255,255,255,0.65)",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.65)", textAlign: "center", padding: 40 }}>
          Lade…
        </p>
      ) : posts.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.65)", textAlign: "center", padding: 40 }}>
          Noch keine Wins — sei der Erste!
        </p>
      ) : (
        <div
          className="community-hall-grid"
          style={{
            columnCount: 3,
            columnGap: 14,
          }}
        >
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              isLoggedIn={isLoggedIn}
              large
              rankBorder={ranks[i] ?? null}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  getCommunityPosts,
  getCommunityInitial,
} from "@/app/actions/community";
import {
  FEED_TABS,
  type CommunityFeedFilter,
  type CommunityPost,
} from "@/lib/community";
import type { CommunityChallenge } from "@/lib/community";
import { ChallengeBanner } from "./challenge-banner";
import { CreatePostModal } from "./create-post-modal";
import { HallOfFame } from "./hall-of-fame";
import { PostCard } from "./post-card";

type View = "feed" | "hall";

type Initial = Awaited<ReturnType<typeof getCommunityInitial>>;

type Props = {
  isLoggedIn: boolean;
  userId: string | null;
  initial: Initial;
};

export function CommunityHub({ isLoggedIn, userId, initial }: Props) {
  const [view, setView] = useState<View>("feed");
  const [filter, setFilter] = useState<CommunityFeedFilter>("all");
  const [posts, setPosts] = useState<CommunityPost[]>(initial.posts);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [offset, setOffset] = useState(initial.posts.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [challenge, setChallenge] = useState<CommunityChallenge | null>(
    initial.challenge
  );
  const [hallPosts, setHallPosts] = useState(initial.hallOfFame);
  const [modalOpen, setModalOpen] = useState(false);
  const [challengePrefill, setChallengePrefill] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    const data = await getCommunityInitial(userId);
    setPosts(data.posts);
    setHasMore(data.hasMore);
    setOffset(data.posts.length);
    setChallenge(data.challenge);
    setHallPosts(data.hallOfFame);
  }, [userId]);

  const loadFilter = async (f: CommunityFeedFilter) => {
    setFilter(f);
    const { posts: next, hasMore: more } = await getCommunityPosts(
      f,
      0,
      userId
    );
    setPosts(next);
    setHasMore(more);
    setOffset(next.length);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    const { posts: next, hasMore: more } = await getCommunityPosts(
      filter,
      offset,
      userId
    );
    setPosts((p) => [...p, ...next]);
    setHasMore(more);
    setOffset((o) => o + next.length);
    setLoadingMore(false);
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#060608", color: "#F0EFE8" }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.25rem",
            color: "#F0EFE8",
            textDecoration: "none",
          }}
        >
          Influex<span style={{ color: "#B4FF00" }}>AI</span> Community
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(180,255,0,0.25)",
                color: "#B4FF00",
                fontSize: "0.8rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "#B4FF00",
                color: "#060608",
                fontSize: "0.8rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Anmelden
            </Link>
          )}
        </div>
      </header>

      <main
        style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 100px" }}
      >
        {challenge && (
          <ChallengeBanner
            challenge={challenge}
            isLoggedIn={isLoggedIn}
            onJoin={refresh}
            onPostChallenge={() => {
              setChallengePrefill({ id: challenge.id, title: challenge.title });
              setModalOpen(true);
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            padding: 4,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            width: "fit-content",
          }}
        >
          {(
            [
              { id: "feed" as const, label: "Feed" },
              { id: "hall" as const, label: "🏆 Hall of Fame" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: view === t.id ? 700 : 500,
                fontFamily: "inherit",
                background: view === t.id ? "#B4FF00" : "transparent",
                color: view === t.id ? "#060608" : "rgba(255,255,255,0.75)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {view === "hall" ? (
          <HallOfFame
            initialPosts={hallPosts}
            isLoggedIn={isLoggedIn}
            viewerId={userId}
            onRefresh={refresh}
          />
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              {FEED_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => loadFilter(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: filter === tab.id ? 700 : 500,
                    fontFamily: "inherit",
                    background:
                      filter === tab.id ? "#B4FF00" : "rgba(255,255,255,0.05)",
                    color: filter === tab.id ? "#060608" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!isLoggedIn && (
              <p
                style={{
                  marginBottom: 20,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                <Link
                  href="/login"
                  style={{ color: "#B4FF00", fontWeight: 700 }}
                >
                  Melde dich an
                </Link>{" "}
                um zu posten →
              </p>
            )}

            {posts.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.65)", textAlign: "center", padding: 48 }}>
                Noch keine Posts. Starte die Community!
              </p>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLoggedIn={isLoggedIn}
                  onRefresh={refresh}
                />
              ))
            )}

            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 8,
                  padding: 14,
                  borderRadius: 10,
                  border: "1px solid rgba(180,255,0,0.2)",
                  background: "rgba(180,255,0,0.06)",
                  color: "#B4FF00",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loadingMore ? "Lädt…" : "Mehr laden"}
              </button>
            )}
          </>
        )}
      </main>

      {isLoggedIn && (
        <button
          type="button"
          aria-label="Post erstellen"
          onClick={() => {
            setChallengePrefill(null);
            setModalOpen(true);
          }}
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            background: "#B4FF00",
            color: "#060608",
            fontSize: "1.75rem",
            fontWeight: 300,
            lineHeight: 1,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(180,255,0,0.35)",
            zIndex: 50,
          }}
        >
          +
        </button>
      )}

      {isLoggedIn && (
        <CreatePostModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setChallengePrefill(null);
          }}
          defaultNiche={initial.defaultNiche}
          challenge={challengePrefill}
          onPosted={refresh}
        />
      )}
    </div>
  );
}

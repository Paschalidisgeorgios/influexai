"use client";

import { daysUntil, type CommunityChallenge } from "@/lib/community";
import { joinChallenge } from "@/app/actions/community";

type Props = {
  challenge: CommunityChallenge;
  isLoggedIn: boolean;
  onJoin: () => void;
  onPostChallenge: () => void;
};

export function ChallengeBanner({
  challenge,
  isLoggedIn,
  onJoin,
  onPostChallenge,
}: Props) {
  const daysLeft = daysUntil(challenge.endDate);

  const handleJoin = async () => {
    if (!isLoggedIn) return;
    const res = await joinChallenge(challenge.id);
    if (res.success) onJoin();
  };

  return (
    <section
      style={{
        marginBottom: 28,
        padding: "22px 24px",
        borderRadius: 16,
        background:
          "linear-gradient(135deg, rgba(180,255,0,0.08) 0%, rgba(15,15,18,1) 60%)",
        border: "1px solid rgba(180,255,0,0.25)",
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#B4FF00",
          marginBottom: 8,
        }}
      >
        Challenge der Woche
      </div>
      <h2
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "1.75rem",
          color: "#F0EFE8",
          marginBottom: 8,
          lineHeight: 1.1,
        }}
      >
        {challenge.title}
      </h2>
      <p
        style={{
          margin: "0 0 12px",
          color: "rgba(240,239,232,0.6)",
          fontSize: "0.9rem",
        }}
      >
        {challenge.description || "Teile dein Ergebnis bis zum Deadline."}
      </p>
      <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "#505055" }}>
        Noch{" "}
        <strong style={{ color: "#B4FF00" }}>
          {daysLeft} Tag{daysLeft === 1 ? "" : "e"}
        </strong>{" "}
        ·{" "}
        <strong style={{ color: "#F0EFE8" }}>
          {challenge.participantCount} Creator
        </strong>{" "}
        machen mit
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={handleJoin}
              disabled={challenge.userJoined}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: challenge.userJoined
                  ? "rgba(255,255,255,0.08)"
                  : "#B4FF00",
                color: challenge.userJoined ? "#505055" : "#060608",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: challenge.userJoined ? "default" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {challenge.userJoined ? "✓ Du machst mit" : "Ich mache mit"}
            </button>
            <button
              type="button"
              onClick={onPostChallenge}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid rgba(180,255,0,0.35)",
                background: "transparent",
                color: "#B4FF00",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Challenge posten →
            </button>
          </>
        ) : (
          <a
            href="/login"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            Anmelden & mitmachen →
          </a>
        )}
      </div>
    </section>
  );
}

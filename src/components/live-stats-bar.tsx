import { fetchLiveStats } from "@/lib/live-stats";

export const revalidate = 3600;

export async function LiveStatsBar() {
  const stats = await fetchLiveStats();

  const format = (n: number) => n.toLocaleString("de-DE");

  return (
    <div
      style={{
        width: "100%",
        background: "rgba(180,255,0,0.05)",
        borderTop: "1px solid rgba(180,255,0,0.1)",
        borderBottom: "1px solid rgba(180,255,0,0.1)",
        padding: "12px 16px",
        textAlign: "center",
        fontSize: 14,
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
        color: "rgba(255,255,255,0.5)",
        lineHeight: 1.5,
      }}
    >
      <span aria-hidden style={{ marginRight: 6 }}>
        ⚡
      </span>
      <strong style={{ color: "#B4FF00", fontWeight: 700 }}>
        {format(stats.users)}
      </strong>{" "}
      Creators registriert
      <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
      <strong style={{ color: "#B4FF00", fontWeight: 700 }}>
        {format(stats.generations)}
      </strong>{" "}
      Contents erstellt
      <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
      <strong style={{ color: "#B4FF00", fontWeight: 700 }}>
        {format(stats.scripts)}
      </strong>{" "}
      Scripts generiert
    </div>
  );
}

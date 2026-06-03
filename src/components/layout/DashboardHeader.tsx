"use client";

export function DashboardHeader() {
  return (
    <header style={{
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(6,6,8,0.85)",
      backdropFilter: "blur(12px)",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 20,
    }}>
      {/* Left: Breadcrumb */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.875rem",
      }}>
        <span style={{ color: "#505055", fontWeight: 500 }}>Studio</span>
        <span style={{ color: "#2a2a2a" }}>›</span>
        <span style={{ color: "#F0EFE8", fontWeight: 600 }}>Dashboard</span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        {/* Credits badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 8,
          background: "rgba(180,255,0,0.07)",
          border: "1px solid rgba(180,255,0,0.18)",
          cursor: "pointer",
        }}>
          <span style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#B4FF00",
          }}>
            ⚡ 373 Credits
          </span>
        </div>

        {/* Notification bell */}
        <button style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "#505055",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.9rem",
          transition: "all 0.15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#F0EFE8";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.13)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#505055";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
        }}
        >
          🔔
        </button>

        {/* Avatar */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "rgba(180,255,0,0.12)",
          border: "1px solid rgba(180,255,0,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "1rem",
          cursor: "pointer",
          color: "#B4FF00",
          letterSpacing: "0.04em",
        }}>
          P
        </div>
      </div>
    </header>
  );
}

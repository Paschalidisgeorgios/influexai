"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#060608",
        color: "#F0EFE8",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Sentry Example Page</h1>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
        Click a button below — the error should appear in your Sentry project.
      </p>
      <button
        type="button"
        onClick={() => {
          throw new Error("Sentry Test");
        }}
        style={{
          padding: "12px 24px",
          borderRadius: 8,
          border: "none",
          background: "#ef4444",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Throw error
      </button>
      <button
        type="button"
        onClick={() => {
          Sentry.captureException(new Error("Sentry captureException test"));
          alert("Exception sent to Sentry (captureException).");
        }}
        style={{
          padding: "12px 24px",
          borderRadius: 8,
          border: "none",
          background: "#B4FF00",
          color: "#060608",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Capture exception
      </button>
    </main>
  );
}

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060608",
          color: "#F0EFE8",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "1.25rem" }}>
            Etwas ist schiefgelaufen
          </h2>
          <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.7)" }}>
            Der Fehler wurde gemeldet. Bitte versuche es erneut.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_CHECKOUT_PACKAGE,
  getPackageById,
} from "@/lib/credit-packages";
import {
  onUpgradePrompt,
  type UpgradePromptDetail,
} from "@/lib/client-credits-ui";

function checkoutUrl(packageId: string) {
  return `/dashboard/credits?package=${packageId}`;
}

export function UpgradePromptListener() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpgradePromptDetail | null>(null);

  useEffect(() => {
    return onUpgradePrompt((d) => {
      setDetail(d);
      setOpen(true);
    });
  }, []);

  if (!open || !detail) return null;

  const pkg = getPackageById(DEFAULT_CHECKOUT_PACKAGE);
  const price = pkg?.priceEur ?? 9.99;

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(6,6,8,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 400,
          width: "100%",
          padding: 24,
          borderRadius: 16,
          background: "#0f0f12",
          border: "1px solid rgba(180,255,0,0.25)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#F0EFE8",
          }}
        >
          Du brauchst {detail.cost} Credits für diese Aktion
        </p>
        <p
          style={{ margin: "0 0 20px", fontSize: "0.88rem", color: "#505055" }}
        >
          Du hast nur noch{" "}
          <strong style={{ color: "#ff6b7a" }}>
            {detail.remaining} Credits
          </strong>
          .
        </p>
        <p
          style={{
            margin: "0 0 16px",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(180,255,0,0.06)",
            border: "1px solid rgba(180,255,0,0.15)",
            fontSize: "0.78rem",
            color: "rgba(240,239,232,0.7)",
          }}
        >
          Empfohlen: <strong style={{ color: "#B4FF00" }}>Creator</strong> —{" "}
          {pkg?.credits ?? 120} Credits für €{price}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={checkoutUrl(DEFAULT_CHECKOUT_PACKAGE)}
            onClick={() => setOpen(false)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 16px",
              borderRadius: 10,
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
            }}
          >
            Credits kaufen
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#505055",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

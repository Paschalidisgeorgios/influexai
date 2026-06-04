"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { acceptTenantInvite, getInviteByToken } from "@/app/actions/agency";
import { createClient } from "@/lib/supabase/client";

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const [invite, setInvite] = useState<{
    email: string;
    tenants: { name: string; primary_color: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Kein Einladungstoken.");
      setLoading(false);
      return;
    }
    getInviteByToken(token).then((data) => {
      if (!data) setError("Einladung ungültig oder bereits angenommen.");
      else setInvite(data as typeof invite);
      setLoading(false);
    });
  }, [token]);

  const handleAccept = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/join?token=${token}`);
      return;
    }

    const res = await acceptTenantInvite(token);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error ?? "Fehler");
    }
  };

  if (loading) {
    return (
      <p style={{ color: "#505055", textAlign: "center", padding: 80 }}>
        Laden…
      </p>
    );
  }

  const agencyName = invite?.tenants?.name ?? "Agentur";
  const accent = invite?.tenants?.primary_color ?? "#B4FF00";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--background)",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 32,
          borderRadius: 16,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2rem",
            color: "#F0EFE8",
            marginBottom: 8,
          }}
        >
          {agencyName} lädt dich ein
        </h1>
        <p style={{ color: "#505055", marginBottom: 24, lineHeight: 1.6 }}>
          Du wurdest als Team-Mitglied eingeladen
          {invite?.email ? ` (${invite.email})` : ""}. Melde dich an, um dem
          Workspace beizutreten.
        </p>

        {error && (
          <p style={{ color: "#ff6b7a", marginBottom: 16, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAccept}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "none",
            background: accent,
            color: "#060608",
            fontWeight: 800,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          Einladung annehmen
        </button>

        <p style={{ textAlign: "center", fontSize: "0.85rem" }}>
          <Link
            href={`/signup?redirect=/join?token=${token}`}
            style={{ color: accent }}
          >
            Konto erstellen
          </Link>
          {" · "}
          <Link
            href={`/login?redirect=/join?token=${token}`}
            style={{ color: accent }}
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<p style={{ padding: 80, textAlign: "center" }}>…</p>}>
      <JoinContent />
    </Suspense>
  );
}

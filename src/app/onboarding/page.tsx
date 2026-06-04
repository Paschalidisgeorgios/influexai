"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeOnboarding,
  getOnboardingUser,
  saveCreatorProfile,
  skipOnboarding,
} from "@/app/actions/onboarding";
import { CreditPackagePicker } from "@/components/credit-package-picker";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import type { CreditPackageId } from "@/lib/credit-packages";
import { useLocale } from "next-intl";

type Step = 1 | 2 | 3 | 4;

const NICHES = [
  "Tech",
  "Fitness",
  "Finance",
  "Kochen",
  "Travel",
  "Gaming",
  "Beauty",
  "Business",
  "Sonstiges",
];

const SUBSCRIBER_OPTIONS = [
  "Ich starte gerade",
  "< 1K",
  "1K-10K",
  "10K-100K",
  "100K+",
];

const GOAL_OPTIONS = [
  "Mehr Views",
  "Geld verdienen",
  "Marke aufbauen",
  "Spaß haben",
];

const FEATURES = [
  {
    id: "produkt",
    title: "Produkt-Werbung",
    desc: "Erstelle einen viralen Werbe-Short",
    href: "/dashboard/produkt",
    icon: "🛍️",
  },
  {
    id: "niche-analyzer",
    title: "Niche Analyzer",
    desc: "Finde deine profitable Nische",
    href: "/dashboard/niche-analyzer",
    icon: "📈",
  },
  {
    id: "ki-ich",
    title: "KI-Ich",
    desc: "Erstelle deinen digitalen Klon",
    href: "/dashboard/ki-ich",
    icon: "📸",
  },
] as const;

export default function OnboardingPage() {
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("Creator");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const [channelName, setChannelName] = useState("");
  const [creatorNiche, setCreatorNiche] = useState(NICHES[0]);
  const [subscriberCount, setSubscriberCount] = useState(SUBSCRIBER_OPTIONS[0]);
  const [creatorGoal, setCreatorGoal] = useState(GOAL_OPTIONS[0]);
  const [selectedFeature, setSelectedFeature] = useState<string>(
    FEATURES[0].id
  );
  useEffect(() => {
    getOnboardingUser().then((data) => {
      if (!data) {
        router.replace("/login");
        return;
      }
      setFirstName(data.firstName);
      if (data.profile?.channel_name) setChannelName(data.profile.channel_name);
      if (data.profile?.creator_niche)
        setCreatorNiche(data.profile.creator_niche);
      if (data.profile?.subscriber_count)
        setSubscriberCount(data.profile.subscriber_count);
      if (data.profile?.creator_goal) setCreatorGoal(data.profile.creator_goal);
      if (data.profile?.onboarding_completed) {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    });
  }, [router]);

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none" as const,
    fontFamily: "var(--font-dm), sans-serif",
  };

  const labelStyle = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#505055",
    display: "block" as const,
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  const primaryBtn = (disabled?: boolean) => ({
    width: "100%" as const,
    padding: "14px",
    borderRadius: 11,
    border: "none",
    background: disabled ? "#2a2a2a" : "#B4FF00",
    color: disabled ? "#505055" : "#060608",
    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
    fontSize: "1.2rem",
    letterSpacing: "0.04em",
    cursor: disabled ? "default" : "pointer",
  });

  const handleSkip = async () => {
    setSaving(true);
    const result = await skipOnboarding();
    setSaving(false);
    if (result.success) router.push("/dashboard");
  };

  const handleStep2Next = async () => {
    setSaving(true);
    const result = await saveCreatorProfile({
      channelName,
      creatorNiche,
      subscriberCount,
      creatorGoal,
    });
    setSaving(false);
    if (result.success) setStep(3);
  };

  const handleFinishLater = async () => {
    setSaving(true);
    const result = await completeOnboarding();
    setSaving(false);
    if (result.success) router.push("/dashboard");
  };

  const handleCheckout = async (packageId: CreditPackageId) => {
    setCheckoutLoading(packageId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        await completeOnboarding();
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Checkout fehlgeschlagen.");
      }
    } catch {
      alert("Fehler beim Checkout. Bitte erneut versuchen.");
    }
    setCheckoutLoading(null);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#505055",
        }}
      >
        Laden…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "24px clamp(20px, 5vw, 48px) 32px",
        maxWidth: 560,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginBottom: 32,
          paddingTop: 8,
        }}
      >
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <span
            key={s}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: s <= step ? "#B4FF00" : "#2a2a2e",
              boxShadow: s === step ? "0 0 0 3px rgba(180,255,0,0.25)" : "none",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* Back */}
      {step > 1 && step < 4 && (
        <button
          type="button"
          onClick={() => setStep((s) => (s - 1) as Step)}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "none",
            color: "#505055",
            fontSize: "0.85rem",
            cursor: "pointer",
            marginBottom: 16,
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          ← Zurück
        </button>
      )}
      {step === 4 && (
        <button
          type="button"
          onClick={() => setStep(3)}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "none",
            color: "#505055",
            fontSize: "0.85rem",
            cursor: "pointer",
            marginBottom: 16,
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          ← Zurück
        </button>
      )}

      <div style={{ flex: 1 }}>
        {step === 1 && (
          <>
            <div style={{ marginBottom: 32 }}>
              <DashboardGreeting firstName={firstName} locale={locale} />
              <p
                style={{
                  color: "#505055",
                  fontSize: "0.95rem",
                  marginTop: 12,
                  lineHeight: 1.6,
                }}
              >
                Das KI Studio für Creator, die viral gehen wollen.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 40,
              }}
            >
              {[
                { icon: "⚡", text: "Virale Shorts in Sekunden" },
                { icon: "🎭", text: "Dein KI-Klon für Content" },
                { icon: "📈", text: "Niche & Outlier Analyse" },
              ].map((row) => (
                <div
                  key={row.text}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{row.icon}</span>
                  <span style={{ fontSize: "0.95rem", color: "#F0EFE8" }}>
                    {row.text}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              style={primaryBtn()}
              onClick={() => setStep(2)}
            >
              LOS GEHT&apos;S →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
                letterSpacing: "0.02em",
                marginBottom: 24,
              }}
            >
              Erzähl uns von dir
            </h1>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                marginBottom: 28,
              }}
            >
              <div>
                <label style={labelStyle}>Dein Creator-Name / Kanal</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Deine Hauptnische</label>
                <select
                  value={creatorNiche}
                  onChange={(e) => setCreatorNiche(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Wie viele Subscriber hast du?</label>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {SUBSCRIBER_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        fontSize: "0.88rem",
                        color: subscriberCount === opt ? "#B4FF00" : "#505055",
                      }}
                    >
                      <input
                        type="radio"
                        name="subscribers"
                        checked={subscriberCount === opt}
                        onChange={() => setSubscriberCount(opt)}
                        style={{ accentColor: "#B4FF00" }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Was ist dein Hauptziel?</label>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {GOAL_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        fontSize: "0.88rem",
                        color: creatorGoal === opt ? "#B4FF00" : "#505055",
                      }}
                    >
                      <input
                        type="radio"
                        name="goal"
                        checked={creatorGoal === opt}
                        onChange={() => setCreatorGoal(opt)}
                        style={{ accentColor: "#B4FF00" }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              style={primaryBtn(saving)}
              disabled={saving}
              onClick={handleStep2Next}
            >
              {saving ? "SPEICHERN…" : "WEITER →"}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
                letterSpacing: "0.02em",
                marginBottom: 8,
              }}
            >
              Erstell deinen ersten Content
            </h1>
            <p
              style={{ color: "#505055", fontSize: "0.9rem", marginBottom: 24 }}
            >
              Wähle eine Funktion zum Start
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 28,
              }}
            >
              {FEATURES.map((f) => {
                const selected = selectedFeature === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFeature(f.id)}
                    style={{
                      textAlign: "left",
                      padding: 18,
                      borderRadius: 14,
                      background: "#0f0f12",
                      border: selected
                        ? "2px solid #B4FF00"
                        : "1px solid rgba(255,255,255,0.07)",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: "1.5rem" }}>{f.icon}</span>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: selected ? "#B4FF00" : "#F0EFE8",
                            marginBottom: 4,
                          }}
                        >
                          {f.title}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#505055" }}>
                          {f.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              style={primaryBtn()}
              onClick={() => setStep(4)}
            >
              DIESE FUNKTION AUSPROBIEREN →
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h1
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(2rem, 6vw, 2.75rem)",
                letterSpacing: "0.02em",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Ein letzter Schritt 🚀
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "rgba(240,239,232,0.75)",
                fontSize: "1rem",
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              Kaufe deine ersten Credits um loszulegen.
            </p>
            <CreditPackagePicker
              onCheckout={handleCheckout}
              loadingId={checkoutLoading}
              compact
            />
            <button
              type="button"
              disabled={saving || checkoutLoading !== null}
              onClick={handleFinishLater}
              style={{
                display: "block",
                width: "100%",
                marginTop: 24,
                background: "transparent",
                border: "none",
                color: "#505055",
                fontSize: "0.85rem",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              Später kaufen →
            </button>
          </>
        )}
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={handleSkip}
        disabled={saving}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "transparent",
          border: "none",
          color: "#505055",
          fontSize: "0.8rem",
          cursor: saving ? "default" : "pointer",
          textDecoration: "underline",
          fontFamily: "var(--font-dm), sans-serif",
        }}
      >
        Überspringen
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  finishOnboardingFlow,
  skipOnboarding,
  type OnboardingFeatureId,
} from "@/app/actions/onboarding";

type Step = 1 | 2 | 3;

const NICHE_KEYS = [
  "fitness",
  "finance",
  "gaming",
  "beauty",
  "travel",
  "food",
  "tech",
  "lifestyle",
] as const;

const FEATURES: {
  id: OnboardingFeatureId;
  icon: string;
  titleKey: string;
  descKey: string;
}[] = [
  {
    id: "script-generator",
    icon: "📝",
    titleKey: "feature_script_title",
    descKey: "feature_script_desc",
  },
  {
    id: "avatar",
    icon: "🤖",
    titleKey: "feature_avatar_title",
    descKey: "feature_avatar_desc",
  },
  {
    id: "niche-analyzer",
    icon: "📈",
    titleKey: "feature_niche_title",
    descKey: "feature_niche_desc",
  },
];

const stepSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

type Props = {
  open: boolean;
  onClose: () => void;
  userName?: string;
};

export function OnboardingModal({ open, onClose, userName = "Creator" }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [niche, setNiche] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setNiche("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const selectNicheChip = (key: (typeof NICHE_KEYS)[number]) => {
    setNiche(t(`niches.${key}`));
    setError(null);
  };

  const handleSkip = async () => {
    setBusy(true);
    setError(null);
    const res = await skipOnboarding();
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    onClose();
  };

  const handleFeatureSelect = async (featureId: OnboardingFeatureId) => {
    if (!niche.trim()) {
      setError(t("niche_required"));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await finishOnboardingFlow({
      creatorNiche: niche.trim(),
      featureId,
    });
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    onClose();
    router.push(res.redirectTo);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#060608]/96 px-4 py-8 backdrop-blur-md"
      role="presentation"
    >
      <div className="relative flex w-full max-w-xl flex-col">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-2.5" aria-label={t("progress_label")}>
            {([1, 2, 3] as const).map((s) => (
              <span
                key={s}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  step >= s
                    ? "bg-[#B4FF00] shadow-[0_0_12px_rgba(180,255,0,0.5)]"
                    : "bg-white/15"
                }`}
                aria-hidden
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleSkip()}
            disabled={busy}
            className="text-sm font-medium text-white/70 transition-colors hover:text-[#B4FF00] disabled:opacity-80"
          >
            {t("skip")}
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={stepSpring}
              className="text-center"
            >
              <div
                className="onboarding-logo-pulse mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#B4FF00]/35 bg-[#B4FF00]/10"
                aria-hidden
              >
                <span className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-[#B4FF00]">
                  IA
                </span>
              </div>
              <h2
                id="onboarding-title"
                className="mb-3 font-[family-name:var(--font-bebas)] text-[clamp(2.25rem,6vw,3.25rem)] leading-tight text-[#F0EFE8]"
              >
                {t("welcome_title_named", { name: userName })}
              </h2>
              <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-white/80">
                {t("welcome_subtitle")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                className="w-full max-w-sm rounded-xl bg-[#B4FF00] py-4 text-base font-bold text-[#060608] transition-opacity hover:opacity-90"
              >
                {t("welcome_cta")}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={stepSpring}
            >
              <h2 className="mb-2 font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8]">
                {t("niche_title")}
              </h2>
              <p className="mb-5 text-sm text-white/75">{t("niche_hint")}</p>
              <input
                type="text"
                value={niche}
                onChange={(e) => {
                  setNiche(e.target.value);
                  setError(null);
                }}
                placeholder={t("niche_placeholder")}
                className="mb-4 w-full rounded-xl border border-white/10 bg-[#0f0f12] px-4 py-3.5 text-sm text-[#F0EFE8] outline-none placeholder:text-white/65 focus:border-[#B4FF00]/50"
              />
              <div className="mb-8 flex flex-wrap gap-2">
                {NICHE_KEYS.map((key) => {
                  const label = t(`niches.${key}`);
                  const active = niche === label;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectNicheChip(key)}
                      className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
                        active
                          ? "border-[#B4FF00] bg-[#B4FF00]/15 text-[#B4FF00]"
                          : "border-white/10 text-white/80 hover:border-white/25 hover:text-white/70"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!niche.trim()) {
                    setError(t("niche_required"));
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
                className="w-full rounded-xl bg-[#B4FF00] py-4 text-base font-bold text-[#060608]"
              >
                {t("niche_cta")}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={stepSpring}
            >
              <h2 className="mb-1 font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8]">
                {t("feature_title")}
              </h2>
              <p className="mb-6 text-sm text-white/75">{t("feature_subtitle")}</p>
              <div className="flex flex-col gap-3">
                {FEATURES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void handleFeatureSelect(f.id)}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0f0f12] p-5 text-left transition-all hover:border-[#B4FF00]/45 hover:bg-[#B4FF00]/[0.06] disabled:opacity-80"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#B4FF00]/25 bg-[#B4FF00]/10 text-3xl transition-transform group-hover:scale-105">
                      {f.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-[#F0EFE8] group-hover:text-[#B4FF00]">
                        {t(f.titleKey)}
                      </p>
                      <p className="mt-1 text-sm text-white/75">{t(f.descKey)}</p>
                    </div>
                    <span
                      className="shrink-0 text-[#B4FF00] opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    >
                      →
                    </span>
                  </button>
                ))}
              </div>
              {busy && (
                <p className="mt-4 text-center text-sm text-[#B4FF00]">{t("loading")}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes onboarding-logo-pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(180, 255, 0, 0);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 28px rgba(180, 255, 0, 0.25);
          }
        }
        .onboarding-logo-pulse {
          animation: onboarding-logo-pulse 2.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

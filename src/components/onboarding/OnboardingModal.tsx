"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  "travel",
  "gaming",
  "beauty",
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
    id: "thumbnail-concept",
    icon: "🖼️",
    titleKey: "feature_thumbnail_title",
    descKey: "feature_thumbnail_desc",
  },
  {
    id: "live-creator",
    icon: "🎭",
    titleKey: "feature_avatar_title",
    descKey: "feature_avatar_desc",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function OnboardingModal({ open, onClose }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [niche, setNiche] = useState("");
  const [selectedFeature, setSelectedFeature] =
    useState<OnboardingFeatureId>("script-generator");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setNiche("");
      setSelectedFeature("script-generator");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const selectNicheChip = (key: (typeof NICHE_KEYS)[number]) => {
    setNiche(t(`niches.${key}`));
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

  const handleStart = async () => {
    if (!niche.trim()) {
      setError(t("niche_required"));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await finishOnboardingFlow({
      creatorNiche: niche.trim(),
      featureId: selectedFeature,
    });
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    onClose();
    router.push(res.redirectTo);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="absolute inset-0 bg-[#060608]/92 backdrop-blur-sm"
        aria-hidden
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-[#B4FF00]/25 bg-[#060608] shadow-2xl shadow-black/80 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((s) => (
              <span
                key={s}
                className={`h-2 w-2 rounded-full transition-colors ${
                  step >= s ? "bg-[#B4FF00]" : "bg-white/20"
                }`}
                aria-hidden
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleSkip()}
            disabled={busy}
            className="text-xs font-medium text-white/40 hover:text-[#B4FF00] transition-colors disabled:opacity-50"
          >
            {t("skip")}
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          {error && (
            <p className="mb-4 text-sm text-red-400 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="text-center">
              <p className="text-[#B4FF00] text-xs font-bold uppercase tracking-[0.14em] mb-3">
                InfluexAI
              </p>
              <h2
                id="onboarding-title"
                className="font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8] mb-3 leading-tight"
              >
                {t("welcome_title")}
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                {t("welcome_subtitle")}
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-[#B4FF00] py-3.5 text-sm font-bold text-[#060608] hover:opacity-90 transition-opacity"
              >
                {t("welcome_cta")}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-[#F0EFE8] mb-2">
                {t("niche_title")}
              </h2>
              <p className="text-white/45 text-sm mb-4">{t("niche_hint")}</p>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder={t("niche_placeholder")}
                className="w-full rounded-xl border border-white/10 bg-[#0f0f12] px-4 py-3 text-sm text-[#F0EFE8] placeholder:text-white/30 outline-none focus:border-[#B4FF00]/50 mb-3"
              />
              <div className="flex flex-wrap gap-2 mb-6">
                {NICHE_KEYS.map((key) => {
                  const label = t(`niches.${key}`);
                  const active = niche === label;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectNicheChip(key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                        active
                          ? "border-[#B4FF00] bg-[#B4FF00]/15 text-[#B4FF00]"
                          : "border-white/10 text-white/50 hover:border-white/25"
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
                className="w-full rounded-xl bg-[#B4FF00] py-3.5 text-sm font-bold text-[#060608]"
              >
                {t("niche_cta")}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-[#F0EFE8] mb-1">
                {t("feature_title")}
              </h2>
              <p className="text-white/45 text-sm mb-4">{t("feature_subtitle")}</p>
              <div className="flex flex-col gap-2 mb-6">
                {FEATURES.map((f) => {
                  const selected = selectedFeature === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFeature(f.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? "border-[#B4FF00] bg-[#B4FF00]/08 ring-1 ring-[#B4FF00]/30"
                          : "border-white/10 bg-[#0f0f12] hover:border-white/20"
                      }`}
                    >
                      <span className="text-2xl">{f.icon}</span>
                      <div>
                        <p
                          className={`font-semibold text-sm ${
                            selected ? "text-[#B4FF00]" : "text-[#F0EFE8]"
                          }`}
                        >
                          {t(f.titleKey)}
                        </p>
                        <p className="text-white/45 text-xs mt-0.5">
                          {t(f.descKey)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={busy}
                className="w-full rounded-xl bg-[#B4FF00] py-3.5 text-sm font-bold text-[#060608] disabled:opacity-50"
              >
                {busy ? "…" : t("start_cta")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

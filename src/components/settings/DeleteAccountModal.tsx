"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MotionModal } from "@/components/ui/MotionModal";
import { createClient } from "@/lib/supabase/client";

const CONFIRM_WORD = "LÖSCHEN";

type Props = {
  open: boolean;
  onClose: () => void;
  hasActiveSubscription: boolean;
  isAgencyOwner: boolean;
};

export function DeleteAccountModal({
  open,
  onClose,
  hasActiveSubscription,
  isAgencyOwner,
}: Props) {
  const t = useTranslations("settings.deleteAccount");
  const router = useRouter();
  const supabase = createClient();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setError(null);
      setLoading(false);
      setDone(false);
    }
  }, [open]);

  const canSubmit =
    !loading &&
    !done &&
    !isAgencyOwner &&
    confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setError(
          data.error ??
            t("error_generic", {
              email: "support@influexaicreator.com",
            })
        );
        setLoading(false);
        return;
      }

      setDone(true);
      await supabase.auth.signOut();
      try {
        sessionStorage.setItem("account_deleted_notice", "1");
      } catch {
        /* ignore */
      }

      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch {
      setError(
        t("error_generic", { email: "support@influexaicreator.com" })
      );
      setLoading(false);
    }
  };

  return (
    <MotionModal
      open={open}
      onClose={done ? undefined : onClose}
      overlayClassName="fixed inset-0 z-[260] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#060608]/90"
      className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[rgba(255,71,87,0.25)] bg-[#0f0f12] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
    >
      {done ? (
        <div className="text-center py-4">
          <p className="text-[#B4FF00] font-semibold text-lg mb-2">
            {t("success_title")}
          </p>
          <p className="text-sm text-white/70">{t("success_redirect")}</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-[#ff6b7a] mb-3">{t("title")}</h2>
          <p className="text-sm text-white/75 leading-relaxed mb-4">
            {t("warning")}
          </p>

          {hasActiveSubscription && (
            <p className="text-sm text-white/65 leading-relaxed mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/10">
              {t("subscription_hint")}
            </p>
          )}

          {isAgencyOwner ? (
            <p className="text-sm text-[#ff6b7a] leading-relaxed mb-5 p-3 rounded-xl bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.2)]">
              {t("agency_owner_block", {
                email: "support@influexaicreator.com",
              })}
            </p>
          ) : (
            <>
              <label className="block text-xs font-semibold text-white/55 mb-2">
                {t("confirm_label", { word: CONFIRM_WORD })}
              </label>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                className="w-full mb-4 px-3 py-2.5 rounded-xl border border-white/10 bg-[#18181d] text-[#F0EFE8] text-sm outline-none focus:border-[rgba(255,71,87,0.45)]"
                autoComplete="off"
                disabled={loading}
              />
            </>
          )}

          {error && (
            <p className="text-sm text-[#ff6b7a] mb-4 leading-relaxed">{error}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-transparent text-white/80 text-sm font-semibold disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            {!isAgencyOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canSubmit}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,71,87,0.35)] bg-[rgba(255,71,87,0.12)] text-[#ff6b7a] text-sm font-bold disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {loading ? t("deleting") : t("confirm_button")}
              </button>
            )}
          </div>
        </>
      )}
    </MotionModal>
  );
}

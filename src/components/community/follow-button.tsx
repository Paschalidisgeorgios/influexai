"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleFollowUser } from "@/app/actions/community-creations";

type Props = {
  targetUserId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
};

export function FollowButton({
  targetUserId,
  initialFollowing,
  isLoggedIn,
}: Props) {
  const t = useTranslations("community");
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!isLoggedIn) {
      alert(t("login_required"));
      return;
    }
    setBusy(true);
    const res = await toggleFollowUser(targetUserId);
    setBusy(false);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setFollowing(res.following);
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
        following
          ? "border border-white/20 text-[rgba(255,255,255,0.65)] bg-transparent"
          : "bg-[#B4FF00] text-[#060608] hover:opacity-90"
      }`}
    >
      {following ? t("following") : t("follow")}
    </button>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  commentOnCreation,
  getCreationComments,
  reportCreation,
  toggleLikeCreation,
} from "@/app/actions/community-creations";
import type { CommunityCreationItem } from "@/lib/community-creations";
import { profilePath, remixHref } from "@/lib/community-creations";
import { formatRelativeTime, initials } from "@/lib/community";

type Props = {
  item: CommunityCreationItem;
  isLoggedIn: boolean;
  fullscreen?: boolean;
  onLikeChange?: (id: string, liked: boolean, delta: number) => void;
};

export function CreationCard({
  item,
  isLoggedIn,
  fullscreen = false,
  onLikeChange,
}: Props) {
  const t = useTranslations("community");
  const [liked, setLiked] = useState(item.userLiked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<
    Awaited<ReturnType<typeof getCreationComments>>
  >([]);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert(t("login_required"));
      return;
    }
    setBusy(true);
    const res = await toggleLikeCreation(item.id);
    setBusy(false);
    if (!res.success) {
      alert(res.error);
      return;
    }
    const next = res.liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    onLikeChange?.(item.id, next, next ? 1 : -1);
  };

  const openComments = async () => {
    setCommentsOpen(true);
    const list = await getCreationComments(item.id);
    setComments(list);
  };

  const submitComment = async () => {
    if (!isLoggedIn) {
      alert(t("login_required"));
      return;
    }
    setBusy(true);
    const res = await commentOnCreation(item.id, commentText);
    setBusy(false);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setCommentText("");
    const list = await getCreationComments(item.id);
    setComments(list);
  };

  const handleReport = async () => {
    if (!isLoggedIn) {
      alert(t("login_required"));
      return;
    }
    const reason = window.prompt(t("report_prompt"));
    if (reason === null) return;
    const res = await reportCreation(item.id, reason);
    if (res.success) alert(t("report_sent"));
    else alert(res.error);
  };

  const mediaHeight = fullscreen ? "min(72vh, 640px)" : 220;

  return (
    <article
      className={
        fullscreen
          ? "flex h-[100dvh] w-full flex-col bg-[#060608]"
          : "rounded-2xl border border-white/[0.08] bg-[#0f0f12] overflow-hidden"
      }
    >
      <div
        className="relative flex items-center justify-center bg-[#0a0a0c]"
        style={{ minHeight: mediaHeight }}
      >
        {item.previewUrl && item.assetKind !== "text" ? (
          <Image
            src={item.previewUrl}
            alt=""
            fill
            className="object-cover"
            sizes={fullscreen ? "100vw" : "(max-width: 400px) 100vw"}
            unoptimized
          />
        ) : (
          <div className="p-6 text-center max-w-md">
            <p className="text-[#B4FF00] text-xs font-bold uppercase tracking-wider mb-2">
              {item.type}
            </p>
            <p className="text-[#F0EFE8] text-sm line-clamp-6">{item.prompt}</p>
            {item.viralScore != null && (
              <p className="mt-3 font-[family-name:var(--font-bebas)] text-4xl text-[#B4FF00]">
                {item.viralScore}
              </p>
            )}
          </div>
        )}
        {item.assetKind === "video" && (
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
            ▶ Video
          </span>
        )}
      </div>

      <div className={fullscreen ? "flex-1 p-4 flex flex-col" : "p-4"}>
        <div className="flex items-center gap-2 mb-2">
          <Link
            href={profilePath(item.author.username)}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="w-8 h-8 rounded-full bg-[#18181d] border border-[#B4FF00]/30 flex items-center justify-center text-xs text-[#B4FF00] font-bold shrink-0">
              {initials(item.author.name)}
            </span>
            <span className="text-sm text-[#F0EFE8] font-semibold truncate">
              {item.author.name}
            </span>
          </Link>
          <span className="text-[rgba(255,255,255,0.65)] text-xs ml-auto shrink-0">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>

        <p className="text-[#a3a3a8] text-sm line-clamp-2 mb-3">{item.prompt}</p>

        <div className="flex flex-wrap gap-2 mt-auto">
          <button
            type="button"
            disabled={busy}
            onClick={handleLike}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-white/10 bg-white/[0.04] text-[#F0EFE8] hover:border-[#B4FF00]/40"
          >
            {liked ? "❤️" : "🤍"} {likeCount}
          </button>
          <button
            type="button"
            onClick={() => (commentsOpen ? setCommentsOpen(false) : openComments())}
            className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-[rgba(255,255,255,0.65)] hover:text-[#F0EFE8]"
          >
            💬 {item.commentCount}
          </button>
          <Link
            href={remixHref(item)}
            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-[#B4FF00] text-[#060608] hover:opacity-90"
          >
            {t("remix_video")}
          </Link>
          <button
            type="button"
            onClick={handleReport}
            className="px-3 py-1.5 rounded-lg text-sm text-[rgba(255,255,255,0.65)] hover:text-[#ff6b7a] ml-auto"
          >
            {t("report")}
          </button>
        </div>

        {commentsOpen && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
              {comments.map((c) => (
                <p key={c.id} className="text-xs text-[#a3a3a8]">
                  <strong className="text-[#F0EFE8]">{c.author.name}:</strong>{" "}
                  {c.content}
                </p>
              ))}
            </div>
            {isLoggedIn && (
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("comment_placeholder")}
                  className="flex-1 rounded-lg border border-white/10 bg-[#18181d] px-3 py-2 text-sm text-[#F0EFE8]"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={submitComment}
                  className="px-3 py-2 rounded-lg bg-[#B4FF00] text-[#060608] text-sm font-bold"
                >
                  {t("reply")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

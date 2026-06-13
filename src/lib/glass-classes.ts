/** Shared Tailwind + glass CSS class strings for surfaces & inputs. */

export const glassSurfaceClass =
  "glass-surface rounded-xl border border-zinc-700/60 bg-zinc-950/60 p-6 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-all duration-300 hover:border-zinc-500 focus-within:border-[#ccff00]/40";

export const glassSurfaceStaticClass =
  "glass-surface glass-surface--static border border-zinc-700/60 bg-zinc-950/60 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]";

export const glassSurfaceAccentClass =
  "glass-surface glass-surface--accent border border-zinc-700/60 bg-zinc-950/60 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-all duration-300 hover:border-[#ccff00]/40 focus-within:border-[#ccff00]/40";

export const glassInputClass =
  "glass-input w-full rounded-xl border border-zinc-700/80 bg-black/40 text-white placeholder-zinc-500 transition-all focus:border-[#ccff00] focus:outline-none";

export const glassUiBoostClass = "glass-ui-boost brightness-115 contrast-105";

/** @deprecated Use glassSurfaceClass — kept for credits page migration */
export const GLASS_CARD = glassSurfaceClass;

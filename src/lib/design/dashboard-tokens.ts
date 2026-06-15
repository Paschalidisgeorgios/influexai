/**
 * InfluexAI Creator Studio — Dashboard Design Tokens
 *
 * Single source of truth for Tailwind class strings used across dashboard
 * components. Pure data — no React, no business logic, no API dependencies.
 *
 * Accent scale:
 *   Primary   #b4ff00  — interactive states, active indicators, CTAs
 *   Hover     #ccff00  — hover/highlight states only
 *
 * Usage:
 *   import { cards, buttons } from "@/lib/design/dashboard-tokens";
 *   <div className={cards.interactive}>...</div>
 */

// ─── Surfaces ────────────────────────────────────────────────────────────────

export const surfaces = {
  /** Root app background — near-black */
  app:      "bg-[#09090A]",
  /** Sidebar background + dividing border */
  sidebar:  "bg-[#09090A] border-r border-white/[0.02]",
  /** Secondary panels, drawers, overlays */
  panel:    "bg-zinc-900/80 border border-white/[0.04]",
  /** Slightly lifted surface (e.g. dropdowns) */
  elevated: "bg-zinc-900/60",
  /** Frosted glass surface */
  glass:    "bg-zinc-900/40 backdrop-blur-md border border-white/[0.04]",
} as const;

// ─── Cards ───────────────────────────────────────────────────────────────────

export const cards = {
  /** Static info card */
  default:     "rounded-xl border border-white/[0.05] bg-zinc-900/50",
  /** Clickable card with hover state */
  interactive: "rounded-xl border border-white/[0.05] bg-zinc-900/50 cursor-pointer transition-colors hover:border-white/10 hover:bg-zinc-900/80",
  /** Image / video asset card */
  media:       "rounded-xl border border-white/[0.05] bg-zinc-950/20 overflow-hidden",
  /** Tool form card */
  tool:        "rounded-xl border border-white/[0.05] bg-zinc-900/50 p-4",
  /** Settings or config panel */
  panel:       "rounded-xl border border-white/[0.06] bg-zinc-900/70 p-4",
  /** Subtle / de-emphasised card */
  muted:       "rounded-xl border border-white/[0.03] bg-zinc-900/30",
} as const;

// ─── Buttons ─────────────────────────────────────────────────────────────────
//
// Variant provides colour/border; size provides padding + text size.
// Components combine both: `${buttons.variants.primary} ${buttons.sizes.md}`

export const buttons = {
  /** Colour/border class per semantic variant */
  variants: {
    /** Lime accent CTA */
    primary:   "bg-[#b4ff00] text-black hover:opacity-90 disabled:opacity-40",
    /** Outlined / subdued action */
    secondary: "border border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:bg-zinc-800/60 hover:text-white disabled:opacity-40",
    /** Text-only action */
    ghost:     "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-40",
    /** Destructive action */
    danger:    "border border-red-900/40 bg-red-950/30 text-red-400 hover:border-red-700/50 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-40",
    /** Square icon-only button */
    icon:      "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-40",
  },
  /** Padding + typography per size */
  sizes: {
    sm:   "rounded-lg  px-3   py-1.5 text-xs  font-medium leading-none",
    md:   "rounded-xl  px-4   py-2   text-sm  font-semibold leading-none",
    lg:   "rounded-xl  px-5   py-2.5 text-sm  font-bold    leading-none",
    icon: "h-8 w-8 rounded-lg flex items-center justify-center",
  },
  /** Convenience: commonly composed full strings */
  presets: {
    primaryMd:   "rounded-xl px-4 py-2 text-sm font-bold bg-[#b4ff00] text-black hover:opacity-90 disabled:opacity-40 transition-opacity",
    secondaryMd: "rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:bg-zinc-800/60 hover:text-white disabled:opacity-40 transition-colors",
    ghostSm:     "rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-40 transition-colors",
    iconMd:      "h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-40 transition-colors",
  },
} as const;

// ─── Badges ──────────────────────────────────────────────────────────────────

export const badges = {
  /** Live / working tool */
  active:     "rounded-full bg-[#b4ff00]/10 px-2 py-0.5 font-mono text-[10px] font-medium text-[#b4ff00]",
  /** Feature in early access / beta */
  preview:    "rounded-full bg-blue-500/10    px-2 py-0.5 font-mono text-[10px] font-medium text-blue-400",
  /** Not yet launched */
  comingSoon: "rounded-full bg-white/[0.04]   px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-500",
  /** Status unclear */
  unknown:    "rounded-full bg-zinc-800/60    px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-500",
  /** Credit cost indicator */
  credits:    "rounded-full bg-white/[0.04]   px-2 py-0.5 font-mono text-[10px] font-bold  text-[#b4ff00]",
  /** AI provider name */
  provider:   "rounded-full bg-white/[0.04]   px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-400",
  /** Trending / high engagement */
  hot:        "rounded-full bg-orange-500/10  px-2 py-0.5 font-mono text-[10px] font-medium text-orange-400",
  /** Newly added tool */
  new:        "rounded-full bg-violet-500/10  px-2 py-0.5 font-mono text-[10px] font-medium text-violet-400",
} as const;

// ─── Text ────────────────────────────────────────────────────────────────────

export const text = {
  /** Headings, labels */
  primary:   "text-white",
  /** Body text, descriptions */
  secondary: "text-zinc-300",
  /** Supporting text */
  muted:     "text-zinc-400",
  /** Least-emphasis meta-text */
  subtle:    "text-zinc-500",
  /** Accent-coloured emphasis */
  accent:    "text-[#b4ff00]",
  /** Error / destructive */
  danger:    "text-red-400",
} as const;

// ─── Borders ─────────────────────────────────────────────────────────────────

export const borders = {
  /** Standard 5% white card border */
  default: "border border-white/[0.05]",
  /** Barely-visible structural border */
  subtle:  "border border-white/[0.03]",
  /** Clearly visible 10% border */
  visible: "border border-white/10",
  /** Accent indicator border */
  accent:  "border border-[#b4ff00]/30",
  /** Error state border */
  danger:  "border border-red-900/40",
} as const;

// ─── Focus ───────────────────────────────────────────────────────────────────

export const focus = {
  /** WCAG-compliant accent ring for interactive elements */
  default: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4ff00]/40 focus-visible:ring-offset-0",
  /** Subtle ring for form fields */
  subtle:  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500/30",
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  sm:       "shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
  md:       "shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
  lg:       "shadow-[0_8px_40px_rgba(0,0,0,0.7)]",
  accentSm: "shadow-[0_0_12px_rgba(180,255,0,0.15)]",
  accent:   "shadow-[0_0_32px_rgba(180,255,0,0.18)]",
} as const;

// ─── Radius ──────────────────────────────────────────────────────────────────

export const radius = {
  /** 8px — compact elements, input adornments */
  sm:   "rounded-lg",
  /** 12px — cards, panels, modals */
  md:   "rounded-xl",
  /** 16px — hero cards, large surfaces */
  lg:   "rounded-2xl",
  /** pill / avatar / badge */
  full: "rounded-full",
} as const;

// ─── Layout ──────────────────────────────────────────────────────────────────

export const layout = {
  sidebarWidth:    "w-[240px]",
  contentOffset:   "ml-[240px]",
  headerHeight:    "h-[56px]",
  rightPanelWidth: "w-[280px]",
  maxContentWidth: "max-w-[1440px]",
} as const;

// ─── Convenience re-export ───────────────────────────────────────────────────

export const DT = {
  surfaces,
  cards,
  buttons,
  badges,
  text,
  borders,
  focus,
  shadows,
  radius,
  layout,
} as const;

export type SurfaceVariant    = keyof typeof surfaces;
export type CardVariant       = keyof typeof cards;
export type ButtonVariant     = keyof typeof buttons.variants;
export type ButtonSize        = keyof typeof buttons.sizes;
export type BadgeVariant      = keyof typeof badges;
export type TextVariant       = keyof typeof text;
export type BorderVariant     = keyof typeof borders;
export type FocusVariant      = keyof typeof focus;
export type ShadowVariant     = keyof typeof shadows;
export type RadiusVariant     = keyof typeof radius;

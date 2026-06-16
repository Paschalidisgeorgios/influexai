# STUDIO UI FOUNDATION — Phase 3A.0

**Date:** 2026-06-16  
**Scope:** High-end Studio design system for production dashboard. UI/surface only — no billing, credits logic, provider routes, or tool functionality changes.

---

## shadcn/ui Status

| Check | Result |
|-------|--------|
| `components.json` | **Not present** |
| `components/ui/button`, `input`, `select`, etc. | **Not present** (only app-specific ui: LoadingButton, Skeleton, …) |
| `class-variance-authority` | **Present** in `package.json` |
| `clsx` + `tailwind-merge` | **Present** |
| `lucide-react` | **Present** |

**Decision:** shadcn/ui was **not initialized**. No `npx shadcn init` — avoids global style conflicts. Custom Studio components built on existing Tailwind + CVA/clsx/tailwind-merge stack.

---

## New Studio Components

**Path:** `src/components/dashboard/studio-ui/`

| Component | Purpose |
|-----------|---------|
| `tokens.ts` | Colors, radii, shadows |
| `cn.ts` | `clsx` + `tailwind-merge` helper |
| `StudioStage` | Large calm ivory work surface (`rounded-[32px]`) |
| `StudioPanel` | Soft panel, minimal border (`rounded-[24px]`) |
| `StudioSection` | Typography + spacing groups (no hard box) |
| `StudioFieldLabel`, `StudioInput`, `StudioTextarea`, `StudioSelect`, `StudioFieldHelper` | Form controls (`rounded-[18px]`) |
| `StudioSegmentedControl`, `StudioOptionPills` | Mode/format pills (`rounded-full`) |
| `StudioCreditPill`, `StudioCreditNote` | Credit display without internal terms |
| `StudioActionBar` | Primary + secondary CTA + hint |
| `ToolSetupLayout`, `ToolSetupContext`, `ToolSetupSurface` | Two-column setup shell (desktop) / stacked (mobile) |
| `StudioUploadZone` | Visual-only upload placeholder (no upload logic) |
| `StudioPageHeader` | Strong typography hierarchy |

Barrel export: `src/components/dashboard/studio-ui/index.ts`

---

## Production Components Updated

| Component | Changes |
|-----------|---------|
| `DashboardSurface.tsx` | Delegates stage to `StudioStage`; softer panel radii/shadows; stronger page header typography |
| `ProductionToolsOverview.tsx` | `StudioPageHeader`, `StudioSection`, soft tool cards, `StudioPanel` agent block |
| `ProductionToolLaunch.tsx` | `StudioPageHeader`, `StudioCreditPill`, `StudioActionBar` |
| `ProductionToolSetup.tsx` | `ToolSetupLayout` two-column shell + `ToolSetupSurface` |
| `ProductionToolSetupBody.tsx` | Removed outer `DashboardPanel` nesting (card-in-card) |
| `AgentRunMessages.tsx` | Softer briefing bubbles, `StudioPanel`, pill retry button |
| `StudioCockpit.tsx` | Copy tweak only (panels inherit new `DashboardPanel`) |
| `AgentAutopilotV2.tsx` | Pill tabs/CTA, softer quick-tool cards |
| `src/app/dashboard/settings/page.tsx` | Input radii `rounded-[18px]` |

---

## Design Rules

### Radii
- Stage: `32px`
- Main panels: `24px`
- Inputs: `18px`
- Buttons / pills: `full` or `16px`
- Tool cards: `20px`

### Colors
- Shell: `#050506`
- Ivory: `#FAF6EE`
- Stone: `#EBE2D2`
- Text: `#080808`
- Muted: `rgba(8,8,8,0.58)`
- Accent lime: `#b4ff00` — **CTAs, active states, status dots only**

### Avoid
- Card-in-card stacks
- Heavy borders everywhere
- Mono uppercase section titles for primary hierarchy
- Internal terms: Legacy, Fallback, AgentBox, Mock, Preview
- Long AI marketing copy

### Prefer
- Large stage, few strong panels
- Whitespace over lines
- Segmented pills for options
- Short action-led microcopy

---

## Bewusst nicht angefasst

- API routes, provider calls, credit deductions
- Auth, Supabase queries, gallery data logic
- Landing page, design-preview
- `ProductionToolSetupBody` field logic / generation flows (only layout nesting reduced)
- Full Settings rewrite (dark legacy blocks in `SettingsView.tsx`)
- shadcn component install
- Upload wiring in `StudioUploadZone`

---

## Offene Risiken

- `ProductionToolSetupBody` still uses inline field styles — Phase 3A can migrate to `StudioInput` / `StudioSegmentedControl`
- `SettingsView.tsx` (dark inline tools) unchanged
- Some agent subcomponents (`AgentResultCard`, etc.) still dark-themed
- Tool cards on overview show CTA text, not per-tool credit (by design — credits on setup)

---

## Referenz

Terminal Industries (terminal-industries.com) used as **quality reference only** — calm surfaces, strong type, OS feel. No layout/copy/brand copying.

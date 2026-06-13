# InfluexAI Dashboard Audit — June 3, 2026

**Scope:** Read-only audit of dashboard tools, schemas, pipeline, UX, credits, build health, loop risks, and mobile readiness.  
**Active shell:** `src/app/dashboard/dashboard-layout-client.tsx` → `CanvasShell` (not `dashboard-v3/DashboardShell.tsx`).  
**Method:** File inspection, `grep`, `npx tsc --noEmit`, `npm run build` (2026-06-03).

---

## Executive summary

The production dashboard runs **CanvasShell** with **14 canvas tools** defined in `src/lib/canvas/toolApiSchema.ts`. A parallel **dashboard-v3** stack (`WORKSPACE_TOOLS`, `TOOL_CONFIGS`, `GlobalSidebar`, `DynamicParamFields`) exists but is **not mounted** in the live layout.

**Critical architectural gap:** For non-legacy routes, `CanvasShell` does **not render** `{children}` from `page.tsx` files (`src/components/canvas/CanvasShell.tsx` lines 63–91). Only tools in `ROUTE_TO_TOOL_ID` auto-spawn a canvas panel. Visiting most `/dashboard/*/page.tsx` URLs shows an **empty panel strip** while large legacy page implementations remain in the repo unused.

---

## 1. Tool Inventory

### 1A. Production canvas tools (`TOOL_API_SCHEMA` — 14 tools)

These are the tools surfaced in `CanvasSidebarContent` and rendered via `ControlNode` + `ParamFields`.

| Tool | Route(s) | Category | Params | Model schema (`MODEL_SCHEMAS`) | Pipeline | Generate | Status |
|------|----------|----------|--------|----------------------------------|----------|----------|--------|
| Viral Hook | `/dashboard/viral-hook` | ERSTELLEN | 3 | No | Out: text | Yes (`/api/viral-hook`) | Active canvas; legacy page unused |
| Content Kalender | `/dashboard/content-kalender` | ERSTELLEN | 3 | No | Out: calendar* | Yes (`/api/content-kalender`) | Active; *calendar output type not in `PIPELINE_COMPATIBILITY` |
| Trend Script | `/dashboard/trend-to-script` | ERSTELLEN | 3 | No | In: `script_input`; Out: script | Yes (`/api/generate`) | Active |
| Produkt-Werbung | `/dashboard/produkt` | ERSTELLEN | 3 | No | Out: script | Yes (`/api/produkt-werbung`) | Active; WORKSPACE credits (75) ≠ canvas (2) |
| Bild Generator (`flux-image`) | `/dashboard/image-generator` | VISUALS | 4 | Partial (Flux schemas exist, unwired) | In: `prompt`; Out: image | Yes (`/api/generate-image`) | Active |
| KI-Ich | `/dashboard/ki-influencer`, `/dashboard/ki-ich` | VISUALS | 4 | No | In: `reference_image`; Out: image | Yes (`/api/ki-influencer/generate`) | Active |
| LoRA Training | `/dashboard/lora-training` | VISUALS | 3 | No | Out: json | Yes (`/api/lora/train`) | Active; WORKSPACE (10) ≠ canvas (50) |
| Szenen Generator (`seedance-video`) | `/dashboard/szenen-generator`, `/dashboard/seedance` | VIDEO & FILM | 5 | Partial (Seedance/Kling in `MODEL_SCHEMAS`, unwired) | In: `images_list`, `script_ref`; Out: video | Yes (`/api/seedance`) | Active |
| Video Transformer | `/dashboard/video-transformer` | VIDEO & FILM | 3 | No | In: `input_video`; Out: video | Yes (`/api/akool/video-to-video`) | Active |
| Video Übersetzer | `/dashboard/video-uebersetzer`, `/dashboard/video-translation` | VIDEO & FILM | 3 | Partial (Akool translation schema, unwired) | In: `input_video`; Out: video | Yes (`/api/akool/video-translation`) | Active |
| Avatar Studio | `/dashboard/avatar-studio` | AVATAR & LIVE | 3 | Partial (Akool talking avatar, unwired) | In: `audio_script`; Out: video | Yes (`/api/avatar/start-render`) | Active |
| Lipsync Studio | `/dashboard/lipsync-studio`, `/dashboard/lipsync` | AVATAR & LIVE | 2 | Partial (Akool lipsync, unwired) | In: `input_video`, `input_audio`; Out: video | Yes (`/api/akool/lipsync`) | Active |
| Melodia Studio | `/dashboard/melodia` | AUDIO | 3 | Partial (ElevenLabs TTS schema, unwired) | In: `prompt`; Out: audio | Yes (`/api/melodia`) | Active |
| Agent Autopilot | `/dashboard`, `/dashboard/ki-agent`, `/dashboard/agent` | AUTOMATION | 5 (+ extras) | No | Out: script | Yes (`/api/agent`) | Active; default home route |

**Canvas UI stack:** `ParamFields` (`src/components/canvas/ParamFields.tsx`) — **not** `DynamicParamFields`. Uploads use inline `FileUploadField` (drag-and-drop, lines 375–524).

---

### 1B. `WORKSPACE_TOOLS` registry (31 entries — `src/lib/dashboard-v3/registry.ts`)

Used by **unused** `dashboard-v3/GlobalSidebar.tsx`. Compared to canvas + pages + mega-menu.

| Tool | Route | Category | customFields (TOOL_CONFIGS) | allowedModels | creditCost (registry) | Canvas | Page | Generate (if reachable) | Status |
|------|-------|----------|----------------------------|---------------|----------------------|--------|------|-------------------------|--------|
| Script Generator | `/dashboard/script-generator` | ERSTELLEN | — (not in TOOL_CONFIGS) | — | 2 | No | Yes (legacy UI) | Yes (server actions) | **Orphan URL** — empty canvas, page not rendered |
| Viral Hook Generator | `/dashboard/viral-hook` | ERSTELLEN | 2 | Hallu 2.3 Fast | 3 | Yes | Yes | Canvas API | Duplicate systems |
| Trend Script | `/dashboard/trend-to-script` | ERSTELLEN | 2 | Hallu 2.3 Fast | 4 | Yes | Yes | Canvas API | Credits mismatch (4 vs 2) |
| Content Kalender | `/dashboard/content-kalender` | ERSTELLEN | 3 | Hallu 2.3 Fast | 5 | Yes | Yes | Canvas API | Credits mismatch (5 vs 2) |
| Produkt-Werbung | `/dashboard/produkt` | ERSTELLEN | 2 | Seedance/Kling | 75 | Yes | Yes | Canvas API | **Major credit mismatch** (75 vs 2) |
| Ad Creator | `/dashboard/ad-creator` | ERSTELLEN | — | — | 8 | No | Yes | Unknown | **Orphan URL** |
| Thumbnail Konzept | `/dashboard/thumbnail-concept` | ERSTELLEN | — | — | 1 | No | Yes | Yes (page) | **Orphan URL** |
| Bild Generator | `/dashboard/image-generator` | VISUALS | 3 | Hallu 2.3 Fast | 5 dyn | Yes | Yes (DynamicDashboardEngine) | Canvas API | Dual UI; page not rendered |
| Mein KI-Ich | `/dashboard/ki-influencer` | VISUALS | 2 | Hallu 2.3 Fast | 8 | Yes | Yes (large page) | Both | Duplicate route `/ki-ich` |
| LoRA Training | `/dashboard/lora-training` | VISUALS | 2 | Hallu 2.3 Fast | 10 dyn | Yes | Yes | Canvas API | Credit mismatch (10 vs 50) |
| HD Upscaler | `/dashboard/upscaler` | VISUALS | — | — | 4 | No | Yes | Yes (page) | **Orphan URL**; in mega-menu |
| UGC Video | `/dashboard/ugc-video` | VISUALS | — | — | 5 | No | Yes | Yes (`/api/ugc-video`) | **Orphan URL** |
| E-Commerce Ads | `/dashboard/ecommerce-ads` | VISUALS | — | — | 8 | No | Yes | Yes (page) | **Orphan URL**; overlaps Ad Creator |
| Story Creator | `/dashboard/story-creator` | VIDEO & FILM | 2 | Seedance Fast | 15 | No | Yes (DynamicDashboardEngine) | Page | **Orphan URL** |
| Szenen Generator | `/dashboard/szenen-generator` | VIDEO & FILM | 3 | Seedance/Kling | 5 dyn | Yes | Yes | Canvas API | OK |
| Video Transformer | `/dashboard/video-transformer` | VIDEO & FILM | 3 | Seedance/Kling | 6 | Yes | Yes | Canvas API | OK |
| Video Remix | `/dashboard/video-remix` | VIDEO & FILM | — | — | 2 | No | Yes | Yes (page) | **Orphan URL** |
| Motion Transfer | `/dashboard/motion-transfer` | VIDEO & FILM | — | — | 8 | No | Yes | Yes (page) | **Orphan URL** |
| Video Übersetzer | `/dashboard/video-uebersetzer` | VIDEO & FILM | 3 | Kling Omni | 5 dyn | Yes | Yes | Canvas API | OK |
| Live Creator | `/dashboard/live-creator` | AVATAR & LIVE | 3 | Seedance Fast | 2 dyn | No | Yes | Yes (API) | **Orphan URL**; in TOOL_CONFIGS only |
| Avatar Studio | `/dashboard/avatar-studio` | AVATAR & LIVE | 3 | Seedance/Kling | 9 dyn | Yes | Yes | Canvas API | OK |
| Character Studio | `/dashboard/character-studio` | AVATAR & LIVE | 3 | Hallu 2.3 Fast | 5 | No | Yes | Yes (page) | **Orphan URL**; mega-menu “AI 3D” |
| Lipsync Studio | `/dashboard/lipsync-studio` | AVATAR & LIVE | — | — | 6 | Yes | Yes | Canvas API | Duplicate `/lipsync` |
| Face Studio | `/dashboard/face-studio` | AVATAR & LIVE | — | — | 5 dyn | No | Yes | Yes (page) | **Orphan URL** |
| Melodia Studio | `/dashboard/melodia` | AUDIO | — | — | 3 | Yes | Yes | Canvas API | OK |
| Agent Autopilot | `/dashboard/ki-agent` | INTELLIGENCE | 2 | Seedance/Kling/Hallu | 5 dyn | Yes | Yes | Canvas API | Credits mismatch (5 vs 15) |
| Campaign Autopilot | `/dashboard/campaign-autopilot` | INTELLIGENCE | — | — | 5 dyn | No | Yes (minimal) | Unknown | **Orphan URL** |
| Viral Score | `/dashboard/viral-score` | INTELLIGENCE | — | — | 2 | No | Yes | Yes (`/api/viral-score`) | **Orphan URL** |
| Outlier Detector | `/dashboard/outlier-detector` | INTELLIGENCE | — | — | 3 | No | Yes | Yes (page) | **Orphan URL** |
| Niche Analyzer | `/dashboard/niche-analyzer` | INTELLIGENCE | — | — | 2 | No | Yes | Yes (page) | **Orphan URL** |
| Konkurrenz-Analyse | `/dashboard/competitor` | INTELLIGENCE | — | — | 5 | No | Yes | Yes (page) | **Orphan URL** |
| Studio Archiv | `/dashboard/gallery` | WORKFLOW | — | — | null | No | Yes | N/A | Legacy route** / mega-menu |
| Analytics | `/dashboard/analytics` | WORKFLOW | — | — | null | No | Yes | N/A | Legacy shell only |

**Legacy shell routes** (children rendered): `settings`, `credits`, `admin/*`, `agency`, `analytics`, `white-label`, `referral`, `profile`, `api` — see `LEGACY_CHILD_ROUTES` in `CanvasShell.tsx` lines 18–28.

**Additional dashboard pages (66 total `page.tsx` files)** not in `WORKSPACE_TOOLS`: e.g. `seedance`, `text-to-video`, `video-generator`, `video-editor`, `video-ad`, `voice`, `voice-studio`, `voice-agent`, `live-portrait`, `live-creator-new`, redirects (`agent`, `live`, `stimme`, `avatar`), admin subpages, `ki-agent/chat`, `script-generator/saved`, `credits/success`.

---

## 2. Missing / Duplicate / Orphaned Tools

### Missing page (in registry or mega-menu, no `page.tsx`)

| Item | Source | Notes |
|------|--------|-------|
| None critical | Mega-menu 6/6 have pages | All mega-menu hrefs resolve to existing routes |

### Mega-menu mismatch (`src/lib/landing-features-mega-v2.ts`)

| Mega-menu item | href | In canvas sidebar? | In WORKSPACE_TOOLS? |
|----------------|------|--------------------|---------------------|
| AI Image Generation | `/dashboard/image-generator` | Yes (`flux-image`) | Yes |
| AI Video Generation | `/dashboard/szenen-generator` | Yes | Yes |
| AI 3D Generation | `/dashboard/character-studio` | **No** | Yes |
| AI Image Enhancements | `/dashboard/upscaler` | **No** | Yes |
| AI Video Enhancements | `/dashboard/video-transformer` | Yes | Yes |
| AI Finetuning | `/dashboard/lora-training` | Yes | Yes |
| File Management | `/dashboard/gallery` | **No** | Yes (Archiv) |

Mega-menu is English-only; canvas sidebar uses German categories.

### Duplicate / overlapping tools

| Pair | Issue |
|------|-------|
| `/dashboard/ki-influencer` ↔ `/dashboard/ki-ich` | Same canvas tool `ki-ich` |
| `/dashboard/lipsync` ↔ `/dashboard/lipsync-studio` | Same canvas tool |
| `/dashboard/video-translation` ↔ `/dashboard/video-uebersetzer` | Same canvas tool |
| `/dashboard/seedance` ↔ `/dashboard/szenen-generator` | Same canvas tool |
| `/dashboard/agent` ↔ `/dashboard/ki-agent` | Redirect / same tool |
| Ad Creator ↔ E-Commerce Ads ↔ Produkt-Werbung | Three ad/product flows |
| Voice / Voice Studio / Stimme / Melodia | Multiple audio entry points |
| Live Creator / Live Creator New / Live Portrait / Live | Fragmented live avatar routes |
| `dashboard-v3/DashboardShell` ↔ `canvas/CanvasShell` | Two complete layout systems |

### Orphaned / unreachable in production

- **~40+ tool `page.tsx` files** with full UI never mounted because `CanvasShell` omits `{children}` (lines 63–91).
- **`dashboard-v3` entire stack** (`DashboardShell.tsx`, `GlobalSidebar.tsx`, `WorkspaceCanvas.tsx`, `DynamicParamFields.tsx`) — no import from active layout.
- **`QuickStartGuide`** (`src/components/dashboard/QuickStartGuide.tsx`) — **zero imports** in codebase (dead).
- **`dashboard/page.tsx`** returns `null` (line 1–2) — no quick-start grid.

### Empty `customFields` in TOOL_CONFIGS

All 14 `TOOL_CONFIGS` entries have ≥2 `customFields`. Tools **outside** `TOOL_CONFIGS` have no registry fields (marked `—` in table above).

---

## 3. API Schema Coverage

`MODEL_SCHEMAS` in `src/lib/api-schemas/toolApiSchema.ts` (lines 848–860): **11 provider model schemas** (Seedance, Kling, Flux, Akool×4, ElevenLabs).

| Tool / surface | Uses `DynamicParamFields` | Schema exists in `MODEL_SCHEMAS` | Notes |
|----------------|---------------------------|-----------------------------------|-------|
| All canvas tools | **No** | Partial | Canvas uses `src/lib/canvas/toolApiSchema.ts` + `ParamFields` |
| `DynamicParamFields` component | Self only | Would consume `ModelApiSchema` | **Never imported** elsewhere (`grep` confirms) |
| Szenen / Seedance | No | `bytedance/seedance-2.0`, `/fast` | Schemas unused in UI |
| Bild Generator | No | `fal-ai/flux-2-pro`, `flux-2-flex` | Unused |
| Video Transformer / Avatar / Lipsync / Übersetzer | No | Akool schemas | Unused |
| Melodia | No | `elevenlabs/tts` | Unused |
| Text tools (hooks, scripts, agent) | No | No Claude/text schemas in `MODEL_SCHEMAS` | N/A |

**Static vs dynamic forms:** 100% of active tools use **`ParamFields`** (static schema from canvas `toolApiSchema.ts`). **`DynamicParamFields`** is dead code (510 lines).

---

## 4. Pipeline Coverage

Pipeline definitions: `src/lib/dashboard-v3/usePipeline.ts` (`PIPELINE_COMPATIBILITY`, `TOOL_OUTPUT_TYPE`).  
Runtime wiring: `PipelineContextProvider` in `CanvasPanelStripView.tsx` (lines 120–127), `ParamFields` + `buildEffectiveParams` in `ControlNode.tsx` (lines 162–171).

### Can produce output (registered after generate)

| Canvas tool ID | Output type | Registered? |
|----------------|-------------|-------------|
| viral-hook | text | Yes |
| content-kalender | — | **No** — not in `TOOL_OUTPUT_TYPE` |
| trend-script | script | Yes |
| produkt-werbung | script | Yes |
| flux-image | image_url | Yes |
| ki-ich | image_url | Yes |
| lora-training | json | Yes |
| seedance-video | video_url | Yes |
| video-transformer | video_url | Yes |
| video-uebersetzer | video_url | Yes |
| avatar-studio | video_url | Yes |
| lipsync-studio | video_url | Yes |
| melodia-studio | audio_url | Yes |
| agent-autopilot | script | Yes |

### Can receive inherited input (field keys in `PIPELINE_COMPATIBILITY`)

| Tool | Receiving fields | Status |
|------|------------------|--------|
| flux-image | `prompt` ← text/script | Works |
| seedance-video | `prompt`, `images_list`, `script_ref` | Works |
| trend-script | `script_input` | Works |
| ki-ich | `reference_image` (via `image_url` compat) | Works |
| video-transformer | `input_video` | Works |
| video-uebersetzer | `input_video` | Works |
| avatar-studio | `audio_script` | Works |
| lipsync-studio | `input_video`, `input_audio` | Works |
| melodia-studio | `prompt` | Works |
| viral-hook, content-kalender, produkt-werbung, lora-training, agent-autopilot | No compatible param keys | **Should** chain per `followUpTools` in schema — partial gap |

### Should receive but don't (per `followUpTools` + output types)

- **produkt-werbung** → should accept script/hook into copy fields (no `prompt`/`script_input` key).
- **content-kalender** → no pipeline output registration for downstream tools.
- **agent-autopilot** → `campaign_goal` not in `PIPELINE_COMPATIBILITY` (key `kampagnen-ziel` exists in compat map but unused in params).

Visual connections: `PipelineConnections.tsx` (canvas overlay, RAF loop lines 117–128).

---

## 5. UI/UX Consistency Issues

### Canvas tools (`ControlNode` — all 14 active tools)

| Check | Status | Location |
|-------|--------|----------|
| Progressive disclosure (`showAdvanced`) | **Yes** | `ControlNode.tsx` 90, 450–505; duplicate toggle also inside `ParamFields` 44, 148–164 |
| Generate button shows credit cost | **Yes** | `ControlNode.tsx` 343–348, 544–546 |
| ADMIN badge on generate | **Yes** — subtle `bg-black/20` | Lines 547–550 |
| Upload drag-and-drop | **Yes** — `FileUploadField` in `ParamFields.tsx` 375–524 | Not the `UploadField` in `DynamicParamFields` |
| ADMIN bypass styling | **Not subtle** — red `text-red-400` “∞ Bypass” / “Admin” | `CanvasSidebarContent.tsx` 154–156; `CanvasMobileNav.tsx` 86–88 |
| Header ADMIN badge | Red `[ADMIN]` | `CanvasHeader.tsx` 49–52 |

### Legacy / unreachable pages (sample)

| Page | Progressive disclosure | Credits on CTA | UploadField |
|------|------------------------|------------------|-------------|
| `script-generator/page.tsx` | No (all fields visible) | Yes line 662 “Kostet 2 Credits” | No |
| `viral-hook/page.tsx` | No | Yes line 258 | No |
| `image-generator/page.tsx` | Custom UI | Partial | Custom upload |
| Intelligence tools (outlier, niche, viral-score) | Varies | Partial | No |

### Dashboard home / quick-start

- **`src/app/dashboard/page.tsx`**: returns `null` — **no quick-start grid**.
- **`QuickStartGuide.tsx`**: exists but **never imported** — earlier fix not wired.

### GlobalSidebar admin section

- **`dashboard-v3/GlobalSidebar.tsx`**: **no admin section**, no `is_admin` check (grep: no matches).
- Admin visibility only via **`CanvasHeader`** `[ADMIN]` badge and credit exempt UI.

### Mock / pre-generation data

- **`ViralPredictorPanel`**: shows “Viral-Potenzial X%” only when **`hasResult`** is true (`ControlNode.tsx` 508–512) — **after** successful generation, not before.
- Score is computed client-side via `computeViralPrediction()` (`utils/viralPredictor.ts`) — heuristic, not API mock.
- **`mockGeneration()`** in `canvas-generate-client.ts` 162–164 only if `apiRoute` missing — **all 14 canvas tools have `apiRoute`**.

---

## 6. Credits System Status

### Three conflicting cost sources

| Source | File | Example: Viral Hook | Example: Agent | Example: LoRA |
|--------|------|---------------------|----------------|---------------|
| WORKSPACE_TOOLS | `registry.ts` | 3 | 5 (dynamic) | 10 (dynamic) |
| Canvas `baseCoins` | `canvas/toolApiSchema.ts` | 1 | 15 | 50 |
| Legacy pages | per-page constants | 3 (`VIRAL_HOOK_CREDIT_COST`) | — | page-specific |

### Dynamic cost calculation

Implemented in **`calculateToolCoins`** (`src/lib/canvas/coin-calculator.ts`):

- `flux-image`: `num_images`, aspect ratio → `highResCoins`
- `seedance-video`: duration, audio → `highResCoins` + duration surcharge
- `lora-training`: `training_steps` > 2000 → +5 per 500 steps

`ControlNode.tsx` line 347 flags dynamic label for seedance, flux, lora only.

### Server-side deduction

- Canvas: **optimistic** client deduct via `addCreditsOptimistic(-coins)` (`ControlNode.tsx` 198–200); server deduct on API routes (e.g. `/api/viral-hook/route.ts` line 85, `/api/generate-image/route.ts` line 166, `/api/agent/route.ts` line 462) via **`deductCredits`** → Supabase RPC **`deduct_credits`** (`src/lib/credits.ts` line 156).
- **Not mock** for canvas tools with `apiRoute`.
- Legacy pages use **`useOptimisticGeneration`** + server actions with their own deduct paths.
- Refund on failure: `shouldRefundCredits` + `addCreditsOptimistic(coins)` (`ControlNode.tsx` 265–266).

### Sidebar credit display inconsistency

- Canvas sidebar: “ab {baseCoins} **Coins**” (`CanvasSidebarContent.tsx` 126)
- Generate button: “**Credits**” (`ControlNode.tsx` 348)
- WORKSPACE registry formatter: “Credits” (`formatWorkspaceToolCredits`)

---

## 7. Build Health

### TypeScript

```text
npx tsc --noEmit
Exit code: 0
Error count: 0
```

### Production build

```text
npm run build
Exit code: 0
Next.js 16.2.7 — Compiled successfully
633 static/dynamic routes generated
```

### `any` usage in dashboard-v3

```text
grep "any" in src/components/dashboard-v3/ → No matches
grep "any" in src/lib/dashboard-v3/       → No matches
```

**Note:** `DynamicParamFields.tsx` and other v3 files are type-clean but unused.

---

## 8. Infinite Loop Risk Patterns

Searched `useEffect` + state updates in `src/components/dashboard-v3/` and `src/components/canvas/`.

| File | Lines | Pattern | Risk |
|------|-------|---------|------|
| `ParamFields.tsx` | 405–411 | `useEffect` cleanup revokes blob URLs on `[previews]` change | **Low** — cleanup only |
| `DynamicParamFields.tsx` | 246–252 | Same blob cleanup pattern | **Low** (dead code) |
| `AssetNode.tsx` | 42–51 | Status transition → `setJustCompleted` with timeout cleanup | **Low** |
| `CanvasTopUpOverlay.tsx` | 134–163 | Async fetch with `cancelled` flag | **Low** |
| `PipelineConnections.tsx` | 117–128 | RAF + scroll listener | **Low** — fixed pattern (no ref bump in callback) |
| `CanvasPanelStripView.tsx` | 65–74 | `setPanelRef` only mutates `Map` ref | **Low** — prior infinite-loop fix intact |
| `DashboardShell.tsx` (v3) | 41–115 | Multiple effects syncing route/models | **Medium** if mounted — **not active** |
| `GlobalSidebar.tsx` (v3) | 35–66 | Credit/name sync from Supabase | **Low** — not active |

**No high-risk “setState every render / missing deps loop” found** in active canvas path comparable to the historical `bumpRefs()` bug.

---

## 9. Mobile Readiness

### Canvas panel strip (`CanvasPanelStripView.tsx`)

- Layout: **horizontal scroll** only (`overflow-x-auto`, line 94).
- Panel width: `clamp(320px, 28vw, 420px)` (lines 116–117) — **no** single-column stack below `lg`.
- **No bottom-sheet** for panels on mobile — panels scroll sideways.
- Fit control: bottom-right “Fit to screen” button (lines 177–186).

### Sidebar / navigation

- **Desktop sidebar:** `CanvasSidebar` — `hidden md:flex` (`CanvasSidebar.tsx` line 9).
- **Mobile:** bottom **`CanvasMobileNav`** (fixed, `md:hidden`, lines 64–102) + **bottom sheet** tool picker (`CanvasMobileNav.tsx` 35–59) with full `CanvasSidebarContent`.
- **Hamburger equivalent:** “Tools” tab opens sheet — **OK**.

### dashboard-v3 (inactive)

- `GlobalSidebar`: flyout `-translate-x-full` / `lg:translate-x-0` (`GlobalSidebar.tsx` 107–110).
- `WorkspaceCanvas`: hamburger `lg:hidden` (lines 48–55) — not in production layout.

### Safe areas

- Canvas shell: `pb-[calc(4.5rem+env(safe-area-inset-bottom))]` on mobile (`CanvasShell.tsx` line 78).

---

## 10. PRIORITIZED ACTION LIST

### P0 — Broken / crashes / build errors

| # | Finding | Evidence |
|---|---------|----------|
| P0-1 | **Tool pages not rendered** — users hitting `/dashboard/script-generator`, intelligence tools, etc. see **empty canvas** | `CanvasShell.tsx` 63–91 omits `{children}`; `script-generator` not in `ROUTE_TO_TOOL_ID` |
| P0-2 | **Dual dashboard architectures** — v3 registry/sidebar disconnected from production Canvas | `dashboard-layout-client.tsx` → `CanvasShell` only |
| P0-3 | Build/tsc clean | No compile errors (verified) |

### P1 — Inconsistent UX across tools (credits, uploads, advanced toggle)

| # | Finding |
|---|---------|
| P1-1 | Credit costs disagree 3-way (WORKSPACE vs canvas vs legacy pages) — e.g. Produkt 75 vs 2, Agent 5 vs 15, LoRA 10 vs 50 |
| P1-2 | “Coins” vs “Credits” labeling in canvas sidebar vs generate button |
| P1-3 | Admin bypass still **red** (`text-red-400`) in sidebar/mobile — not `white/20` subtle |
| P1-4 | Duplicate progressive-disclosure toggles (`ControlNode` + nested `ParamFields`) |
| P1-5 | `QuickStartGuide` dead; `dashboard/page.tsx` is `null` — no onboarding grid |
| P1-6 | 40+ legacy tool UIs unmaintained in parallel with canvas panels |

### P2 — Missing pipeline / schema coverage

| # | Finding |
|---|---------|
| P2-1 | `DynamicParamFields` + `MODEL_SCHEMAS` (11 schemas) **unwired** — provider-accurate fields unused |
| P2-2 | `content-kalender` missing from `TOOL_OUTPUT_TYPE` — breaks pipeline chaining |
| P2-3 | Several tools lack input keys for declared `followUpTools` chains (produkt-werbung, agent) |
| P2-4 | `TOOL_CONFIGS` / `WORKSPACE_TOOLS` / canvas schema **three divergent** param models |
| P2-5 | Mega-menu links (upscaler, character-studio, gallery) not in canvas sidebar |

### P3 — Mobile / polish

| # | Finding |
|---|---------|
| P3-1 | Panel strip horizontal-only on 390px — no vertical stack / bottom sheet for active tool |
| P3-2 | Panel min width 320px + horizontal gap may feel cramped on small devices |
| P3-3 | Mega-menu English vs dashboard German |
| P3-4 | Remove or archive dead code: `DynamicParamFields`, `QuickStartGuide`, unused `DashboardShell` v3 |

---

## Appendix A — File reference index

| Concern | Primary files |
|---------|----------------|
| Active layout | `src/app/dashboard/dashboard-layout-client.tsx`, `src/components/canvas/CanvasShell.tsx` |
| Canvas tools schema | `src/lib/canvas/toolApiSchema.ts` |
| v3 registry | `src/lib/dashboard-v3/registry.ts` |
| Legacy tool configs | `src/lib/dashboard/tool-configs.ts` |
| Provider API schemas | `src/lib/api-schemas/toolApiSchema.ts` |
| Pipeline | `src/lib/dashboard-v3/usePipeline.ts`, `src/lib/canvas/pipeline-output.ts` |
| Generate + credits | `src/components/canvas/ControlNode.tsx`, `src/lib/canvas/canvas-generate-client.ts`, `src/lib/credits.ts` |
| Mega-menu | `src/lib/landing-features-mega-v2.ts` |
| Mobile nav | `src/components/canvas/CanvasMobileNav.tsx`, `src/components/canvas/CanvasPanelStripView.tsx` |

---

*End of audit — no code changes were made except creating this report.*

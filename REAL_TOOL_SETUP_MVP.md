# Real Tool Setup MVP (Phase 3A.1)

Audit date: 2026-06-16 · HEAD after `feat: implement real tool setup mvp`

Five MVP tools share the studio setup shell:

- Route: `/dashboard?tool=<toolId>` (SPA via `DashboardLayout`)
- Shell: `ProductionToolSetup.tsx` + `ProductionToolSetupBody.tsx`
- Legacy dedicated pages exist but redirect into SPA (`LegacyToolRedirect`)

## Summary

| Tool ID | Route | Provider / API | Credits (existing) | Execution | Gallery |
|---------|-------|----------------|-------------------|-----------|---------|
| `image-gen` | `?tool=image-gen` | `POST /api/generate-image` (FAL Flux/Krea) | 5 standard / 8 high-res (`IMAGE_GEN_CREDITS`) | **Live** | **Yes** (`createGenerationRecord`) |
| `img-to-video` | `?tool=img-to-video` · alias `image-to-video` | `GET /api/seedance/models` · `POST /api/akool/image-to-video` · poll `/api/akool/status` | Dynamic (`calculateAkoolModelCredits`) | **Live** (URL input, no file upload) | **Yes** (Akool job → generation record) |
| `text-to-video` | `?tool=text-to-video` | `GET/POST /api/akool/text-to-video` · poll `/api/akool/status` | Ab 50 fallback (`AKOOL_TOOL_CREDITS.textToVideo`) + model/duration | **Live** | **Yes** (Akool job) |
| `viral-hook` | `?tool=viral-hook` | Server action `extractViralHook` (Anthropic) | 3 (`VIRAL_HOOK_CREDIT_COST`) | **Live** | Inline only (generation log, not media gallery) |
| `content-calendar` | `?tool=content-calendar` | Server action `generateContentCalendar` (Anthropic) | 5 (`CONTENT_CALENDAR_CREDIT_COST`) | **Live** | Inline only (generation log, not media gallery) |

No invented models, prices, or providers.

---

## 1. image-gen

**Options (from existing constants):**

- Prompt (required)
- Format: `PLATFORM_FORMATS` subset 1:1, 9:16, 16:9
- Quality: Standard / High Resolution → `highRes` flag on API

**Submit path:** `fetch("/api/generate-image", { prompt, platform, highRes })`

**States:** loading banner, inline error, NoCredits via 402 + `handleApiInsufficientCredits`, success preview + gallery note.

**Gaps:** No in-setup model picker (API defaults to `DEFAULT_IMAGE_MODEL_ID`). Style presets exist server-side but not exposed in MVP setup UI.

---

## 2. img-to-video

**Options (async from API):**

- Startbild: public image URL (no upload pipeline in setup)
- Motion prompt
- Model list: `mergeSzenenGeneratorModels` from `/api/seedance/models`
- Duration / resolution per selected model

**Submit path:** `POST /api/akool/image-to-video` → `useAkoolJobPoll` (`image2video`)

**States:** models loading/empty, job polling loading, poll errors, NoCredits on 402.

**Gaps:** File upload not wired; user must paste URL (e.g. from gallery). Requires FAL/Akool env for models.

---

## 3. text-to-video

**Options (async from API):**

- Scene description
- Model / duration / resolution from `GET /api/akool/text-to-video`

**Submit path:** `POST /api/akool/text-to-video` → poll `text2video`

**States:** same pattern as img-to-video.

**Gaps:** Requires Akool configured; empty model list shows clear empty state.

---

## 4. viral-hook

**Options:**

- Source: topic (manual, min 20 chars) or YouTube link
- Optional niche

**Submit path:** `extractViralHook` server action

**Output:** Hook + adapted niche + why viral (inline). Copy button exports full text.

**Gaps:** No platform/tonality/variant count in API — not shown. Not listed in media gallery (`GALLERY_PERSISTED_TOOL_IDS`).

---

## 5. content-calendar

**Options:**

- Niche / topic (required)
- Platform: Instagram, TikTok, YouTube Shorts, LinkedIn
- Posting rhythm: daily / 3× week / weekly (30-day plan)

**Submit path:** `generateContentCalendar` server action

**Output:** Summary + first 8 day cards; full plan via copy (`calendarToExportText`).

**Gaps:** No separate “goal” field in API. Not media gallery.

---

## UI states (all five)

Shared components in `ProductionToolSetupStates.tsx`:

- **Empty:** field helpers / model empty messages
- **Loading:** `SetupLoadingBanner` (generation + model fetch)
- **Error:** `SetupErrorBanner` (sanitized messages; credit errors → `NoCreditsModal`)
- **Success:** `SetupResultPanel` with optional copy + gallery/inline note
- **NoCredits:** `handleApiInsufficientCredits` / `handleGenerationCreditError` → global modal

---

## Hydration flash

**Fix:** `DashboardStudioSpa` reads `?tool=` via `resolveDashboardToolFromQuery` and passes `bootstrapTool` to `DashboardLayout` initial state.

**Remaining:** Redirect params (`gallery`, `settings`) still resolve briefly before `useEffect` redirect — low impact.

---

## Open gaps (not blocking MVP)

1. Image-gen: optional style/model picker from existing server config
2. img-to-video: file upload when existing upload path is product-ready
3. Text tools: optional save-to-notes / gallery text assets
4. Tool setup: prefill prompt from gallery re-prompt flow (partially exists in `DashboardLayout.handleRePrompt`)

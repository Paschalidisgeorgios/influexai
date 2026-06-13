# Tool Options Audit — 2026-06-03

Read-only audit of all **15 active canvas tools** in `src/lib/canvas/toolApiSchema.ts`, rendered via `ControlNode` → `ParamFields` (`src/components/canvas/ParamFields.tsx`), plus **Gallery / Studio Archiv** route status.

Cross-referenced against: production API routes (`src/app/api/**`), `src/lib/canvas/canvas-generate-client.ts`, pipeline wiring (`src/lib/dashboard-v3/usePipeline.ts`, `src/lib/canvas/pipeline-output.ts`), gallery data layer (`src/app/actions/get-gallery.ts`, `src/lib/gallery-media.ts`), and verified provider schemas in `src/lib/api-schemas/toolApiSchema.ts` (`MODEL_SCHEMAS`).

**Rendering path:** `dashboard-layout-client.tsx` → `CanvasShell` → (canvas mode) `InfiniteCanvas` / `CanvasPanelStripView` → embedded `ControlNode` → `ParamFields` / `AgentAutopilotNodeExtras`. Legacy `src/app/dashboard/[tool]/page.tsx` files are **not mounted** when the route is in `ROUTE_TO_TOOL_ID`.

**Upload UI:** Active canvas uses inline `FileUploadField` inside `ParamFields.tsx` (lines 375–524) — drag-and-drop + file picker with pipeline asset drop. `DynamicParamFields` / dashboard-v3 `UploadField` are **not** used in production canvas.

---

## Gallery / Studio Archiv Status

### Route & CanvasShell mode

| Check | Finding | Location |
|-------|---------|----------|
| Gallery page exists | ✅ `src/app/dashboard/gallery/page.tsx` (396 lines) | — |
| In `ROUTE_TO_TOOL_ID` | ✅ **Excluded** — no `/dashboard/gallery` entry | `toolApiSchema.ts` lines 648–670 |
| In `LEGACY_CHILD_ROUTES` | ✅ **Excluded** — not listed | `CanvasShell.tsx` lines 18–28 |
| Content-mode branch | ✅ **Works** — `resolveToolIdFromPath("/dashboard/gallery")` returns `null` → `showContentMode = true` | `CanvasShell.tsx` lines 68–70, 94–105 |
| Panel auto-spawn | ✅ **Skipped** — `useEffect` returns early when `showContentMode` | `CanvasShell.tsx` lines 72–73 |
| Explicit `grep gallery CanvasShell` | No matches — exclusion is **implicit** via absent `ROUTE_TO_TOOL_ID` mapping, not a dedicated allowlist entry | `CanvasShell.tsx` (entire file) |

**Verdict:** Route is **not broken** (no 404). Page renders inside `StudioChrome` with scrollable `{children}` — sidebar + mobile nav chrome remain visible.

### Nav links

| Location | Gallery / Studio Archiv link? |
|----------|------------------------------|
| `CanvasSidebarContent.tsx` | ❌ **Missing** — only `TOOL_CATEGORIES` tool spawn buttons (lines 67–138) + Settings/Credits (lines 170–183) |
| `CanvasMobileNav.tsx` | ❌ **Missing** — Tools sheet, Credits, Settings only (lines 69–101) |
| `CanvasHeader.tsx` | ❌ No gallery link |
| `src/lib/dashboard-v3/registry.ts` | ✅ Entry `studio-archiv` → `/dashboard/gallery` (lines 408–414) — **not consumed by canvas sidebar** |
| `src/lib/dashboard-product-tools.ts`, `landing-features-menu.ts` | ✅ Links exist elsewhere in app — not in active canvas nav |

**Verdict:** **P0 nav gap** — users in canvas workspace cannot discover Gallery without knowing the URL or using external links.

### Data source & empty-state behavior

**Fetcher:** `GalleryPage` calls server action `getGallery()` (`gallery/page.tsx` lines 90–95).

**Tables queried** (`get-gallery.ts`):

| Filter | Supabase table(s) |
|--------|-------------------|
| `all` / `script` | `saved_scripts` |
| `all` / `thumbnail` | `thumbnail_concepts` |
| `all` / `niche` | `niche_saves` |
| `all` / `outlier` | `outlier_results` |
| `all` / `remix` | `remix_results` |
| `all` / `image` / `video` | `generations` (filtered by `isImageGenerationType` / `isVideoGenerationType` in `normalizeGeneration`) |

**Why Gallery can appear empty for canvas users:**

1. **Nav missing** — users never reach the page (see above).
2. **Text/calendar canvas outputs not displayed** — `viral-hook`, `content-kalender`, `premium-script` insert into `generations` with types like `viral-hook-extraktor`, `content-kalender-tool`, `premium-script`, but `normalizeGeneration()` returns `null` for non-media types (`get-gallery.ts` lines 118–177, `gallery-media.ts` lines 48–83).
3. **Scripts from canvas** — `script-generator` / `trend-script` use `/api/generate` → `generations` type `premium-script`, **not** `saved_scripts` — **Script filter empty** for canvas-only users.
4. **Melodia / agent** — no `generations` insert from canvas API paths; agent may insert via `execute-tool.ts` server-side only when agent run succeeds.
5. **LoRA training** — writes `lora_models` only (`skipGenerationLog: true`) — never appears in Gallery.
6. **Ki-Ich type mismatch** — API saves type `lora_generation`; `isImageGenerationType()` does **not** match that string (`gallery-media.ts` lines 48–56) → images may be **in DB but invisible** in Gallery grid.

**Verdict:** Page **works** when populated by legacy flows (image-generator page, Akool async jobs, etc.). Canvas-only workflows often produce **no visible Gallery items** even when API routes insert rows — type/filter mismatch + missing nav.

---

## Summary Table

| Tool | Current Fields | Has Upload? | Should Have Upload? | Missing Params | Saves to Gallery? | Priority |
|------|----------------|-------------|---------------------|----------------|-----------------|----------|
| viral-hook | 3 (string/select×2) | No | No | Optional raw input | Partial — `generations` insert, **not shown** in Gallery UI | P1 |
| content-kalender | 3 (string/select/string) | No | No | **Field names ≠ API** | Partial — `content-kalender-tool` row, **not shown** | **P0** |
| script-generator | 4 (textarea/select×3) | No | No | `sprache` unused; no platform | Partial — `premium-script` in `generations`, **not in Script tab** | P1 |
| trend-script | 3 (string/select/textarea) | No | No | No `plattform`; wrong API path | Same as script-generator | P1 |
| produkt-werbung | 3 (string/textarea/select) | No | Yes (product photo for video ads) | audience/platform/style; no image | **No** — script route has no DB insert | **P0** / P1 |
| flux-image | 4 (textarea/select/slider/select) | No | Yes (optional ref/edit) | highRes, seed, ref images | **Yes** — `generations` type `image` | P1 |
| ki-ich | 4 (textarea/string×2/node-ref) | node-ref only | Yes (character picker) | **`characterId`**; wrong `model_id` key | **Broken visibility** — type `lora_generation` not in gallery filter | **P0** |
| lora-training | 3 (file/string/number) | ZIP file UI | Yes (dataset) | zipUrl/sessionId/name/type upload pipeline | **No** — `lora_models` only | **P0** |
| seedance-video | 5 (textarea/slider/boolean/file-list/node-ref) | file-list | Yes (start + refs) | **`modelId`**, resolution, aspect_ratio | **Yes** when API succeeds — type `seedance` | **P0** |
| video-transformer | 3 (node-ref/select/slider) | node-ref only | Yes (input video) | stylePrompt mapping; no direct upload | **Yes** — `akool-video-editor` (async) | **P0** standalone |
| video-uebersetzer | 4 (node-ref/select/boolean/number) | node-ref only | Yes (input video) | language codes; source_language | **Yes** — `akool-video-translation` | **P0** standalone |
| avatar-studio | 3 (string/textarea/string) | No | Yes (source image + driving video) | Two-step job API | **No** from canvas — `avatar_render_jobs` only | **P0** |
| lipsync-studio | 2 (node-ref×2) | node-ref only | Yes (video + audio) | direct uploads; JSON key mapping | **Yes** — `akool-lipsync` when URLs valid | **P0** standalone |
| melodia-studio | 3 (textarea/select/number) | No | No (chat API) | **`prompt` vs `message`**; SSE | **No** | **P0** |
| agent-autopilot | 5 (+ advanced extras) | file (advanced) | Optional ref ✓ | **`campaign_goal` vs `message`**; SSE | Agent sub-tools may insert; canvas panel **no direct save** | **P0** |

---

## Per-Tool Detail

### Viral Hook (`viral-hook`)

**Current fields** (`toolApiSchema.ts` lines 95–118):

| Key | Type | Label | Options / range |
|-----|------|-------|-----------------|
| `nische` | string (required) | Nische | placeholder |
| `plattform` | select | Plattform | TikTok, Reels, Shorts |
| `tonfall` | select | Tonfall | aggressiv, neugierig, story |

**Upload status:** None — text-only API (`POST /api/viral-hook`, body `{ input }`).

**Missing parameters vs API:** N/A (Anthropic). Canvas maps fields → `input` in `canvas-generate-client.ts` lines 59–68.

**Pipeline input types:** Output `text`. Downstream `trend-script.script_input` accepts inherited `text`/`script` (`PIPELINE_COMPATIBILITY.script_input`).

**UI rendering:** Primary: `nische`. Advanced (ParamFields): `plattform`, `tonfall`. Selects OK. No inherited badge on this tool.

**Gallery persistence:** API inserts `generations` type `viral-hook-extraktor` (`viral-hook/route.ts` lines 111–117). **Not visible** in Gallery — `normalizeGeneration` returns null (no image/video/audio). Result shown **in-panel only** (asset node text).

**Recommendation:** P1 — optional raw hook/URL textarea; align platform options with `CONTENT_KALENDER_PLATFORMS`. P1 — map to `saved_scripts` or dedicated text gallery type if archival desired.

---

### Content Kalender (`content-kalender`)

**Current fields** (lines 134–147):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `monat` | string (required) | Monat | e.g. März 2026 |
| `post_frequenz` | select | Post-Frequenz | täglich, 3× pro Woche |
| `zielgruppe` | string (required) | Zielgruppe | |

**Upload status:** None — not required.

**Missing parameters vs API:** **P0 mismatch.** API expects `{ nische, plattform, frequenz }` (`content-kalender/route.ts` lines 22–41). Valid frequencies: `3x_woche`, `5x_woche`, `taeglich` (`content-kalender-tool.ts` lines 20–24). Canvas sends wrong keys via default `{ ...params }` in `canvas-generate-client.ts` line 96.

**Pipeline input types:** Schema `outputType: "calendar"` but `TOOL_OUTPUT_TYPE` = `"text"` (`usePipeline.ts` line 31) — downstream gets plain text, not structured entries.

**UI rendering:** All fields primary. No upload. No pipeline inputs.

**Gallery persistence:** Inserts `generations` type `content-kalender-tool` (`content-kalender/route.ts` lines 139–145). **Not visible** in Gallery grid. In-panel `data` object only.

**Recommendation (P0):** Rename/remap to `nische`, `plattform`, `frequenz`. Fix `TOOL_OUTPUT_TYPE` to structured JSON for pipeline.

---

### Script Generator (`script-generator`)

**Current fields** (lines 197–240):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `topic` | textarea (required) | Thema / Prompt | |
| `video_laenge` | select | Video-Länge | 15s, 30s, 60s, 180s |
| `tonfall` | select | Ton / Stil | energetisch, informativ, unterhaltsam, dramatisch |
| `sprache` | select | Sprache | de, en, bilingual |

**Upload status:** None.

**Missing parameters vs API:** `/api/generate` accepts `topic`, `videoLength`, `tone`, `toolId` — **`sprache` / `language` not wired** in `canvas-generate-client.ts` lines 70–77. No platform field (legacy pages have platform).

**Pipeline input types:** Output `script`. No upstream fields in schema.

**UI rendering:** `topic` primary; others in ParamFields advanced block (ControlNode also splits primary/advanced lines 357–517).

**Gallery persistence:** `/api/generate` inserts `generations` type `premium-script` (`generate/route.ts` lines 162–172). **Not in Gallery Script tab** (`saved_scripts` not written). **Not in image/video filters.**

**Recommendation:** P1 — wire `sprache`; optionally insert `saved_scripts` for Gallery Script filter.

---

### Trend Script (`trend-script`)

**Current fields** (lines 162–182):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `trend_thema` | string (required) | Trend-Thema | |
| `video_laenge` | select | Video-Länge | 30s, 60s, 90s |
| `script_input` | textarea | Hook / Vorlage | accepts pipeline `text` |

**Upload status:** None.

**Missing parameters vs API:** Uses `/api/generate` (not `/api/trend-script`). Mapping sends `platform: params.plattform ?? "TikTok"` but **`plattform` not in schema** (`canvas-generate-client.ts` lines 87–94). Dedicated `/api/trend-script` also inserts `generations` (`trend-script/route.ts` line 167).

**Pipeline input types:** `script_input` inherits `text`/`script` ✓ (`PIPELINE_COMPATIBILITY.script_input`).

**UI rendering:** Inherited badge on `script_input` when upstream hook connected. "Pipeline neu verbinden ↩" when disconnected (`ParamFields.tsx` lines 115–132).

**Gallery persistence:** Same as script-generator (`premium-script` via `/api/generate`).

**Recommendation:** P1 — add `plattform` select; clarify single API route.

---

### Produkt-Werbung (`produkt-werbung`)

**Current fields** (lines 255–268):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `produkt_name` | string (required) | Produktname | |
| `usps` | textarea (required) | USPs | |
| `werbe_ziel` | select | Werbeziel | conversion, branding |

**Upload status:** **Missing** — no product image field.

**Missing parameters vs API:** Script route requires `audience` (mapped from missing `zielgruppe` → defaults `"Allgemein"`) (`canvas-generate-client.ts` lines 78–86, `product-ad/script/route.ts` lines 52–64). **`style` / `platform` partially defaulted.** Video ad path (`/api/product-ad/generate`) needs product image — **not reachable from canvas**.

**Pipeline input types:** Output registered as `script` in pipeline but schema `outputType: "text"`.

**UI rendering:** Standard text fields. No upload.

**Gallery persistence:** **No** — `product-ad/script/route.ts` returns JSON only, no DB insert (lines 97–101).

**Recommendation (P0):** Product photo upload + wire video ad route. P1 — add audience, platform, style fields.

---

### Bild Generator / FLUX (`flux-image`)

**Current fields** (lines 290–325):

| Key | Type | Label | Options / range |
|-----|------|-------|-----------------|
| `prompt` | textarea (required) | Beschreibung | |
| `aspect_ratio` | select | Seitenverhältnis | 1:1, 16:9, 9:16, 4:3 |
| `num_images` | slider | Anzahl Bilder | 1–4, step 1 |
| `style_preset` | select | Stil | ugc, editorial, cinematic, product |

**Upload status:** **Missing** — no reference/edit image upload. FLUX 2 supports optional `image_url` / multi-ref for edit (`SEEDANCE_2_T2V`-level refs in fal docs; `FLUX_2_PRO` / `FLUX_2_FLEX` in `MODEL_SCHEMAS` — no edit schema in file, but `image-generator-fal.ts` line 197 supports `image_url` for edit flows).

**Missing parameters vs API:** `highRes`, `seed`, `negativePrompt` supported by `/api/generate-image` (lines 57–78) but not in canvas schema. **`num_images` not sent** — client always generates one (`canvas-generate-client.ts` lines 42–48). `MODEL_SCHEMAS` FLUX: `image_size`, `output_format`, `guidance_scale` (Flex), `seed`.

**Pipeline input types:** Output `image_url`. Downstream `seedance-video.images_list`, `ki-ich.reference_image` (partial).

**UI rendering:** `prompt` primary; aspect_ratio, num_images, style in advanced. Sliders/selects OK.

**Gallery persistence:** **Yes** — `createGenerationRecord` type `image` (`generate-image/route.ts` lines 214–234). Visible in Gallery **image** filter when generation completes.

**Recommendation:** P1 — wire `num_images`, `highRes`; P1 — optional reference image upload for edit mode.

---

### KI-Ich (`ki-ich`)

**Current fields** (lines 340–350):

| Key | Type | Label | Type |
|-----|------|-------|------|
| `prompt` | textarea (required) | Szene beschreiben | |
| `model_id` | string | Avatar-Klon | placeholder only |
| `kleidungs_stil` | string | Kleidungsstil | |
| `reference_image` | node-ref | Referenzbild | accepts `image` |

**Upload status:** **node-ref only** — no character picker, no direct upload. API requires **`characterId`** (`ki-influencer/generate/route.ts` lines 49–58).

**Missing parameters vs API:** Canvas sends `model_id`; API expects `characterId`. `kleidungs_stil` not in API. Reference image not consumed by generate route.

**Pipeline input types:** `reference_image` **not in `PIPELINE_COMPATIBILITY`** — no auto-inheritance badge (`usePipeline.ts` lines 14–27).

**UI rendering:** node-ref drag zone (`ParamFields.tsx` lines 200–217). No LoRA/character dropdown.

**Gallery persistence:** API saves `generations` type **`lora_generation`** (`ki-influencer/generate/route.ts` lines 127–145). **`isImageGenerationType("lora_generation")` = false** → **invisible in Gallery** despite successful save.

**Recommendation (P0):** Character selector → `characterId`. P1 — fix gallery type mapping or extend `isImageGenerationType`. P2 — add `reference_image` to `PIPELINE_COMPATIBILITY`.

---

### LoRA Training (`lora-training`)

**Current fields** (lines 365–369):

| Key | Type | Label | Options / range |
|-----|------|-------|-----------------|
| `dataset_zip` | file (required) | Dataset (ZIP) | |
| `trigger_word` | string (required) | Trigger-Wort | |
| `training_steps` | number | Training Steps | 500–5000, default 2000 |

**Upload status:** **UI present** (`FileUploadField`) but **broken end-to-end** — stores `File` object in params; `runCanvasGeneration` JSON.stringify fails / sends unusable payload.

**Missing parameters vs API:** API requires `{ name, triggerWord, type, zipUrl, sessionId, thumbnailPath?, imageCount, steps }` (`lora/train/route.ts` lines 28–59). Canvas sends `{ dataset_zip: File, trigger_word, training_steps }`.

**Pipeline input types:** Output `json` (trained model metadata) — not useful for media pipeline.

**UI rendering:** Working drag-and-drop ZIP UI (`ParamFields.tsx` FileUploadField). No upload-to-storage step before API.

**Gallery persistence:** **No** — inserts `lora_models` only (`lora/train/route.ts` lines 106–122, `skipGenerationLog: true`).

**Recommendation (P0):** Multi-step: upload images → build ZIP → `zipUrl` + `sessionId` → train API.

---

### Szenen Generator / Seedance (`seedance-video`)

**Current fields** (lines 385–409):

| Key | Type | Label | Options / range |
|-----|------|-------|-----------------|
| `prompt` | textarea (required) | Szenen-Beschreibung | |
| `duration` | slider | Dauer (Sek.) | 4–15, default 8 |
| `generate_audio` | boolean | Audio generieren | default true |
| `images_list` | file-list | Referenzbilder (bis 4) | accepts pipeline `image` |
| `script_ref` | node-ref | Skript / Voiceover | accepts `text` |

**Upload status:** **file-list UI present** — Files not converted to URLs before POST. API **requires** `imageUrl` + **`modelId`** (`seedance/route.ts` lines 37–53).

**Missing parameters vs `MODEL_SCHEMAS` (`SEEDANCE_2_T2V`):** `aspect_ratio`, `resolution`, `reference_images` (multi), `seed`. Canvas sends only first image as `imageUrl` (`canvas-generate-client.ts` lines 49–57). **`generate_audio` sent but seedance route doesn't read it** (Akool image-to-video path).

**Pipeline input types:** `images_list` → `image_url` compat ✓. `script_ref` → text ✓. Inherited URL strings work **if** upstream flux panel produced URL in asset node.

**UI rendering:** file-list uses working FileUploadField; boolean toggle OK; slider OK. Pipeline badge on compatible fields.

**Gallery persistence:** **Yes** when job completes — `generations` type `seedance` (`seedance-generate.ts`). Visible in **video** filter.

**Recommendation (P0):** Upload files to storage/fal; add `modelId` select (from `/api/seedance/models`). P1 — resolution, aspect_ratio, multi-ref.

---

### Video Transformer (`video-transformer`)

**Current fields** (lines 424–452):

| Key | Type | Label | Options / range |
|-----|------|-------|-----------------|
| `input_video` | node-ref (required) | Input Video | accepts video, image |
| `transform_stil` | select | Transform-Stil | Anime, Cyberpunk, 3D-Pixar |
| `motion_strength` | slider | Motion Strength | 0–100, default 50 |

**Upload status:** **node-ref only** — no direct `video_upload`. **P0 for standalone use.**

**Missing parameters vs API:** API expects `{ video_url, style_prompt, strength }` (`akool/video-to-video/route.ts` lines 24–47). Canvas default `{ ...params }` sends **`input_video`, `transform_stil`, `motion_strength`** — **wrong keys, wrong style format** (preset label vs free-text `style_prompt`).

**Pipeline input types:** `input_video` → `video_url` ✓ when upstream video panel exists.

**UI rendering:** Required node-ref primary. Select + slider in advanced. Inherited badge when pipeline connected.

**Gallery persistence:** **Yes** — `runAkoolAsyncPost` → `generations` type `akool-video-editor`. Async poll completes → video in Gallery.

**Recommendation (P0):** Map params in `canvas-generate-client.ts`; add direct video upload. P1 — style prompt field vs preset mapping.

---

### Video Übersetzer (`video-uebersetzer`)

**Current fields** (lines 466–495):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `input_video` | node-ref (required) | Input Video | accepts video |
| `ziel_sprache` | select | Zielsprache | Englisch, Spanisch, Französisch, Japanisch |
| `lipsync_correction` | boolean | Lipsync-Korrektur | default true |
| `duration_minutes` | number | Video-Länge (Min.) | 1–30 |

**Upload status:** **node-ref only** — no direct video upload.

**Missing parameters vs `AKOOL_VIDEO_TRANSLATION`:** API uses `target_language` codes (`en`, `de`, …) — canvas sends **German display names** (`Englisch`, …). Missing `source_language`, `voice_clone`, `resolution`.

**Pipeline input types:** `input_video` → `video_url` ✓.

**UI rendering:** OK for selects/toggles. Pipeline badge on video field.

**Gallery persistence:** **Yes** — `akool-video-translation` via async route.

**Recommendation (P0):** Language code mapping + video upload. P1 — source_language, voice_clone.

---

### Avatar Studio (`avatar-studio`)

**Current fields** (lines 510–520):

| Key | Type | Label | |
|-----|------|-------|---|
| `avatar_id` | string | Avatar | placeholder |
| `audio_script` | textarea (required) | Skript / Audio | accepts text, audio |
| `background_scene` | string | Hintergrund-Szene | |

**Upload status:** **Missing** — API is two-step: `POST /api/avatar/create-job` (source image + driving video URLs) then `POST /api/avatar/start-render` (`jobId`) (`create-job/route.ts` lines 18–32, `start-render/route.ts` lines 27–48).

**Missing parameters vs `AKOOL_TALKING_AVATAR` / live-portrait:** `voice_id`, `resolution`, duration/subtitles from `AvatarRenderOptions`. Canvas calls **`start-render` only** with wrong body.

**Pipeline input types:** `audio_script` inherits text/script/audio_url ✓.

**UI rendering:** Text fields only — no media upload, no job status UI.

**Gallery persistence:** **No** from canvas path — jobs in `avatar_render_jobs`; final video may land in `generations` only after render pipeline (not triggered by canvas).

**Recommendation (P0):** Full create-job + upload flow; avatar picker; poll render status.

---

### Lipsync Studio (`lipsync-studio`)

**Current fields** (lines 534–548):

| Key | Type | Label |
|-----|------|-------|
| `input_video` | node-ref (required) | Video |
| `input_audio` | node-ref (required) | Neue Stimme |

**Upload status:** **node-ref only** — API requires **`video_url` + `audio_url`** (`akool/lipsync/route.ts` lines 24–31). Matches `AKOOL_LIPSYNC` (`target_video` / `input_audio` in MODEL_SCHEMAS — key names differ).

**Missing parameters vs API:** `faceswap_quality`, `lipsync` toggle. Canvas sends `input_video` / `input_audio` — **not mapped** to API keys.

**Pipeline input types:** Both fields in `PIPELINE_COMPATIBILITY` ✓.

**UI rendering:** Dual required node-refs — primary. Pipeline badges when connected.

**Gallery persistence:** **Yes** — `akool-lipsync` async generation when URLs valid.

**Recommendation (P0):** Param mapping + direct video/audio upload. P1 — quality toggle.

---

### Melodia Studio (`melodia-studio`)

**Current fields** (lines 564–579):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `prompt` | textarea (required) | Musik / SFX Beschreibung | |
| `duration` | select | Dauer | 10s, 30s, 60s, 120s |
| `bpm` | number | BPM | 60–180, default 120 |

**Upload status:** None — chat-based API.

**Missing parameters vs API:** **`POST /api/melodia` expects `{ message }`** (`melodia/route.ts` lines 18–42). Canvas sends `{ prompt, duration, bpm }` via default spread. Response is **SSE stream** — `runCanvasGeneration` expects JSON (`canvas-generate-client.ts` lines 200–213).

**Pipeline input types:** Output `audio_url` — melodia chat may not produce direct audio URL in canvas handler.

**UI rendering:** Standard textarea/select/number. No SSE progress UI.

**Gallery persistence:** **No** — no `generations` insert in melodia route.

**Recommendation (P0):** Map `prompt` → `message`; implement SSE client. P2 — duration/BPM only if music gen API added.

---

### Agent Autopilot (`agent-autopilot`)

**Current fields** (lines 594–631 + `AgentAutopilotNodeExtras`):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `campaign_goal` | textarea (required) | Kampagnen-Ziel | |
| `ai_model` | select | KI-Modell | claude, flux, kling, seedance (advanced) |
| `reference_image` | file | Referenzbild | advanced — custom upload in extras |
| `platforms` | multiselect | Plattformen | TikTok, Instagram, YouTube, LinkedIn |
| `automation_level` | select | Automatisierung | vollautomatisch, review-required |

**Upload status:** Optional reference image in **`AgentAutopilotNodeExtras`** (data URL, lines 33–46) — not standard FileUploadField; **not sent to API**.

**Missing parameters vs API:** **`campaign_goal` → `message`** required (`agent/route.ts` lines 83–86). SSE stream not parsed. `platforms`, `automation_level`, `ai_model` unused by `/api/agent`.

**Pipeline input types:** Output `agent` / registered as `script` in `TOOL_OUTPUT_TYPE`.

**UI rendering:** Duplicate "Erweiterte Einstellungen" (ControlNode lines 461–516 + ParamFields internal). Multiselect chips OK.

**Gallery persistence:** Agent executor may insert `generations` per sub-tool (`agent/execute-tool.ts` line 122) — **not guaranteed from canvas single POST**. No canvas-side `generations-updated` event dispatch.

**Recommendation (P0):** SSE agent runner; map `campaign_goal` → `message`. P1 — wire or remove unused schema fields.

---

## P0 — Gallery route/nav/data issues

| Issue | Evidence |
|-------|----------|
| **No Gallery link in canvas sidebar** | `CanvasSidebarContent.tsx` — no `/dashboard/gallery` Link |
| **No Gallery link in mobile nav** | `CanvasMobileNav.tsx` lines 64–101 |
| **Canvas text outputs invisible in Gallery** | `normalizeGeneration` null for `viral-hook-extraktor`, `content-kalender-tool`, `premium-script` |
| **Script filter empty for canvas scripts** | `/api/generate` → `generations`, not `saved_scripts` |
| **Ki-Ich images invisible** | Type `lora_generation` not matched by `isImageGenerationType()` |
| **Route itself works** | Content mode in `CanvasShell.tsx` lines 94–105; page loads `getGallery()` |

---

## P0 — Tools unusable without missing upload / broken API wiring

| Tool | Issue | Evidence |
|------|-------|----------|
| **content-kalender** | Field names don't match API | `toolApiSchema.ts` vs `content-kalender/route.ts` |
| **ki-ich** | `characterId` required; canvas sends `model_id` | `ki-influencer/generate/route.ts` |
| **lora-training** | File object in JSON; no zipUrl/session upload | `lora/train/route.ts`, `canvas-generate-client.ts` |
| **seedance-video** | Missing `modelId`; imageUrl required; Files not uploaded | `seedance/route.ts` lines 42–53 |
| **video-transformer** | No video upload; params not mapped | `akool/video-to-video/route.ts` |
| **video-uebersetzer** | No video upload; wrong language values | `akool/video-translation/route.ts` |
| **avatar-studio** | No image/video upload; wrong single-step API | `avatar/create-job`, `start-render` |
| **lipsync-studio** | Wrong JSON keys vs API | `akool/lipsync/route.ts` |
| **melodia-studio** | `prompt` vs `message`; SSE not handled | `melodia/route.ts` |
| **agent-autopilot** | `campaign_goal` vs `message`; SSE not handled | `agent/route.ts` |
| **produkt-werbung** | No product image for video ad path | `/api/product-ad/generate` (not wired) |

Standalone pipeline-only video tools (transformer, übersetzer, lipsync) are **P0** when no upstream panel provides URLs.

---

## P1 — Tools missing important parameters

| Tool | Gaps |
|------|------|
| **viral-hook** | Optional raw input / URL mode |
| **script-generator** | `sprache`, platform, Gallery script save |
| **trend-script** | `plattform` select |
| **produkt-werbung** | Audience, platform, style; Gallery save for scripts |
| **flux-image** | `highRes`, `num_images`, reference/edit images, seed |
| **seedance-video** | `resolution`, `aspect_ratio`, multi-ref, model picker |
| **video-transformer** | `stylePrompt` mapping |
| **video-uebersetzer** | `source_language`, `voice_clone`, `resolution` |
| **avatar-studio** | `AvatarRenderOptions` (duration, resolution, subtitles) |
| **lipsync-studio** | `faceswap_quality` |
| **agent-autopilot** | Wire or remove unused schema fields |

---

## P1 — Generations not persisted to Gallery

| Tool | API behavior | Gallery visibility |
|------|--------------|-------------------|
| **viral-hook** | Inserts `generations` | Hidden (non-media type) |
| **content-kalender** | Inserts `generations` | Hidden |
| **script-generator / trend-script** | Inserts `premium-script` | Hidden; not in Script tab |
| **produkt-werbung** | No insert | None |
| **lora-training** | `lora_models` only | None |
| **melodia-studio** | No insert | None |
| **avatar-studio** | `avatar_render_jobs` | None from canvas |
| **ki-ich** | Inserts `lora_generation` | **Broken filter** — row exists, UI skips |
| **agent-autopilot** | Partial via sub-tools | Unreliable from canvas panel |
| **flux-image, seedance, Akool tools** | Inserts + async finalize | **Visible** when job completes |

---

## P2 — Pipeline image/video inheritance gaps

| Gap | Details | Files |
|-----|---------|-------|
| **`reference_image` not in `PIPELINE_COMPATIBILITY`** | `ki-ich.reference_image` won't auto-inherit | `usePipeline.ts` lines 14–27 |
| **`content-kalender` output type** | Schema `calendar` but pipeline registers `text` | `usePipeline.ts` line 31 |
| **`produkt-werbung` output type** | Schema `text`, pipeline `script` | `usePipeline.ts` line 34 |
| **node-ref without compat key** | Only keys in `PIPELINE_COMPATIBILITY` get badge | `ParamFields.tsx` lines 61–68 |
| **File fields + pipeline** | `images_list` compat exists; value may be single URL not array | `canvas-generate-client.ts` lines 49–57 |
| **Asset drag-drop** | Sets `asset.text ?? asset.url` | `ControlNode.tsx` lines 454–457 |
| **Multi-panel order** | Inheritance only from panels left of current | `getInheritedValue` slice logic |

Pipeline **does** support: `image_url` → `images_list`, `video_url` → `input_video`, `audio_url` → `input_audio`, `text`/`script` → script fields when keys match.

---

## Appendix — Architecture references

| File | Role |
|------|------|
| `src/lib/canvas/toolApiSchema.ts` | 15 tools, params, `ROUTE_TO_TOOL_ID` |
| `src/lib/canvas/tool-credit-costs.ts` | `CANVAS_TOOL_BASE_COINS`, dynamic calculators |
| `src/lib/canvas/canvas-generate-client.ts` | HTTP client + param mapping (critical gaps) |
| `src/components/canvas/ControlNode.tsx` | Generate button, pipeline merge, ParamFields split |
| `src/components/canvas/ParamFields.tsx` | Field renderer + `FileUploadField` + pipeline badges |
| `src/components/canvas/CanvasShell.tsx` | Canvas vs content vs legacy routing |
| `src/lib/dashboard-v3/usePipeline.ts` | `PIPELINE_COMPATIBILITY`, `TOOL_OUTPUT_TYPE` |
| `src/lib/canvas/pipeline-output.ts` | `buildEffectiveParams`, `resolvePipelineOutput` |
| `src/lib/api-schemas/toolApiSchema.ts` | Verified fal/Akool/ElevenLabs `MODEL_SCHEMAS` |
| `src/app/actions/get-gallery.ts` | Gallery server action + table queries |
| `src/lib/gallery-media.ts` | Generation type → media URL resolution |
| `src/app/dashboard/gallery/page.tsx` | Studio Archiv UI |

**Credits source:** `src/lib/canvas/tool-credit-costs.ts` mirrors API `deductCredits` charges per tool.

# Tool Options Audit — 2026-06-03

Read-only audit of all **15 active canvas tools** defined in `src/lib/canvas/toolApiSchema.ts`, rendered via `ControlNode` → `ParamFields` (`src/components/canvas/ParamFields.tsx`). Cross-referenced against production API routes (`src/app/api/**`), `src/lib/canvas/canvas-generate-client.ts` request mapping, pipeline wiring (`src/lib/dashboard-v3/usePipeline.ts`, `src/lib/canvas/pipeline-output.ts`), and verified provider schemas in `src/lib/api-schemas/toolApiSchema.ts` (`MODEL_SCHEMAS`).

**Rendering path:** `CanvasPanelStripView` → embedded `ControlNode` → `ParamFields` / `AgentAutopilotNodeExtras`. Legacy `src/app/dashboard/[tool]/page.tsx` files are **not mounted** when the route is in `ROUTE_TO_TOOL_ID` (canvas mode).

**Upload UI:** Active canvas uses inline `FileUploadField` inside `ParamFields.tsx` (lines 375–524) — drag-and-drop + file picker with pipeline asset drop support. `DynamicParamFields` / dashboard-v3 `UploadField` are **not** used in production canvas.

---

## Summary Table

| Tool | Current Fields | Has Upload? | Should Have Upload? | Missing Params / Wiring Gaps | Priority |
|------|----------------|-------------|---------------------|------------------------------|----------|
| viral-hook | 3 (text/select) | No | No | API expects single `input`; canvas composes from 3 fields ✓ | P1 |
| content-kalender | 3 (text/select) | No | No | **Field names ≠ API** (`monat`/`zielgruppe` vs `nische`/`plattform`/`frequenz`) | **P0** |
| script-generator | 4 (textarea/select) | No | No | `language` not in `/api/generate`; no platform field | P1 |
| trend-script | 3 (text/select/textarea) | No | No | No `plattform` in schema; uses `/api/generate` not `/api/trend-script` | P1 |
| produkt-werbung | 3 (text/textarea/select) | No | Yes (product photo for `/api/product-ad/generate`) | Script route only; missing audience/platform/style; no image | **P0** (video path) / P1 (script) |
| flux-image | 4 (textarea/select/slider) | No | Yes (optional ref/edit — FLUX 2) | No `highRes`, `seed`, `negativePrompt`; no reference images | P1 |
| ki-ich | 4 (textarea/string/node-ref) | node-ref only | Yes (character picker + ref) | **`characterId` missing**; `model_id` wrong key; no LoRA picker | **P0** |
| lora-training | 3 (file/string/number) | ZIP file UI | Yes (multi-image dataset) | **No upload-to-storage**; API needs `zipUrl`, `sessionId`, `name`, `type` | **P0** |
| seedance-video | 5 (textarea/slider/boolean/file-list/node-ref) | file-list | Yes (start + ref images) | **`modelId` missing**; Files don't become URLs; no `resolution`/`aspect_ratio` | **P0** |
| video-transformer | 3 (node-ref/select/slider) | node-ref only | Yes (input video) | No direct **video_upload**; param map `transform_stil` → `stylePrompt` broken | **P0** standalone |
| video-uebersetzer | 4 (node-ref/select/boolean/number) | node-ref only | Yes (input video) | No direct upload; `ziel_sprache` labels ≠ API codes; missing `source_language`, `voice_clone` | **P0** standalone |
| avatar-studio | 3 (string/textarea/string) | No | Yes (source image + driving video) | **Two-step job API** not wired; fields don't match `create-job` | **P0** |
| lipsync-studio | 2 (node-ref ×2) | node-ref only | Yes (video + audio) | No direct uploads; keys OK for pipeline if upstream exists | **P0** standalone |
| melodia-studio | 3 (textarea/select/number) | No | No (text chat) | **`prompt` vs API `message`**; duration/BPM not sent to API | **P0** |
| agent-autopilot | 5 (+ extras) | file in advanced | Optional ref ✓ | **`campaign_goal` vs `message`**; SSE stream not parsed; extras hidden | **P0** |

---

## Per-Tool Detail

### Viral Hook (`viral-hook`)

**API:** `POST /api/viral-hook` — body `{ input: string }` (min 10 chars).  
**Credits:** 1 (`CANVAS_TOOL_BASE_COINS`, `src/lib/viral-hook-extraktor.ts`).

**Current fields** (`toolApiSchema.ts` lines 95–118):

| Key | Type | Label | Options / notes |
|-----|------|-------|-----------------|
| `nische` | string (required) | Nische | placeholder |
| `plattform` | select | Plattform | TikTok, Reels, Shorts |
| `tonfall` | select | Tonfall | aggressiv, neugierig, story |

**Upload status:** None — not required (text-only API).

**Missing vs API / MODEL_SCHEMAS:** N/A (Anthropic text tool). Canvas maps fields → combined `input` in `canvas-generate-client.ts` lines 59–68.

**Pipeline input types:** Output `text` (`TOOL_OUTPUT_TYPE`). Downstream `trend-script.script_input` accepts `text` via `PIPELINE_COMPATIBILITY.script_input`. No upload inheritance needed.

**UI rendering:** Primary: `nische` (required string). Advanced: `plattform`, `tonfall`. Selects/toggles OK. No pipeline badge on this tool (no compatible input fields).

**Recommendation (P1):** Add optional `textarea` for raw hook/transcript input (legacy viral-hook page supports URL + manual modes). Align `plattform` options with `CONTENT_KALENDER_PLATFORMS` / trend tools.

---

### Content Kalender (`content-kalender`)

**API:** `POST /api/content-kalender` — expects `{ nische, plattform, frequenz }` (`src/app/api/content-kalender/route.ts` lines 22–41, `CONTENT_KALENDER_FREQUENCIES` in `src/lib/content-kalender-tool.ts`).

**Current fields** (lines 134–147):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `monat` | string (required) | Monat | e.g. März 2026 |
| `post_frequenz` | select | Post-Frequenz | täglich, 3x woche |
| `zielgruppe` | string (required) | Zielgruppe | |

**Upload status:** None — not required.

**Missing vs API:** **Critical mismatch.** Canvas sends `monat`, `post_frequenz`, `zielgruppe`; API ignores them and requires `nische`, `plattform`, `frequenz` (`3x_woche` | `5x_woche` | `taeglich`). Default `{ ...params }` in `canvas-generate-client.ts` → **generation fails validation**.

**Pipeline:** Output registered as `text` (should be structured calendar JSON — `outputType: "calendar"` but `TOOL_OUTPUT_TYPE["content-kalender"]` = `"text"`).

**UI rendering:** All three fields primary (two required strings). No upload. No pipeline inputs.

**Recommendation (P0):** Rename/remap fields to `nische`, `plattform`, `frequenz` matching `content-kalender-tool.ts`. Optionally keep `monat` as display-only or extra prompt context.

---

### Script Generator (`script-generator`)

**API:** `POST /api/generate` — `PremiumGenerateRequest`: `topic`, `platform`, `videoLength`, `scriptInput`, `tone`, etc. (`src/lib/claude-premium-generate.ts`).

**Current fields** (lines 197–239):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `topic` | textarea (required) | Thema / Prompt | |
| `video_laenge` | select | Video-Länge | 15s, 30s, 60s, 180s |
| `tonfall` | select | Ton / Stil | energetisch, informativ, unterhaltsam, dramatisch |
| `sprache` | select | Sprache | de, en, bilingual |

**Upload status:** None — not required.

**Missing vs API:** `sprache` sent as `language` but **`/api/generate` does not read `language`** (P1). No `platform` / `plattform` field (defaults to TikTok in API). No hook inheritance field (`script_input` / node-ref) despite `followUpTools` from viral-hook.

**Pipeline:** Output `script`. Should accept `text`/`script` from viral-hook — **no `node-ref` field** (P2).

**UI rendering:** `topic` primary; rest in advanced (ParamFields progressive disclosure). Works.

**Recommendation (P1):** Add optional `script_input` node-ref; map `sprache` in API or remove; add `plattform` select.

---

### Trend Script (`trend-script`)

**API (canvas):** `POST /api/generate` (2 credits) — **not** `/api/trend-script` (3 credits, trend discovery). Mapped in `canvas-generate-client.ts` lines 87–94.

**Current fields** (lines 162–182):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `trend_thema` | string (required) | Trend-Thema | |
| `video_laenge` | select | Video-Länge | 30s, 60s, 90s |
| `script_input` | textarea (node-ref capable) | Hook / Vorlage | `acceptsOutputTypes: ["text"]` |

**Upload status:** None.

**Missing vs API:** No `plattform` in schema (hardcoded `"TikTok"` in client). Legacy `/api/trend-script` trend sources not used. MODEL_SCHEMAS N/A (Claude).

**Pipeline:** `script_input` in `PIPELINE_COMPATIBILITY` → inherits `text`/`script` ✓. `InheritedInputBadge` + reconnect works.

**UI rendering:** Primary: `trend_thema`, `script_input` (required node-ref? — not marked required). Advanced: `video_laenge`.

**Recommendation (P1):** Add `plattform` select; document that canvas uses premium generate path, not trend API.

---

### Produkt-Werbung (`produkt-werbung`)

**API (canvas):** `POST /api/product-ad/script` — free, text only (`productName`, `productDescription`, `audience`, `platform`, `style`).  
**Full ad pipeline:** `POST /api/product-ad/generate` — **requires `imageUrl`** + audience (`route.ts` lines 243–247).

**Current fields** (lines 255–268):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `produkt_name` | string (required) | Produktname | |
| `usps` | textarea (required) | USPs | |
| `werbe_ziel` | select | Werbeziel | conversion, branding |

**Upload status:** **Missing.** Legacy `src/app/dashboard/produkt/page.tsx` has full product photo upload + batch/upscale.

**Missing vs API:** Canvas `buildRequestBody` maps to script route with invented defaults (`audience: "Allgemein"`, `platform: "tiktok"`, `style: "lifestyle"`) — script works partially. **No product image** blocks video generation path (P0 for visual ads). MODEL_SCHEMAS: no direct match; product video uses Seedance/Kling downstream.

**Pipeline:** Output typed `script` in `TOOL_OUTPUT_TYPE` but schema `outputType: "text"`. Follow-up to `flux-image` / `seedance-video` needs image from product photo.

**UI rendering:** All fields primary. No upload.

**Recommendation (P0):** Add `product_image` file upload; wire to `/api/product-ad/generate` or split script vs video modes. Add `zielgruppe`, `plattform`, `sprache` matching legacy page.

---

### Bild Generator / FLUX (`flux-image`)

**API:** `POST /api/generate-image` — `prompt`, `aspectRatio`, `styleId`, `platform`, optional `highRes`, `seed`, `negativePrompt`, `variation`/`parentGenerationId` (`route.ts` lines 52–79).

**Current fields** (lines 290–325):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `prompt` | textarea (required) | Beschreibung | |
| `aspect_ratio` | select | Seitenverhältnis | 1:1, 16:9, 9:16, 4:3 |
| `num_images` | slider | Anzahl Bilder | 1–4 |
| `style_preset` | select | Stil | ugc, editorial, cinematic, product |

**Upload status:** **Missing.** User spec: FLUX 2 edit supports reference images (up to 4). `MODEL_SCHEMAS` `FLUX_2_PRO` has no `image_url` field; legacy image page supports character refs / LoRA — not in canvas schema.

**Missing vs API:** Client sends `aspectRatio`, `styleId`, `platform: "tiktok"` only — **`num_images` ignored** (P1). No `highRes` toggle (8 vs 5 credits). No `seed`, `negativePrompt`. Reference/edit images absent (P1).

**Pipeline:** Outputs `image_url`. Downstream `seedance-video.images_list`, `ki-ich.reference_image` can inherit **if** URL is registered — `images_list` compat ✓.

**UI rendering:** `prompt` primary; rest advanced. Slider/select OK. `FileUploadField` not used.

**Recommendation (P1):** Add optional `reference_images` file-list; `highRes` boolean; wire `num_images` in API client. Cross-ref `FLUX_2_FLEX` for `guidance_scale` if switching models.

---

### KI-Ich (`ki-ich`)

**API:** `POST /api/ki-influencer/generate` — requires **`characterId`** + `prompt` (`route.ts` lines 42–58). Uses trained LoRA URL from DB.

**Current fields** (lines 340–349):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `prompt` | textarea (required) | Szene beschreiben | |
| `model_id` | string | Avatar-Klon | placeholder only |
| `kleidungs_stil` | string | Kleidungsstil | |
| `reference_image` | node-ref | Referenzbild | `acceptsOutputTypes: ["image"]` |

**Upload status:** **node-ref only** — no character picker, no face photo upload. Legacy `ki-influencer/page.tsx` has full character training UI.

**Missing vs API:** **`model_id` ≠ `characterId`** — API rejects requests (P0). `kleidungs_stil` not in API body. `reference_image` not in API (LoRA identity comes from character). `PIPELINE_COMPATIBILITY` has no `reference_image` key — pipeline inheritance for this field **broken** (P2); drag-drop from asset nodes may work via `onAssetDrop`.

**Pipeline:** Should accept upstream `image_url` only for optional ref (not primary path). Output `image_url`.

**UI rendering:** Primary: `prompt`, `model_id` (required string — but not a real selector). Advanced: `kleidungs_stil`, `reference_image` node-ref drop zone.

**Recommendation (P0):** Replace `model_id` with `characterId` select populated from user's trained characters. Remove or hide misleading `reference_image` unless API gains img2img.

---

### LoRA Training (`lora-training`)

**API:** `POST /api/lora/train` — requires `name`, `triggerWord`, `zipUrl`, `sessionId`, optional `steps`, `type`, `imageCount` (`route.ts` lines 28–59). Expects **pre-uploaded ZIP URL**, not raw File.

**Current fields** (lines 365–369):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `dataset_zip` | file (required) | Dataset (ZIP) | |
| `trigger_word` | string (required) | Trigger-Wort | |
| `training_steps` | number | Training Steps | 500–5000, default 2000 |

**Upload status:** **`FileUploadField` present** (working drag-drop UI) — but canvas POST sends **`File` object in JSON** via `runCanvasGeneration` default spread → **cannot work** (P0).

**Missing vs API:** No `name`, `type`, `sessionId`, multi-image upload flow (legacy page uploads images → builds ZIP → Supabase → `zipUrl`). MODEL_SCHEMAS: no LoRA trainer entry.

**Pipeline:** Output `json`. N/A for inputs.

**UI rendering:** `dataset_zip` primary (file). Steps in advanced. Upload UI works locally; **API wiring broken**.

**Recommendation (P0):** Mirror legacy page upload pipeline (`/api/lora/upload`, sessionId, name, type selector) before calling train. Consider `file-list` + ZIP builder vs single ZIP upload.

---

### Szenen Generator / Seedance (`seedance-video`)

**API:** `POST /api/seedance` — **requires** `imageUrl`, `prompt`, **`modelId`**, optional `duration`, `resolution`, `lastFrameUrl` (`route.ts` lines 37–53). Uses Akool model catalog + `calculateAkoolModelCredits`.

**Current fields** (lines 385–409):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `prompt` | textarea (required) | Szenen-Beschreibung | |
| `duration` | slider | Dauer (Sek.) | 4–15, default 8 |
| `generate_audio` | boolean | Audio generieren | default true |
| `images_list` | file-list | Referenzbilder (bis 4) | pipeline-capable |
| `script_ref` | node-ref | Skript / Voiceover | text |

**Upload status:** **file-list UI present** — same File serialization problem unless pipeline provides URL. **`modelId` field absent** → API always 400 (P0).

**Missing vs MODEL_SCHEMAS `SEEDANCE_2_T2V`:** `image_url` (required for I2V), `reference_images` (multi), `aspect_ratio`, `resolution`, `seed`. Canvas `generate_audio` sent but **Akool seedance route may not forward it** (verify `startSeedanceJob`). Legacy `SzenenGeneratorStudio` has full model picker.

**Pipeline:** `images_list` ↔ `image_url` compat ✓. `script_ref` ↔ text ✓. Client uses only `images[0]` as `imageUrl` — **ignores multi-ref** (P1).

**UI rendering:** Primary: `prompt`, `images_list`. Advanced: duration, audio, script_ref. File-list uses working `FileUploadField`.

**Recommendation (P0):** Add `modelId` select (from `/api/seedance/models` or registry). Upload files to storage before API call. P1: `resolution`, `aspect_ratio`, multi-image mapping.

---

### Video Transformer (`video-transformer`)

**API:** `POST /api/akool/video-to-video` — requires **`videoUrl`** + **`stylePrompt`** (+ optional `strength`) (`route.ts` lines 24–46).

**Current fields** (lines 424–452):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `input_video` | node-ref (required) | Input Video | video, image |
| `transform_stil` | select | Transform-Stil | Anime, Cyberpunk, 3D-Pixar |
| `motion_strength` | slider | Motion Strength | 0–100, default 50 |

**Upload status:** **node-ref only** — no `video_upload` file field. Unusable without upstream video panel (P0 standalone).

**Missing vs API:** Default `{ ...params }` sends `transform_stil` / `motion_strength` — **not mapped** to `stylePrompt` / `strength` (P0 wiring). Style labels are presets, not free-text prompts Akool expects.

**Pipeline:** `input_video` ↔ `video_url` ✓. Accepts `video_url` from seedance, avatar, lipsync outputs.

**UI rendering:** Primary: `input_video` drop zone + pipeline badge. Advanced: stil, slider. No direct upload.

**Recommendation (P0):** Add `video_upload` file field; map params in `canvas-generate-client.ts`. P1: style → `stylePrompt` string builder.

---

### Video Übersetzer (`video-uebersetzer`)

**API:** `POST /api/akool/video-translation` — `videoUrl`, `targetLanguage` (codes), `sourceLanguage`, `voiceClone`, `duration_minutes` for billing (`route.ts` lines 29–56). Cross-ref `AKOOL_VIDEO_TRANSLATION` in `api-schemas/toolApiSchema.ts`.

**Current fields** (lines 466–495):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `input_video` | node-ref (required) | Input Video | video |
| `ziel_sprache` | select | Zielsprache | Englisch, Spanisch, … (German labels) |
| `lipsync_correction` | boolean | Lipsync-Korrektur | default true |
| `duration_minutes` | number | Video-Länge (Min.) | 1–30 |

**Upload status:** **node-ref only** (P0 standalone).

**Missing vs API:** Canvas sends German display names — API expects **`target_language` codes** (`en`, `de`, …) (P0). `lipsync_correction` ≠ API `lipsync` on translation endpoint. Missing `source_language`, `voice_clone`. MODEL_SCHEMAS adds `resolution`.

**Pipeline:** `input_video` ✓. Credit calculator uses `duration_minutes` ✓.

**UI rendering:** Primary: `input_video`. Advanced: language, lipsync toggle, duration. Boolean/toggle OK.

**Recommendation (P0):** Direct video upload; map languages to ISO codes; align boolean with API field names.

---

### Avatar Studio (`avatar-studio`)

**API:** Two-step — `POST /api/avatar/create-job` (needs `sourceImageUrl`, `drivingVideoUrl`, `options`, consent) then `POST /api/avatar/start-render` with `{ jobId }` (`create-job/route.ts`, `start-render/route.ts`).

**Current fields** (lines 510–520):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `avatar_id` | string | Avatar | placeholder |
| `audio_script` | textarea (required) | Skript / Audio | text, audio |
| `background_scene` | string | Hintergrund-Szene | |

**Upload status:** **Missing** — API requires source image + driving video URLs (P0). Cross-ref `AKOOL_TALKING_AVATAR` / live-portrait fal job.

**Missing vs API:** Canvas calls `start-render` directly with wrong body — **no job creation, no uploads, no duration/resolution options** from `AvatarRenderOptions` (`pricing.ts`). `avatar_id` string doesn't match job flow.

**Pipeline:** `audio_script` accepts text/script/audio ✓. Output `video_url`.

**UI rendering:** Primary: `audio_script`, `avatar_id`. No uploads.

**Recommendation (P0):** Implement full job wizard: image upload, driving video upload, duration/resolution/subtitles toggles, consent, then start-render. Match legacy avatar studio pages.

---

### Lipsync Studio (`lipsync-studio`)

**API:** `POST /api/akool/lipsync` — **`videoUrl`** + **`audioUrl`** (`route.ts` lines 24–31). Cross-ref `AKOOL_LIPSYNC`: `target_video`, `input_audio`.

**Current fields** (lines 534–549):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `input_video` | node-ref (required) | Video | video |
| `input_audio` | node-ref (required) | Neue Stimme | audio |

**Upload status:** **node-ref only** — should have video + audio uploads per Akool schema (P0 standalone).

**Missing vs API:** Keys not mapped in `canvas-generate-client` — default spread sends `input_video`/`input_audio` not `videoUrl`/`audioUrl` (P0 wiring). Missing `faceswap_quality` (P1).

**Pipeline:** Both fields in `PIPELINE_COMPATIBILITY` ✓ (`input_video`→video_url, `input_audio`→audio_url).

**UI rendering:** Both node-ref fields primary. Pipeline badge works when upstream melodia/avatar outputs exist.

**Recommendation (P0):** Map field names in client; add `video_upload` + `audio_upload` fields.

---

### Melodia Studio (`melodia-studio`)

**API:** `POST /api/melodia` — SSE chat; body `{ message, history?, ... }` (`route.ts` lines 18–40). Cost: 1 credit on success.

**Current fields** (lines 564–579):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `prompt` | textarea (required) | Musik / SFX Beschreibung | |
| `duration` | select | Dauer | 10s, 30s, 60s, 120s |
| `bpm` | number | BPM | 60–180, default 120 |

**Upload status:** None — text chat API.

**Missing vs API:** Canvas sends **`prompt`** — API reads **`message`** (P0). `duration` / `bpm` not used by melodia chat route (P1 display-only unless music gen API added). MODEL_SCHEMAS: no Melodia entry (not ElevenLabs TTS schema).

**Pipeline:** Output `audio_url` — **unclear if melodia SSE returns URL** for pipeline registration (verify `parseApiResponse`).

**UI rendering:** Primary: `prompt`. Advanced: duration, BPM. Select/number OK.

**Recommendation (P0):** Map `prompt` → `message` in client; handle SSE in `runCanvasGeneration` or dedicated melodia client.

---

### Agent Autopilot (`agent-autopilot`)

**API:** `POST /api/agent` — SSE stream; body `{ message, history? }` (`src/app/api/agent/route.ts`). Credits deducted dynamically inside agent run.

**Current fields** (lines 594–631):

| Key | Type | Label | Options |
|-----|------|-------|---------|
| `campaign_goal` | textarea (required) | Kampagnen-Ziel | |
| `ai_model` | select | KI-Modell | claude, flux, kling, seedance labels |
| `reference_image` | file | Referenzbild | hidden from ParamFields primary |
| `platforms` | multiselect | Plattformen | TikTok, Instagram, YouTube, LinkedIn |
| `automation_level` | select | Automatisierung | vollautomatisch, review-required |

**Upload status:** **`reference_image` file** — rendered only inside `AgentAutopilotNodeExtras` (advanced), not standard `FileUploadField` path. Optional ✓.

**Missing vs API:** **`campaign_goal` not mapped to `message`** (P0). `runCanvasGeneration` expects JSON response — **agent returns SSE** (P0). `platforms`, `automation_level`, `ai_model` not sent to `/api/agent`. MODEL_SCHEMAS N/A.

**Pipeline:** Declared output `script` / agent type — orchestrates multiple tools server-side.

**UI rendering:** Duplicate progressive disclosure (ControlNode + ParamFields both have “Erweiterte Einstellungen”). `ai_model` + `reference_image` moved to `AgentAutopilotNodeExtras` with custom upload.

**Recommendation (P0):** Dedicated agent runner with SSE UI; map `campaign_goal` → `message`. P1: expose platforms/automation in API or remove from schema.

---

## P0 — Tools unusable without missing upload / broken API wiring

| Tool | Issue | Evidence |
|------|-------|----------|
| **content-kalender** | Field names don't match API | `toolApiSchema.ts` vs `content-kalender/route.ts` |
| **ki-ich** | `characterId` required; canvas sends `model_id` | `ki-influencer/generate/route.ts` |
| **lora-training** | File object in JSON; no zipUrl/session upload | `lora/train/route.ts`, `canvas-generate-client.ts` default |
| **seedance-video** | Missing `modelId`; imageUrl required; Files not uploaded | `seedance/route.ts` lines 42–52 |
| **video-transformer** | No video upload; params not mapped to API | `akool/video-to-video/route.ts` |
| **video-uebersetzer** | No video upload; wrong language field values | `akool/video-translation/route.ts` |
| **avatar-studio** | No image/video upload; wrong single-step API call | `avatar/create-job`, `start-render` |
| **lipsync-studio** | No uploads; wrong JSON keys vs API | `akool/lipsync/route.ts` |
| **melodia-studio** | `prompt` vs `message`; SSE not handled | `melodia/route.ts` |
| **agent-autopilot** | `campaign_goal` vs `message`; SSE not handled | `agent/route.ts` |
| **produkt-werbung** | No product image for video ad path | `product-ad/generate/route.ts` line 243 |

Standalone use of pipeline-only video tools (transformer, übersetzer, lipsync) is **P0** when no upstream panel exists.

---

## P1 — Tools missing important parameters

| Tool | Gaps |
|------|------|
| **viral-hook** | Optional raw input / URL mode from legacy page |
| **script-generator** | `platform`, hook inheritance, unused `sprache` |
| **trend-script** | `plattform` select; clarify API path |
| **produkt-werbung** | Audience, platform, style fields for script API |
| **flux-image** | `highRes`, `num_images` wiring, reference/edit images, seed |
| **seedance-video** | `resolution`, `aspect_ratio`, multi-ref, model-specific durations |
| **video-transformer** | `stylePrompt` mapping, Akool quality options |
| **video-uebersetzer** | `source_language`, `voice_clone`, `resolution` |
| **avatar-studio** | Duration, resolution, subtitles, voiceover (`AvatarRenderOptions`) |
| **lipsync-studio** | `faceswap_quality` |
| **melodia-studio** | Duration/BPM only if music generation API exists |
| **agent-autopilot** | Wire or remove unused schema fields |

---

## P2 — Pipeline image/video inheritance gaps

| Gap | Details | Files |
|-----|---------|-------|
| **`reference_image` not in `PIPELINE_COMPATIBILITY`** | `ki-ich.reference_image` won't auto-inherit upstream image | `usePipeline.ts` lines 14–27 |
| **`content-kalender` output type** | Schema `calendar` but pipeline registers `text` | `usePipeline.ts` line 31 |
| **`produkt-werbung` output type** | Schema `text`, pipeline `script` | `usePipeline.ts` line 34 |
| **node-ref without compat key** | Only keys in `PIPELINE_COMPATIBILITY` get `InheritedInputBadge` | `ParamFields.tsx` lines 61–68 |
| **File fields + pipeline** | `images_list` compat exists but value is URL string, not array — seedance client may not handle | `canvas-generate-client.ts` lines 49–57 |
| **Asset drag-drop** | Sets `asset.text ?? asset.url` — video/audio assets need URL in `AssetNodeData` | `ControlNode.tsx` lines 454–457 |
| **Multi-panel order** | Inheritance only from panels **left** of current in strip sort order | `getInheritedValue` slice logic |

Pipeline **does** support `image_url` → `images_list`, `video_url` → `input_video`, `audio_url` → `input_audio`, `text`/`script` → script fields when keys match.

---

## Appendix — Architecture references

| Concern | Primary file | Lines (approx.) |
|---------|--------------|-----------------|
| Tool schema (15 tools) | `src/lib/canvas/toolApiSchema.ts` | 81–633 |
| Credit constants | `src/lib/canvas/tool-credit-costs.ts` | 17–73 |
| Field rendering | `src/components/canvas/ParamFields.tsx` | 32–524 |
| Control panel logic | `src/components/canvas/ControlNode.tsx` | 438–561 |
| API body mapping | `src/lib/canvas/canvas-generate-client.ts` | 37–97 |
| Pipeline compat | `src/lib/dashboard-v3/usePipeline.ts` | 14–27 |
| Verified provider schemas | `src/lib/api-schemas/toolApiSchema.ts` | 47–860 |
| MODEL_SCHEMAS map | same | 848–860 |

**Note:** `CanvasMobileStackView.tsx` exists but is **unwired** — production uses horizontal panel strip only.

---

*Audit only — no code changes. Generated 2026-06-03.*

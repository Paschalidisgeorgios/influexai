# InfluexAI Model Audit
## Date: 2026-06-03

Audit of every AI provider call in the codebase. No code was changed.

---

## Executive Summary

| Provider | Call sites (approx.) | Primary models |
|----------|---------------------|----------------|
| fal.ai | 25+ routes/libs | `fal-ai/flux-2-pro`, `bytedance/seedance-2.0/fast/image-to-video`, `fal-ai/kling-video/v1.6/pro/image-to-video`, `fal-ai/kling-video/v3/pro/motion-control`, `fal-ai/flux-pulid`, `fal-ai/flux-lora`, `fal-ai/live-portrait`, `fal-ai/flashhead` |
| Anthropic | 35+ files | `claude-sonnet-4-5-20250929` (default + Master Agent + agent tools), `claude-haiku-4-5-20251001` (Melodia, prompt improve) |
| Akool | 8+ routes/libs | Open API v3/v4 (talking photo, UGC, face swap, live avatar) |
| ElevenLabs | 6 routes/actions | `eleven_multilingual_v2` TTS |

**Key findings:** Primary Bild Generator model is correctly `fal-ai/flux-2-pro` with negative prompt omitted. Character/reference edit uses **Seedream v4.5 edit**, not ideogram. Seedance uses **2.0 fast**, not 1-lite. Kling 2.5 is registered but **`KLING_25_PROVIDER_ENABLED = false`**. Several legacy fal helpers (`generateTextToImage`, etc.) are **dead code**. Master Agent and dashboard text tools use **Sonnet 4.5** (`claude-sonnet-4-5-20250929`).

---

## IMAGE MODELS

| Model | ID | Route / Entry | Credits | Enhancer | Quality Score | Auto-retry <70 | Issues |
|-------|-----|---------------|---------|----------|---------------|----------------|--------|
| Bild Generator (standard) | `fal-ai/flux-2-pro` | `src/lib/image-generator-fal.ts:86` via `/api/generate-image`, `runImageGeneratorGeneration` | 5 (`FAL_CREDITS.fluxDev`) | Yes — `prepareImageGeneratorPrompts` → `enhanceImagePrompt` (`image-generator-prompt-pipeline.ts:105`) | Agent/campaign only (`runVisualQAWithRetry`) | Agent/campaign only | Credit label says "fluxDev" but primary is flux-2-pro; `highRes` flag ignored on primary path |
| Bild Generator fallback (highRes) | `fal-ai/flux-pro` | `image-generator-fal.ts:124-130` | 8 when `highRes=true` | Yes | No (dashboard) | No | Only used if flux-2-pro throws |
| Bild Generator fallback (standard) | `fal-ai/flux/dev` | `image-generator-fal.ts:148-154` | 5 | Yes | No | No | Legacy fallback |
| KI Influencer casting | `fal-ai/flux-2-pro` | `src/app/api/ki-influencer/casting/route.ts:133` | Standard image credits | Yes (`influencerCastingMode`) | No | No | — |
| Product ad preview image | `fal-ai/flux-2-pro` | `src/lib/product-ad-preview-run.ts:108` | 5 | No (inline UGC prompt) | No | No | Skips enhancer |
| Character / reference edit | `fal-ai/bytedance/seedream/v4.5/edit` | `src/lib/character-image-fal.ts:137` | Same as image gen when used | Yes (`characterMode`) | No | No | **Not ideogram**; min edge 1920px enforced |
| KI-Ich / PuLID | `fal-ai/flux-pulid` | `src/lib/fal-image.ts:296` → `/api/ki-ich` | 8 final; preview free | Built-in prompt builders | No | No | Final mode upscales via clarity-upscaler |
| LoRA training (portrait) | `fal-ai/flux-lora-portrait-trainer` | `src/lib/lora-fal.ts:90` | `calcLoraCredits(steps)` 10–15+ | N/A | N/A | N/A | Async `fal.queue.submit` + webhook |
| LoRA training (fast) | `fal-ai/flux-lora-fast-training` | `lora-fal.ts:101` | Same formula | N/A | N/A | N/A | Async queue |
| LoRA inference | `fal-ai/flux-lora` | `lora-fal.ts:146`, `/api/lora/generate`, `/api/ki-influencer/generate` | 2 (`LORA_GENERATION_CREDIT`) | No (trigger word in prompt) | No | No | 35 steps default, negative_prompt used |
| Upscale | `fal-ai/clarity-upscaler` | `fal-image.ts:141`, `image-generator-fal.ts:195` | 4 | N/A | N/A | N/A | factor=2, creativity=0.25, resemblance=0.9 |
| Thumbnail concept | *(none — Claude only)* | `src/app/actions/generate-thumbnail.ts:213` | 1 | N/A | N/A | N/A | **No fal image**; CSS layout concepts only |
| Product page (legacy) | `fal-ai/flux-pro/v1.1` | `fal-image.ts:241` | — | — | — | — | **Dead code** — no callers |
| Legacy T2I helpers | `fal-ai/flux-pro`, `fal-ai/flux/dev` | `fal-image.ts:200,273` | — | — | — | — | **Dead code** — `generateTextToImage`, `generateFluxProImage`, `generateFluxDevImage` unused |
| FFmpeg extract frame | `fal-ai/ffmpeg-api/extract-frame` | `motion-transfer-generate.ts:60` | (bundled in motion transfer) | N/A | N/A | N/A | Helper for video→image |

### Image call details

#### 1. Standard Image — `fal-ai/flux-2-pro`
- **File:** `src/lib/image-generator-fal.ts:59-94`
- **Parameters:** `prompt`, `image_size` (custom `{width,height}` via `resolveFlux2ProImageSize`, short edge ≥1080px), `safety_tolerance: "2"`, `enable_safety_checker: true`, `output_format: "jpeg"`, optional `seed`
- **NOT sent:** `negative_prompt`, `num_inference_steps`, `guidance_scale` (correct for flux-2-pro)
- **Enhancer:** Yes, unless `skipPromptEnhancement` + `falPrompt` on `/api/generate-image`
- **Quality scoring:** `runVisualQAWithRetry` in `toolOrchestrator.ts:385`, `campaignExecutor.ts:191` only
- **Auto-retry:** Same paths, threshold 70 (`QUALITY_RETRY_THRESHOLD`)
- **Fallback:** On error → `flux-pro` (if highRes) or `flux/dev`

#### 2. Premium / highRes
- **Expected:** flux-pro or flux-2-pro with highRes flag
- **Actual:** Primary always flux-2-pro with same `image_size`; `highRes` only affects **fallback** model selection (`image-generator-fal.ts:108-130`) and credit cost (8 vs 5)
- **Issue:** Users paying 8 credits for "High-Res" may still get flux-2-pro at standard resolution if primary succeeds

#### 3. Reference Edit / Character
- **Expected:** ideogram-v3 or seedream/v4.5/edit
- **Actual:** `fal-ai/bytedance/seedream/v4.5/edit` only (`character-image-fal.ts:13`)
- **Parameters:** `prompt`, `image_urls` (max 10), `image_size`, `num_images: 1`, `enable_safety_checker: true`
- **No ideogram** references in codebase

#### 4. KI-Ich PuLID — `fal-ai/flux-pulid`
- **Inputs:** `reference_image_url`, `prompt` (scene), `negative_prompt`, `image_size`, `num_inference_steps`, `guidance_scale`, `id_weight`
- **Preview:** `portrait_4_3`, steps 30, id_weight 0.85
- **Final:** 1536×2048, steps 40, id_weight 1.0, then clarity upscaler
- **Gallery:** Yes — `generations` table via `/api/ki-ich`

#### 5–7. LoRA / Upscale
- See table above; training uses webhook at `/api/lora/webhook`

#### 8. Thumbnail / Concept
- Claude Opus (default model) generates JSON/CSS concepts only — no image model

---

## VIDEO MODELS

| Model | ID | Route | Credits | Async polling | Issues |
|-------|-----|-------|---------|---------------|--------|
| Seedance I2V | `bytedance/seedance-2.0/fast/image-to-video` | `seedance-generate.ts:174` → `/api/seedance` | 40 | **No** — blocking `fal.subscribe`, route `maxDuration=300` | Not `fal-ai/seedance-1-lite`; duration `"5"`, resolution `"720p"`, `aspect_ratio: "auto"`, `generate_audio: true` |
| Kling Product Ad | `fal-ai/kling-video/v1.6/pro/image-to-video` | `fal-video.ts:34` → `/api/product-ad/generate` | 75 (5s) / 75×3 batch | **No** — blocking subscribe, `maxDuration=300` | v1.6 not v2+; upscale mode uses `duration: "10"`, `cfg_scale: 0.65` |
| Kling Motion Transfer | `fal-ai/kling-video/v3/pro/motion-control` | `motion-transfer-generate.ts:173` | 8 | **No** — blocking subscribe | Credit cost likely underpriced vs 75 for product Kling |
| Kling 2.5 Turbo Pro | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | `kling25-config.ts:4-5` | 40 (configured) | N/A | **`KLING_25_PROVIDER_ENABLED = false`** — UI hidden, no execution |
| Live Portrait | `fal-ai/live-portrait` | `live-portrait/route.ts:85`, `avatar/start-render/route.ts:79`, `portrait-frame/route.ts:113` | 5 (dashboard LP), 20 (portrait-frame), avatar job credits vary | Blocking subscribe | Avatar studio + LP block up to 300s |
| FFmpeg extract | `fal-ai/ffmpeg-api/extract-frame` | `motion-transfer-generate.ts:60` | — | Sync | — |

### Video parameter details

**Seedance** (`seedance-generate.ts:174-184`):
```json
{ "image_url", "prompt", "resolution": "720p", "duration": "5", "aspect_ratio": "auto", "generate_audio": true }
```

**Kling Product** (`fal-video.ts:34-44`):
```json
{ "prompt", "image_url", "negative_prompt", "duration": "5"|"10", "aspect_ratio": "9:16", "cfg_scale": 0.5|0.65 }
```

**Kling Motion** (`motion-transfer-generate.ts:173-178`):
```json
{ "image_url", "video_url", "character_orientation": "video" }
```

**Live Portrait** (`live-portrait/route.ts:85-93`):
```json
{ "image_url", "video_url", "flag_do_crop": true, "flag_do_rot": true, "dsize": 512, "scale": 2.3 }
```
Portrait-frame fallback adds: `batch_size: 8`, `flag_stitching`, `flag_pasteback`, `flag_relative`

**Kling 2.5 disabled:** Set `KLING_25_PROVIDER_ENABLED = true` in `kling25-config.ts:22` and implement generation path (currently only registry/UI stub in `image-to-video-models.ts`).

---

## AVATAR MODELS

| Model | Provider | Route | Credits | Issues |
|-------|----------|-------|---------|--------|
| KI-Ich PuLID | fal.ai | `/api/ki-ich` | 8 (final) | See IMAGE section; gallery yes |
| Akool Talking Photo | Akool v3 | `akool.ts:67` → `/api/live-creator` POST | 10 (deduct on poll complete) | Endpoint: `/content/video/createbytalkingphoto`; 720p default; **async poll** via GET `?jobId=` |
| Akool UGC Talking Avatar | Akool v3 | `akool-ugc.ts:184` → `/api/ugc-video` | 5 | Endpoint: `/talkingavatar/create`; ElevenLabs or Akool voice; face swap optional |
| Live Creator Studio (realtime) | fal.ai FlashHead | `LiveCreatorStudioInner.tsx:359` | 2/min heartbeat | Model: `fal-ai/flashhead`; token via `/api/fal/realtime-token`; fallback portrait-frame uses live-portrait |
| Akool Live Avatar (streaming) | Akool | `/api/live-avatar/session` | Plan-gated | Agora session; not generative fal model |
| Face Swap | Akool v3/v4 | `/api/faceswap` | 5 image / 10 video | V4 `faceswapPlusByImage`, V3 highquality fallbacks; async poll |

### Akool Talking Photo flow
1. POST `/api/live-creator` — ElevenLabs TTS optional → upload audio to fal storage → `createTalkingPhotoVideo`
2. Client polls GET `/api/akool?jobId=` or `/api/live-creator?jobId=`
3. Credits deducted when status=completed (`live-creator/route.ts:79-88`)
4. `maxDuration=300` on route; no server-side `waitForAkoolVideo` in this path

### Akool UGC vs Talking Photo
- **UGC:** Catalog avatars, script + voice, optional custom face via face swap, `/talkingavatar/create`
- **Talking Photo:** User photo + audio, simpler pipeline, `/content/video/createbytalkingphoto`
- Both use `getAkoolVideoResult` for polling

---

## VOICE MODELS

| Model | Provider | Route | Credits | Issues |
|-------|----------|-------|---------|--------|
| TTS | ElevenLabs `eleven_multilingual_v2` | `elevenlabs-tts.ts:52-71` | 3 (`generate-voice.ts`), 50 stability default on `/api/stimme/speak` | Voices: API `/v1/voices` + shared catalog (page_size=100); **12 curated fallbacks** in `elevenlabs-config.ts` |
| Voice preview | Same | `/api/elevenlabs/voice-preview` | Free preview | — |
| Voice clone | ElevenLabs | `/api/stimme/clone` | Plan-gated | POST `/v1/voices/add` |
| Melodia chat | Anthropic `claude-haiku-4-5-20251001` | `melodia/stream-chat.ts:38` | Widget (no per-message credit in code) | **Not ElevenLabs music** — text support bot, streaming |
| Voice Agent | — | `/dashboard/voice-agent` | — | **Coming soon** (ElevenLabs Conversational AI placeholder) |

### ElevenLabs parameters (`elevenlabs-tts.ts:61-69`)
- `model_id`: `eleven_multilingual_v2`
- `voice_settings`: `stability` (0–1 from %), `similarity_boost: 0.75`, `style: 0`, `use_speaker_boost: true`
- Output: MPEG audio; saved to gallery via `generate-voice.ts` → `generations` type audio

---

## TEXT / AGENT MODELS

| Tool | Model | File:line | Temperature | Max tokens | Issues |
|------|-------|-----------|-------------|------------|--------|
| Agent tools (viral hook, trend script, product ad, kalender) | `claude-sonnet-4-5-20250929` | `claude-agent-tools.ts:73-226` | 0.8 creative / 0.5 kalender & campaign | 2000–3000 | JSON fence stripping via `stripClaudeJson` + `parseClaudeJson` |
| Full campaign planner | Sonnet 4.5 | `claude-agent-tools.ts:223` | 0.5 | 3000 | — |
| Campaign planner (legacy) | Sonnet 4.5 | `campaignPlanner.ts:245,304` | default | 4096 | — |
| Script generator | Sonnet 4.5 | `generate-script.ts:162` | default | default 4096 | — |
| Image prompt enhancer | Sonnet 4.5 | `imagePromptEnhancer.ts:115` | default | 1024 | — |
| Visual QA / vision | Sonnet 4.5 | `visualQuality.ts:106,201` | default | 500 | Multimodal image blocks |
| Quality scorer (text) | Sonnet 4.5 | `qualityScoring.ts:89` | default | 500 | — |
| Content score (numeric) | Sonnet 4.5 | `contentScoring.ts:20` | 0.3 | 10 | Parses first integer; fallback 50 |
| Intent router | Sonnet 4.5 | `intentRouter.ts:108` | default | 300 | — |
| Creator memory extract | Sonnet 4.5 | `creatorMemory.ts:138` | default | 300 | — |
| Improve image prompt | Haiku 4.5 | `improve-image-prompt.ts:48` | default | 512 | — |
| Melodia | Haiku 4.5 | `stream-chat.ts:38` | default | 1024 | Streaming |
| **Master Agent** | Sonnet 4.5 | `anthropic-agent.ts:57,131` | default | 8192 | Streaming supported |
| Product ad script (dashboard) | Sonnet 4.5 | `product-ad-script.ts:85` | default | 1200 | — |
| Thumbnail concepts | Sonnet 4.5 (default) | `generate-thumbnail.ts:213` | default | 8192 | — |
| KI Agent route | Sonnet 4.5 | `ki-agent/route.ts:309` | default | 4096 | — |
| Competitor analysis | Sonnet 4.5 | `competitor-run.ts:84` | default | 2048 | — |
| Viral score API | Sonnet 4.5 | `viral-score/route.ts:103` | default | 1536 | — |
| Trend script API | Sonnet 4.5 (default) | `trend-script/route.ts:132` | default | 4096 | Duplicate of agent tool path |
| Content kalender API | Sonnet 4.5 (default) | `content-kalender/route.ts:76` | default | 4096 | — |
| Niche / remix / outlier / store copy | Sonnet 4.5 (default) | various actions | default | varies | — |
| Blog generator | Sonnet 4.5 (default) | `blog/claude.ts:17` | default | param | — |
| API v1 text | Sonnet 4.5 (default) | `api-v1/generators.ts:51` | default | param | — |

### Agent tools verification (`claude-agent-tools.ts`)
| Tool | Prompt structure | Temp | JSON handling |
|------|------------------|------|---------------|
| Viral hook | Array of `{hook,type}` | 0.8 | `callClaudeJson` + fence strip |
| Trend script | `{hook, script[], cta, duration}` | 0.8 | Validated fields post-parse |
| Content kalender | 30-day array | 0.5 | Array length check |
| Product ad | `{headline, subheadline, body, cta, hashtags}` | 0.8 | Field validation |
| Full campaign | `{title, strategy, steps[], ...}` | 0.5 | Separate code path, 3000 tokens |

**Edge cases:** Empty arrays return `{error, fallback: null}`; parse failures caught; `scoreOutput` never throws (fallback score 100 on error — may mask quality issues).

### Quality scoring behavior
- **Threshold:** 70 (`qualityScoring.ts:9`)
- **Text retry:** `runWithQualityRetry` — max 1 retry (`qualityScoring.ts:121-168`)
- **Image retry:** `runVisualQAWithRetry` — max 1 free retry (`visualQuality.ts:312-447`)
- **Non-integer Claude score:** `clampScore` returns null → fallback scores 50–55; `scoreContent` extracts first `\d+` or returns 50
- **scoreOutput error path:** Returns `{ score: 100 }` — passes gate incorrectly

---

## PROVIDER CONFIGURATION

| Secret | Usage | Verified |
|--------|-------|----------|
| `FAL_API_KEY` / `FAL_KEY` | All fal calls via `getFalKey()` → `configureFalClient()` | Required for image/video/live creator |
| `ELEVENLABS_API_KEY` | TTS, clone, voice list | Checked at runtime in `synthesizeElevenLabsSpeech` |
| `AKOOL_CLIENT_ID` + `AKOOL_API_KEY` | Token auth (`akool.ts:19-20`) — **API_KEY used as clientSecret** | Both required for Akool features |
| `ANTHROPIC_API_KEY` | All Claude calls; must start with `sk-ant-` | `getAnthropicConfigError()` |
| `NEXT_PUBLIC_*` | Supabase anon, VAPID, Stripe price IDs, site URLs | **No AI keys exposed** |
| Hardcoded keys | None found | `sanitize-user-message.ts` strips key patterns from errors |

### fal.ai auth pattern
Every fal call should invoke `configureFalClient()` first — verified in image, video, lora, live-portrait, character, seedance, motion-transfer paths.

---

## MODEL VERSIONS & UPDATES

| Model | Current ID | Notes |
|-------|------------|-------|
| Flux image | `fal-ai/flux-2-pro` | Current FLUX.2 pro tier; correct primary |
| Flux legacy | `flux-pro`, `flux/dev`, `flux-pro/v1.1` | Fallback / dead code |
| Seedance | `bytedance/seedance-2.0/fast/...` | Newer than 1-lite; verify fal namespace (no `fal-ai/` prefix) |
| Kling product | v1.6 pro | v2/v2.5/v3 exist; product ads still on v1.6 |
| Kling motion | v3 pro motion-control | Current for motion transfer |
| Kling 2.5 | v2.5-turbo pro | Registered, disabled |
| ElevenLabs | `eleven_multilingual_v2` | Still standard; v3 models may exist for higher quality |
| Claude Sonnet | `claude-sonnet-4-5-20250929` | Default for Master Agent, agent tools, and dashboard text; check Anthropic docs for newer snapshot |
| Claude Haiku | `claude-haiku-4-5-20251001` | Melodia / prompt improve |
| PuLID | `fal-ai/flux-pulid` | Standard face-preservation stack |
| FlashHead | `fal-ai/flashhead` | Realtime avatar; alias `soulx-flashhead` |
| Seedream edit | v4.5 | ByteDance edit model on fal |

---

## CRITICAL ISSUES (fix immediately)

1. **Master Agent uses Opus, not Sonnet 4.5** — `anthropic-agent.ts:57,131` — higher cost/latency than agent tool spec; inconsistent with `claude-agent-tools.ts`.

2. **Product ad dashboard script uses Opus by default** — `product-ad-script.ts:85` — duplicate path from agent tools (Sonnet); cost and behavior divergence.

3. **`scoreOutput` failure returns score 100** — `qualityScoring.ts:107-108` — failed quality gate passes silently.

4. **Seedance blocking `fal.subscribe` on serverless** — Works only because `maxDuration=300`; no queue/poll pattern — risk on slow generations or platform limits.

5. **Kling product video blocking subscribe** — Same timeout dependency (`product-ad/generate` `maxDuration=300`); 75-credit jobs fail hard on timeout.

6. **AKOOL secret naming** — `AKOOL_API_KEY` acts as `clientSecret` in token exchange (`akool.ts:20`) — deployment docs must match or auth fails silently.

---

## WARNINGS (fix soon)

1. **Credit pricing mismatch for Bild Generator** — 5 credits labeled `fluxDev` but delivers `flux-2-pro` (`fal-credits.ts:12`, `image-generator-credits.ts:4`).

2. **`highRes` flag does not change flux-2-pro parameters** — Only affects fallback path and credit tier (`image-generator-fal.ts:157-191`).

3. **No ideogram-v3** — Spec expected ideogram; codebase uses Seedream v4.5 edit only.

4. **Dead fal-image helpers** — `generateTextToImage`, `generateFluxProImage`, `generateFluxDevImage` exported but never called.

5. **Dashboard image routes lack quality scoring** — `/api/generate-image` has enhancer but no `runVisualQAWithRetry`.

6. **Motion transfer credits (8) vs Kling product (75)** — Same Kling family; possible margin issue.

7. **Multiple dashboard text routes default to Opus** — trend-script API, content-kalender API, ki-agent, thumbnail, viral-hook API, etc.

8. **Seedance model ID lacks `fal-ai/` prefix** — May break if fal changes routing; verify against fal model registry.

9. **flux-2-pro omits steps/guidance** — Relies on model defaults; document or tune if quality inconsistent.

10. **KI Influencer casting / product preview skip visual QA** — Enhancer yes, no auto-retry.

---

## PASSED (working correctly)

1. **Primary Bild Generator uses `fal-ai/flux-2-pro`** with negative prompt correctly omitted (`image-generator-fal.ts:48-84`).

2. **Image size short edge ≥1080px** for flux-2-pro via `resolveFlux2ProImageSize` (`generation-config.ts:301-318`).

3. **Fallback chain** flux-2-pro → flux-pro (highRes) → flux/dev on error.

4. **`imagePromptEnhancer.ts` integrated** in standard image pipeline and character/seedream paths.

5. **Agent text tools use Sonnet 4.5** with temperature 0.8/0.5 split and JSON fence stripping.

6. **`runWithQualityRetry` and `runVisualQAWithRetry`** implement threshold 70 with one retry in agent/campaign flows.

7. **LoRA training uses async queue + webhook** — appropriate for long jobs.

8. **Akool talking photo / UGC use client polling** — avoids Vercel blocking on video completion.

9. **Kling 2.5 completely disabled** — `KLING_25_PROVIDER_ENABLED = false`, dashboard flow hidden (`dashboard-flows.ts:59`).

10. **ElevenLabs uses `eleven_multilingual_v2`** with consistent voice_settings.

11. **No hardcoded API keys** in source; env-based configuration throughout.

12. **FAL key dual support** — `FAL_API_KEY` and `FAL_KEY` alias.

---

## RECOMMENDATIONS (improvements)

1. **Standardize Claude model** — Use `claude-sonnet-4-5-20250929` for all production text unless Opus is explicitly required (Master Agent: evaluate Sonnet for cost).

2. **Align credit labels with actual models** — Rename `fluxDev` credit tier or map 5 credits to flux-2-pro explicitly.

3. **Implement highRes for flux-2-pro** — e.g. larger `image_size`, optional clarity upscale on highRes tier, or skip to flux-pro intentionally.

4. **Add queue polling for Seedance + Kling** — Return `request_id`, poll from client like LoRA training.

5. **Enable visual QA on dashboard generate-image** — Optional flag to run `runVisualQAWithRetry` for premium tier.

6. **Remove or wire dead fal-image exports** — Reduce confusion in audits.

7. **Fix `scoreOutput` error fallback** — Return 50 or fail closed, not 100.

8. **Evaluate Kling v2/v3 for product ads** — v1.6 may be superseded; A/B quality vs 75 credits.

9. **Enable Kling 2.5 when ready** — Flip `KLING_25_PROVIDER_ENABLED` and add `runKling25Generation` mirroring seedance.

10. **Document AKOOL env vars** — `AKOOL_CLIENT_ID` + `AKOOL_API_KEY` (secret) naming in deployment guide.

11. **Sync ElevenLabs voices** — Run `scripts/sync-elevenlabs-voices.mjs` periodically; fallback list has 12 voices.

12. **Consider `eleven_turbo_v2_5` or v3** for lower latency TTS if quality acceptable.

13. **Add explicit `num_inference_steps` to flux-2-pro** if fal API exposes them in future schema versions.

14. **Video QA** — TODOs in `qualityScoring.ts:170-171` for scene continuity scoring.

---

## Appendix: Complete fal.ai call index

| File | Line | Model ID | Method |
|------|------|----------|--------|
| `image-generator-fal.ts` | 86 | `fal-ai/flux-2-pro` | subscribe |
| `image-generator-fal.ts` | 125 | `fal-ai/flux-pro` | subscribe (fallback) |
| `image-generator-fal.ts` | 149 | `fal-ai/flux/dev` | subscribe (fallback) |
| `image-generator-fal.ts` | 195 | `fal-ai/clarity-upscaler` | subscribe |
| `fal-image.ts` | 141 | `fal-ai/clarity-upscaler` | subscribe |
| `fal-image.ts` | 200 | `fal-ai/flux-pro` | subscribe (dead) |
| `fal-image.ts` | 241 | `fal-ai/flux-pro/v1.1` | subscribe (dead) |
| `fal-image.ts` | 273 | `fal-ai/flux/dev` | subscribe (dead) |
| `fal-image.ts` | 296 | `fal-ai/flux-pulid` | subscribe |
| `character-image-fal.ts` | 137 | `fal-ai/bytedance/seedream/v4.5/edit` | subscribe |
| `lora-fal.ts` | 90,101 | portrait-trainer / fast-training | queue.submit |
| `lora-fal.ts` | 146 | `fal-ai/flux-lora` | subscribe |
| `seedance-generate.ts` | 174 | `bytedance/seedance-2.0/fast/image-to-video` | subscribe |
| `fal-video.ts` | 34 | `fal-ai/kling-video/v1.6/pro/image-to-video` | subscribe |
| `motion-transfer-generate.ts` | 60 | `fal-ai/ffmpeg-api/extract-frame` | subscribe |
| `motion-transfer-generate.ts` | 173 | `fal-ai/kling-video/v3/pro/motion-control` | subscribe |
| `live-portrait/route.ts` | 85 | `fal-ai/live-portrait` | subscribe |
| `avatar/start-render/route.ts` | 79 | `fal-ai/live-portrait` | subscribe |
| `live-creator/portrait-frame/route.ts` | 113 | `fal-ai/live-portrait` | subscribe |
| `LiveCreatorStudioInner.tsx` | 359 | `fal-ai/flashhead` | realtime.connect |
| `fal/realtime-token/route.ts` | 32 | `fal-ai/flashhead` | REST token |

---

*End of audit.*

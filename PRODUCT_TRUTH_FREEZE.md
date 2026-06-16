# PRODUCT TRUTH FREEZE — Phase 1A

**Date:** 2026-06-16  
**Scope:** Canonical tool + credit registry (documentation only). No billing/runtime changes.

---

## Canonical registry

| Role | Path |
|------|------|
| **Canonical SSOT (new)** | `src/lib/tools/canonical-tool-registry.ts` |
| Types | `src/lib/tools/canonical-tool-types.ts` |
| Production data | `src/lib/tools/canonical-tools-data.ts` |
| Preview mock data | `src/lib/tools/canonical-tools-preview.ts` |

**Entry point:** `getCanonicalTool()`, `getProductionTools()`, `summarizeCreditMismatches()`

---

## Legacy registries (still in codebase)

| File | Runtime role | Phase 1B+ fate |
|------|--------------|----------------|
| `dashboard-tool-registry.ts` | AgentBox dev validation; ToolId audit | **Adapter** — read from canonical |
| `tool-registry.ts` | Szenen/Story/Image/Agent pages (`DynamicDashboardEngine`) | **Adapter** — model UI only; credits from canonical |
| `agent/tool-registry.ts` | Agent planner metadata, consent modes | **Adapter** — merge into canonical |
| `agent-tool-registry.ts` | Agent Autopilot v2 (2 modes) | **Adapter** |
| `canvas/toolApiSchema.ts` | Canvas workspace tools | **Adapter** |
| `canvas/tool-credit-costs.ts` | Canvas coin display | **Adapter** — Phase 1D delegates to `credit-display.ts` |
| `promptOptimizer.calculateExactCredits` | AgentBox UI credit display | **Replace** — highest mismatch source |
| `PreviewToolsFlow.tsx` TOOLS const | Design-preview mock | **Isolate** — never import for prod |

---

## Production vs preview

| Bucket | Count | Rule |
|--------|-------|------|
| Production tools | 50+ entries in `PRODUCTION_CANONICAL_TOOLS` | `isProduction: true` |
| Preview mock | 24 entries in `PREVIEW_MOCK_CANONICAL_TOOLS` | `isProduction: false`, `creditPolicy.mode: none` |
| Coming soon (prod ids) | 6 | `ref-to-video`, `jarvis-moderator`, `ai-support-agent`, `akool-production`, `holographic-avatar`, `akool-edge` |

Preview tools use id prefix `preview:` and must **never** drive billing, agent routing, or settings.

---

## Credit mismatches (UI vs API — documented, not fixed)

| Tool | UI (displayedCredits) | API (baseCredits) | Notes |
|------|----------------------|-------------------|-------|
| video-to-video | 15 | 40 | `calculateExactCredits` vs `AKOOL_TOOL_CREDITS.videoEditor` |
| ecommerce-ads | 8 | 15 | promptOptimizer vs akool-credits |
| szenen-generator | 15/30 flat (AgentBox) | dynamic | `unit_credit × duration`; tool-registry shows stale 900–1100 |
| text-to-video | 10 flat (AKOOL_TOOLS) | dynamic / fallback 50 | |
| image-gen | 3 default | 5 / 8 | AgentBox vs IMAGE_GEN_CREDITS |
| img-to-img | 3 | 5 | variation mode |
| talking-avatar / lipsync | 10 | 20 | AKOOL_TOOLS flat vs lipsync API |
| talking-photo | 10 | 5 | route hardcoded 5 |
| character-studio | 10 | 25 | AKOOL_TOOLS flat |
| video-translation | 10 | 30/min | |
| melodia-tts | 2 | 3 | |
| voice-clone / voice-changer | 2 | 5 | |
| content-calendar | 2 | 2 API / 5 action | three paths |
| agent-autopilot | 1 orchestrator | 5 tool-registry label | |
| campaign-autopilot | dynamic lump | sumCampaignPlanCredits overcharge | no refund on fail |

Full list: `summarizeCreditMismatches()` in canonical-tool-registry.ts

---

## Post-pay / deferred risks (marked, not fixed)

| Tool / route | chargeTiming | Risk |
|--------------|--------------|------|
| ~~`/api/lora/train`~~ | ~~postpay~~ | **Fixed Phase 1B** — pre-pay |
| ~~`/api/stimme/speak`, `/api/stimme/clone`~~ | ~~postpay~~ | **Fixed Phase 1B** |
| ~~Server actions: niche, script, thumbnail, content calendar~~ | ~~postpay~~ | **Fixed Phase 1B** |
| ~~`/api/v1/*`~~ | ~~postpay~~ | **Fixed Phase 1B** — pre-pay + refund |
| `/api/live-creator` POST→GET | prepay POST + async refund GET | Legacy GET jobs without POST record — see Phase 1D |
| ~~`/api/agent/copilot`~~ | ~~none~~ | **Fixed Phase 1B** |
| ~~`/api/agent/stream-tool`~~ | ~~none~~ | **Fixed Phase 1B** |

---

## DOCS_REQUIRED (provider / model gaps)

Tools with `docsRequired: true` in canonical registry:

- **Akool catalog models** — szenen-generator, seedance, text-to-video, avatar-video, lipsync, character-studio, ecommerce-ads, video-translation, melodia paths
- **fal.ai** — image-gen modelId whitelist, ki-ich preview limits, live-portrait cost alignment, FlashHead realtime billing
- **ElevenLabs** — stimme routes, voice-preview abuse limits
- **OpenAI via Akool labels** — catalog entries only, no direct integration
- **Kling** — product-ad v1.6 wired; kling25-config has no dedicated route

Run `getToolsRequiringDocs()` for current list.

---

## What Phase 1A did NOT change

- No `deductCredits` / `withCreditDeduction` behavior
- No API route modifications
- No `calculateExactCredits` updates
- No UI component wiring
- No agent planner changes

---

## Recommended Phase 1B order

1. Wire `calculateExactCredits` to read `creditPolicy` from canonical registry (display only).
2. Add CI check: canonical `baseCredits` vs API constants drift detection.
3. Credit hardening: lora/train, stimme/*, api/v1, live-creator, agent/copilot.
4. Deprecate duplicate credit constants — single import from canonical variants.
5. Studio/Agent IA split using canonical `category` + `page` fields.

---

## Tests

After registry changes:

```bash
npx tsc --noEmit
npm run build
```

Both must pass before commit.

---

## Phase 1B Credit Hardening

**Date:** 2026-06-16  
**Scope:** Close critical unbilled-LLM and provider-before-credit leaks using existing helpers (`assertKiToolAccess`, `requireKiToolAccessForAction`, `withCreditDeduction`, `deductCredits`/`addCredits`). No full canonical-registry runtime migration.

### `/api/agent/copilot`

| Field | Value |
|-------|-------|
| **Status vorher** | Auth only, 0 credits, unbilled Anthropic stream |
| **Änderung** | `assertKiToolAccess(ORCHESTRATOR_BASE_COST)` + pre-pay 1 credit before stream |
| **Charge timing nachher** | Pre-pay (1 credit, orchestrator base) |
| **Refund** | `addCredits` on stream/Anthropic failure |
| **Admin bypass** | OK — via `deductCredits` / `isCreditExemptUser` |
| **Free-user** | Blocked — no active plan |
| **Rest-Risiko** | Low — single deduct per request |

### `/api/agent/stream-tool`

| Field | Value |
|-------|-------|
| **Status vorher** | Auth only, 0 credits |
| **Änderung** | `assertKiToolAccess` + pre-pay per tool (`viral-hook` 1, `content-calendar` 2, `trend-script` 3, default 1) |
| **Charge timing nachher** | Pre-pay before Anthropic fetch |
| **Refund** | `addCredits` on HTTP/body failure |
| **Admin bypass** | OK |
| **Free-user** | Blocked |
| **Rest-Risiko** | Low |

### `/api/stimme/speak` & `/api/stimme/clone`

| Field | Value |
|-------|-------|
| **Status vorher** | Post-pay — ElevenLabs before debit |
| **Änderung** | `withCreditDeduction` wraps provider call |
| **Charge timing nachher** | Pre-pay (2 credits speak / clone costs unchanged) |
| **Refund** | Auto via `withCreditDeduction` on provider error |
| **Admin bypass** | OK |
| **Free-user** | Blocked via `assertGatedFeature` |
| **Rest-Risiko** | Low — clone consent gate unchanged |

### `/api/lora/train`

| Field | Value |
|-------|-------|
| **Status vorher** | Post-pay — fal submit before `deductCredits` |
| **Änderung** | `deductCredits` moved before DB insert + fal submit |
| **Charge timing nachher** | Pre-pay (`calcLoraCredits(steps)`) |
| **Refund** | `addCredits` on DB insert failure or fal submit failure |
| **Admin bypass** | OK |
| **Free-user** | Blocked via `assertGatedFeature("lora-training")` + consent |
| **Rest-Risiko** | Low — fal job failure after submit still consumes slot; refund on submit error only |

### `/api/live-creator`

| Field | Value |
|-------|-------|
| **Status vorher** | Deferred POST→GET; Akool/ElevenLabs before debit |
| **Änderung** | POST: auth + credit check before providers; deduct before ElevenLabs TTS, fal upload, Akool job; generation record with `paidOnPost: true`. GET: legacy jobs without record still deduct once on completion |
| **Charge timing nachher** | Pre-pay on POST for new jobs |
| **Refund** | `addCredits` on POST failure after deduct |
| **Admin bypass** | OK |
| **Free-user** | Blocked via `assertGatedFeature` |
| **Rest-Risiko** | **Phase 1C** — Akool async failure after successful POST does not auto-refund; legacy GET-poll jobs may double-charge if POST record missing |

### `/api/v1/*`

| Field | Value |
|-------|-------|
| **Status vorher** | Post-pay — `withCredits` deducted after generation |
| **Änderung** | `withCredits` in `generators.ts` now deducts before `run()`, refunds on throw |
| **Charge timing nachher** | Pre-pay + refund on `GENERATION_FAILED` |
| **Refund** | `addCredits` in catch before rethrow |
| **Admin bypass** | N/A — API key auth, service-role deduct |
| **Free-user** | Blocked — API key requires paid account credits |
| **Rest-Risiko** | **Phase 1C** — fal image partial success paths; rate-limit vs credit race |

### Server Actions

| Action | Status vorher | Änderung | Charge nachher | Refund | Rest-Risiko |
|--------|---------------|----------|----------------|--------|--------------|
| `analyzeNiche` | Post-pay | `withCreditDeduction` | Pre-pay 2 | Auto | Low |
| `generateScript` / `regenerateScript` | Post-pay | `withCreditDeduction` | Pre-pay 2 / 1 | Auto | Low |
| `generateThumbnailConcepts` | Post-pay | `withCreditDeduction` | Pre-pay 1 | Auto | Low — DB save failure does not refund (intentional, credits for LLM) |
| `generateContentCalendar` | Post-pay | `withCreditDeduction` | Pre-pay 5 | Auto | Low |

### Still open (Phase 1C billing) — resolved in Phase 1D

- ~~`campaign-autopilot` lump-sum overcharge / no refund~~ → partial refund on total failure (Phase 1D)
- ~~Live-creator async Akool failure refund policy~~ → GET refund with `paidOnPost` (Phase 1D)

---

## Phase 1C Credit Display Sync

**Date:** 2026-06-16  
**Scope:** Sync visible UI credit labels with API/runtime truth via `src/lib/tools/credit-display.ts`. No billing logic changes.

**New helpers:** `getCreditDisplayLabel`, `getCreditDisplayMeta`, `formatCreditPolicy`, `formatCreditsAmount`  
**Wired into:** `calculateExactCredits`, `formatCreditCostForTool`, `AgentBox`, `DynamicDashboardEngine`, `text-to-video` page, preview tools flow.

### Corrected tools

| Tool | UI vorher | Runtime/API | Neue Anzeige | Quelle | Rest-Risiko |
|------|-----------|---------------|--------------|--------|-------------|
| video-to-video / ai-video-editor | 15 | 40 | 40 Credits | `AKOOL_TOOL_CREDITS.videoEditor` | Low |
| ecommerce-ads | 8 | 15 | 15 Credits | canonical / API | Low |
| szenen-generator / img-to-video | flat 15/30 | dynamic unit×duration | Dynamisch nach Modell & Dauer | canonical dynamic | Model-specific estimate on studio page |
| text-to-video | flat 10 / 15–30 | dynamic + fallback 50 | Dynamisch · Fallback 50 | canonical + API | Page uses fallback for affordance check |
| image-gen | 3 default | 5 / 8 highRes | 5–8 Credits | `IMAGE_GEN_CREDITS` | Model whitelist drift (docs) |
| img-to-img | 3 | 5 | 5 Credits | API variation | Low |
| talking-avatar / lipsync | 10 | 20 | 20 Credits | `AKOOL_TOOL_CREDITS.lipsync` | Low |
| character-studio | 10 | 25 | 25 Credits | `AKOOL_TOOL_CREDITS.characterStudio` | Low |
| melodia TTS | 2 | 3 | 3 Credits | `AKOOL_TOOL_CREDITS.tts` | Low |
| voice-clone / voice-changer | 2 | 5 | 5 Credits | `AKOOL_TOOL_CREDITS` | Low |
| content-calendar | 2 flat | 2 AgentBox / 5 action | 2 Credits (AgentBox) · 5 (Dashboard) | canonical variants | Three paths documented |
| agent-autopilot | 5 (tool-registry) | 1 base + tools | 1 Credit Basis · Tools extra | `ORCHESTRATOR_BASE_COST` | Per-tool charges vary |

### Dynamische Tools (neue Labels)

| Tool | Anzeige |
|------|---------|
| szenen-generator | Je Modell & Dauer / Dynamisch nach Modell & Dauer |
| text-to-video | Dynamisch · Fallback 50 |
| avatar-video | Dynamisch nach Optionen |
| video-translation | Je Minute · ab 30 Credits |
| Preview mock tools | Preview (keine erfundenen Preise) |

### calculateExactCredits

**Geändert** — delegiert an `getCreditAffordanceAmount()` aus `credit-display.ts`. Liefert numerischen Mindestwert für Affordance-Checks; dynamische Tools ohne sicheren Mindestwert → 0 (UI blockiert nicht hart).

### Offene Display-Risiken (nach Phase 1D)

- Akool catalog model pricing ohne vollständige UI-Schätzung auf allen Seiten
- `campaign-autopilot` geschätzte Credits vs tatsächliche Summe (partial failure)
- `szenen-generator` — kein sicheres UI-Minimum

---

## Phase 1D Remaining Credit Consistency

**Date:** 2026-06-16  
**Scope:** Close remaining credit display mismatches, dynamic affordance minimums, Canvas SSOT wiring, partial refund hardening, server-action pre-pay. No landing/design changes, no billing architecture refactor.

### Talking Photo / Talking Avatar Entscheidung

**Separate provider flows — not merged into one tool id.**

| Display id | Label (UI) | Route / Page | Credits | Provider |
|------------|------------|--------------|---------|----------|
| `talking-photo` | Live Portrait (fal.ai) · 5 Credits | `/api/live-portrait`, `/dashboard/live-portrait` | **5** | fal.ai live-portrait |
| `talking-avatar` | Lip Sync (Akool) · 20 Credits | `/api/akool/lipsync`, `/dashboard/lipsync-studio` | **20** | Akool lipsync |
| `live-creator` | Live Creator Video (Akool) · 10 Credits | `/api/live-creator` POST | **10** | Akool talking-photo video |
| `live-creator-portrait` | Live Creator Portrait · 20 Credits | `/api/live-creator/portrait-frame` | **20** | fal portrait frame |

Sidebar: `talking-avatar` → "Lip Sync", `talking-photo` → "Live Portrait".  
Canonical registry updated (`displayedCredits` talking-photo 5, live-creator prepay).

### Dynamische Tool-Minimums

| Tool | Anzeige | Mindest-/Startwert | Quelle |
|------|---------|-------------------|--------|
| `text-to-video` | Dynamisch · Fallback 50 | startingCredits **50** | API runtime fallback |
| `video-translation` | Je Minute · ab 30 Credits | minimumCredits **30** | `AKOOL_TOOL_CREDITS.videoTranslationPerMinute` |
| `live-creator` | 10 Credits | minimum/starting **10** | POST `CREDIT_COST` |
| `szenen-generator` | Dynamisch nach Modell & Dauer | null (kein fixes Minimum) | Akool unit×duration — DOCS_REQUIRED |
| `agent-autopilot` | 1 Credit Basis · Tools extra | minimum **1** | `ORCHESTRATOR_BASE_COST` |

`getCreditAffordanceAmount()` resolves: `affordanceAmount ?? startingCredits ?? minimumCredits ?? 0`.

### Canvas Credit Status

**Angebunden (display-only)** — `src/lib/canvas/tool-credit-costs.ts` delegates mapped tools to `credit-display.ts` via `CANVAS_CANONICAL_MAP` + `getCanvasToolDisplayLabel()`.  
Unmapped tools keep legacy `CANVAS_TOOL_BASE_COINS` constants.  
Runtime billing unchanged (API routes). Canvas is workspace/experimental — not a second billing SSOT.

Fixed display drift: `melodia-studio` 3 (tts), `agent-autopilot` 1, `trend-script` uses `TREND_SCRIPT_TOOL_CREDIT_COST`.

### Campaign Autopilot

| Field | Value |
|-------|-------|
| **Status** | Partially hardened |
| **Änderung** | `executeRealCampaign`: refund lump sum if deduct succeeded but **zero** plan steps completed (`toolRuns.length === 0`) |
| **Nicht gelöst** | Partial failure (some steps OK, later step throws) — no per-step refund; overcharge vs actual tool usage remains |
| **Phase-2** | Per-step `withCreditDeduction` or post-hoc reconciliation against `sumCampaignPlanCredits` |

### Live Creator Async Refund

| Field | Value |
|-------|-------|
| **Status** | **Gelöst** (POST-paid jobs) |
| **Mechanismus** | GET poll: if Akool `failed` + generation `paidOnPost: true` + not `refundedOnFail` → `addCredits(10)` + flag |
| **POST failure** | Unchanged Phase 1B — refund on throw after deduct |
| **Legacy** | Jobs without POST generation record still deduct on GET complete (documented) |

### Weitere Actions

| Action | Vorher | Nachher |
|--------|--------|---------|
| `generate-trend-script` | Post-pay Claude | `withCreditDeduction` pre-pay (4 credits — dashboard action cost, API route uses 3) |
| `extract-viral-hook` | Post-pay Claude | `withCreditDeduction` pre-pay (local `VIRAL_HOOK_CREDIT_COST`) |
| `generate-voice` | ElevenLabs before deduct | `withCreditDeduction` pre-pay + refund on TTS fail |

**Documented mismatch:** trend-script action 4 vs `/api/trend-script` 3 — intentional dual path, not changed in 1D.

### Lint-Status (Phase 1D)

| Check | Result |
|-------|--------|
| Pre-existing errors | **17** (before Phase 1A) |
| Phase 1D new errors | None expected — fix only if introduced |
| Policy | Do not mass-fix legacy lint in Phase 1D |

### Offene Risiken nach Phase 1D

| Risk | Phase |
|------|-------|
| Campaign partial failure / overcharge lump sum | Phase 2 |
| Live-creator legacy GET-only jobs | Phase 2 |
| Szenen-generator per-model UI estimate | Phase 2 / DOCS_REQUIRED |
| trend-script 4 vs 3 credit paths | Phase 2 unify |
| Akool catalog pricing completeness | Phase 3 |

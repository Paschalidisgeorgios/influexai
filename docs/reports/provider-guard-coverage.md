# Provider Guard Coverage Matrix

**Date:** 2026-06-16  
**Branch:** `launch-train/overnight-safe-completion`  
**Scope:** All `src/app/api/**/route.ts` handlers (152 total)

---

## Summary

| Category | Count | Provider guard | `PROVIDERS_DISABLED` checked server-side |
|----------|------:|----------------|------------------------------------------|
| Provider guard (`providerRouteGuardResponse`) | **85** | ✅ Yes | ✅ Yes (503) |
| Dev-write guard only | **33** | ❌ No | ❌ N/A (no external AI) |
| No guard (intentional or gap) | **34** | ❌ No | ❌ No |

**Guard chain:** `providerRouteGuardResponse()` → `providerExecutionGuardResponse()` (PROVIDERS_DISABLED) → `developmentWriteGuardResponse()` (prod-like env in dev).

**Unit tests:** `tests/unit/lib/provider-execution-guard.test.ts` (4 tests).

---

## Legend

| Column | Meaning |
|--------|---------|
| **Guard** | Uses `providerRouteGuardResponse` at handler entry |
| **DISABLED** | Blocked when `PROVIDERS_DISABLED=true` |
| **Risiko** | Low / Medium / High for accidental provider spend |
| **Nächste Aktion** | Recommended follow-up |

---

## A. Provider-Guarded Routes (85) — FULL COVERAGE

All routes below call `providerRouteGuardResponse()` and return HTTP **503** with `code: "PROVIDERS_DISABLED"` when the kill switch is set.

### A1 — Bild & Upscale (FAL) — first smoke tier

| Route | Tool / feature | Provider | Risiko | Nächste Aktion |
|-------|----------------|----------|--------|----------------|
| `POST /api/generate-image` | `image-gen` | FAL | **Low** | **First staging smoke candidate** |
| `POST /api/character-image` | Character image | FAL | Medium | Smoke after generate-image |
| `POST /api/upscale-image` | Upscaler | FAL | Low | Optional second smoke |
| `POST /api/upscale` | Upscaler alt | FAL | Low | Same as upscale-image |
| `POST /api/generate` | Legacy generate | FAL/LLM | Medium | Audit overlap with generate-image |
| `POST /api/generate/demo` | Demo generate | FAL | Medium | Keep disabled in staging |
| `POST /api/generate/concierge` | Concierge | FAL/LLM | Medium | Defer |
| `GET/POST /api/fal/realtime-token` | Realtime | FAL | High | Defer (Live) |

### A2 — Video (FAL / Seedance / Akool)

| Route | Tool | Provider | Risiko | Nächste Aktion |
|-------|------|----------|--------|----------------|
| `POST /api/seedance` | img-to-video | Seedance/FAL | Medium | Phase 2 smoke |
| `GET /api/seedance/status` | Status poll | Seedance | Low | Pair with seedance |
| `GET /api/seedance/models` | Model list | Seedance | Low | Read-only-ish |
| `POST /api/akool/image-to-video` | img-to-video | Akool | Medium | Defer |
| `POST /api/akool/text-to-video` | text-to-video | Akool | Medium | Defer |
| `POST /api/akool/video-to-video` | v2v | Akool | High | Defer |
| `POST /api/akool/video-translation` | Translation | Akool | High | Defer |
| `POST /api/product-ad/generate` | Product ad video | FAL Kling | High | Defer |
| `POST /api/product-ad/script` | Ad script | LLM | Low | Text-only smoke later |
| `POST /api/video-remix` | Remix | LLM | Medium | Defer |

### A3 — LoRA (excluded from first smoke)

| Route | Provider | Risiko | Nächste Aktion |
|-------|----------|--------|----------------|
| `POST /api/lora/train` | FAL/train | **High** | Block until upload policy |
| `POST /api/lora/generate` | FAL | **High** | Block |
| `POST /api/lora/upload` | FAL | **High** | Block |
| `GET /api/lora/status/[id]` | Poll | Medium | N/A until train enabled |

### A4 — Face / Live / Motion (high risk)

| Route | Provider | Risiko | Nächste Aktion |
|-------|----------|--------|----------------|
| `POST /api/faceswap` | FAL | **High** | Explicit ban first phase |
| `POST /api/live-creator` | FAL | **High** | Defer |
| `POST /api/live-creator/studio` | FAL | **High** | Defer |
| `POST /api/live-creator/studio/heartbeat` | FAL | **High** | Defer |
| `POST /api/live-creator/portrait-frame` | FAL | **High** | Defer |
| `POST /api/live-portrait` | FAL | **High** | Defer |
| `POST /api/live-avatar/session` | Akool | **High** | Defer |
| `POST /api/live-avatar/heartbeat` | Akool | **High** | Defer |
| `POST /api/motion-transfer` | FAL | **High** | Defer |

### A5 — Ki-Influencer / AI Creator (upload-heavy)

| Route | Risiko | Nächste Aktion |
|-------|--------|----------------|
| `POST /api/ki-influencer/upload-photo` | **High** | No staging |
| `POST /api/ki-influencer/training-set` | **High** | No staging |
| `POST /api/ki-influencer/train` | **High** | No staging |
| `POST /api/ki-influencer/generate` | **High** | No staging |
| `POST /api/ki-influencer/create-from-upload` | **High** | No staging |
| `POST /api/ki-influencer/finalize-upload` | **High** | No staging |
| `POST /api/ki-influencer/casting` | Medium | Defer |
| `GET /api/ki-influencer/status/[id]` | Low | Poll only |
| `POST /api/ai-creator/characters/[id]/upload-shell` | **High** | No staging |

### A6 — Akool suite (guarded)

| Route | Feature | Risiko |
|-------|---------|--------|
| `POST /api/akool` | Generic | Medium |
| `POST /api/akool/character-studio` | Character | High |
| `POST /api/akool/ecommerce-ads` | Ads | Medium |
| `POST /api/akool/lipsync` | Lipsync | High |
| `POST /api/akool/tts` | TTS | Medium |
| `POST /api/akool/voice-clone` | Voice clone | High |
| `POST /api/akool/voice-changer` | Voice | Medium |
| `GET /api/akool/voices` | List | Low |
| `GET /api/akool/status` | Poll | Low |

### A7 — Avatar / UGC (RunPod / Akool)

| Route | Risiko | Nächste Aktion |
|-------|--------|----------------|
| `POST /api/avatar/create-job` | **High** | Defer |
| `POST /api/avatar/start-render` | **High** | Defer |
| `POST /api/ugc-video` | **High** | Defer |
| `GET /api/ugc-video/voices` | Low | List |
| `GET /api/ugc-video/avatars` | Low | List |
| `GET /api/ugc-video/hooks` | Low | List |

### A8 — Audio

| Route | Provider | Risiko |
|-------|----------|--------|
| `POST /api/stimme/speak` | ElevenLabs/FAL | Medium |
| `POST /api/stimme/clone` | ElevenLabs | High |
| `POST /api/elevenlabs/voice-preview` | ElevenLabs | Medium |
| `POST /api/test-elevenlabs` | ElevenLabs | Medium |
| `POST /api/melodia` | Music | Medium |

### A9 — Text / Analysis (LLM — guarded)

| Route | Tool | Risiko |
|-------|------|--------|
| `POST /api/viral-hook` | viral-hook | Low |
| `POST /api/content-kalender` | content-calendar | Low |
| `POST /api/trend-script` | trend-script | Low |
| `POST /api/thumbnail-concept` | thumbnail | Low |
| `POST /api/niche-analyzer` | niche | Low |
| `POST /api/outlier-detector` | outlier | Low |
| `POST /api/competitor` | competitor | Medium |
| `POST /api/competitor-analysis` | competitor | Medium |
| `POST /api/viral-score` | viral-score | Low |
| `POST /api/ki-ich` | Mein KI-Ich | Medium |

### A10 — Agent orchestration (guarded — may invoke tools)

| Route | Risiko | Nächste Aktion |
|-------|--------|----------------|
| `POST /api/agent` | **High** | Defer until single-tool smoke passes |
| `POST /api/agent/copilot` | **High** | Defer |
| `POST /api/agent/execute` | **High** | Defer |
| `POST /api/agent/stream-tool` | **High** | Defer |
| `POST /api/agent/intent-route` | Medium | Defer |
| `POST /api/agent/campaign` | Medium | Defer |
| `POST /api/ki-agent` | **High** | Defer |
| `POST /api/ki-agent/suggested-prompts` | Low | Optional |
| `POST /api/onboarding/copilot` | Low | Optional |

### A11 — Public API v1 wrappers (guarded)

| Route | Maps to |
|-------|---------|
| `POST /api/v1/image` | generate-image |
| `POST /api/v1/script` | script tools |
| `POST /api/v1/thumbnail` | thumbnail |
| `POST /api/v1/niche` | niche |
| `POST /api/v1/outlier` | outlier |
| `POST /api/v1/viral-score` | viral-score |

---

## B. Dev-Write Guard Only (33) — NO PROVIDER GUARD

Mutations blocked in non-production runtimes with production-like signals. **No `PROVIDERS_DISABLED` check** — acceptable when route does not call external AI.

| Route | Purpose | External AI? | Risiko | Nächste Aktion |
|-------|---------|--------------|--------|----------------|
| `POST /api/stripe/checkout` | Stripe test checkout | No | Low | OK |
| `POST /api/stripe/subscribe` | Subscription | No | Low | OK |
| `POST /api/stripe/credits-checkout` | Credit pack | No | Low | OK |
| `POST /api/stripe/agency-*` | Agency billing | No | Low | OK |
| `POST /api/credits/checkout` | Credits | No | Low | OK |
| `POST /api/credits/payment-intent` | Payment | No | Low | OK |
| `POST /api/agency/checkout` | Agency | No | Low | OK |
| `POST /api/dashboard/asset` | Legacy `gallery_assets` write | No | Low | See gallery decision |
| `POST /api/dashboard/delete-account` | Account delete | No | Medium | OK |
| `POST /api/dashboard/revoke-contract` | Contract | No | Low | OK |
| `POST /api/scrape-product` | URL scrape | **Yes (fetch)** | Medium | Consider provider guard if headless/browser |
| `POST /api/share/*` | Social post | OAuth | Medium | OK without provider guard |
| `POST /api/push/*` | Push notifications | No | Low | OK |
| `POST /api/purchase-image-download` | Credit deduct | No | Low | OK |
| `POST /api/lora/delete` | DB delete | No | Low | OK |
| `POST /api/ai-creator/characters/*` | CRUD | No | Low | OK |
| `POST /api/agent/publish` | Publish | No | Low | OK |
| Other tracking/beta/admin promo | Analytics | No | Low | OK |

---

## C. No Guard (34) — REVIEW LIST

### C1 — Intentionally unguarded (inbound / read-only / deprecated)

| Route | Reason | Risiko | Nächste Aktion |
|-------|--------|--------|----------------|
| `POST /api/stripe/webhook` | Inbound Stripe; signature verified | Low | Keep |
| `POST /api/webhooks/stripe` | Duplicate webhook path | Low | Keep |
| `POST /api/lora/webhook` | Inbound FAL webhook | Medium | Secret-based auth |
| `POST /api/avatar/runpod-callback` | Inbound callback | Medium | Secret-based |
| `GET /api/v1/me` | Read profile | Low | OK |
| `GET /api/v1/credits` | Read credits | Low | OK |
| `GET /api/v1/generations` | Read generations | Low | OK |
| `GET /api/dashboard/init` | Credits + legacy gallery read | Low | OK |
| `GET /api/community/preview/[id]` | Public preview read | Low | OK |
| `GET /api/checkout/status` | Payment status | Low | OK |
| `GET /api/credits/payment-status` | Payment status | Low | OK |
| `GET /api/stripe/session` | Session read | Low | OK |
| `GET /api/auth/is-admin` | Admin check | Low | OK |
| `GET /api/admin/*` | Admin stats/export | Low | OK |
| `GET /api/beta/stats` | Stats | Low | OK |
| `GET /api/avatar/job/[id]` | Job status read | Low | OK |
| `GET /api/ki-influencer/characters` | List | Low | OK |
| `GET /api/ki-influencer/schema-status` | Schema | Low | OK |
| `POST /api/produkt-werbung` | **410 deprecated** | None | OK |
| `POST /api/newsletter/confirm` | Email confirm | Low | OK |
| `POST /api/sentry-test` | Sentry | Low | OK |
| `POST /api/trends/broll-match` | Local JSON vectors only | None | OK |
| `POST /api/agent/plan-preview` | Local heuristic preview | None | OK |

### C2 — Potential gaps (no guard, may warrant review)

| Route | Concern | Risiko | Nächste Aktion |
|-------|---------|--------|----------------|
| *(none critical in C2)* | All mutating provider routes covered in §A | — | Re-scan on new routes |

---

## D. Coverage Gaps & Recommendations

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| Legacy `gallery_assets` vs `generations` | Medium (data) | See `gallery-persistence-decision.md` |
| Agent routes can chain tools | High (ops) | Enable only after single-route smoke |
| `scrape-product` external fetch | Medium | Document as non-FAL; monitor separately |
| Inbound webhooks without PROVIDERS_DISABLED | Low | Correct — inbound only |

---

## E. Verification Commands

```bash
# Count provider-guarded routes
rg -l "providerRouteGuardResponse" src/app/api | wc -l
# Expected: 85

# Spot-check generate-image
rg "providerRouteGuardResponse" src/app/api/generate-image/route.ts

# Run guard unit tests
npm run test:unit -- tests/unit/lib/provider-execution-guard.test.ts --run
```

---

## References

- `src/lib/environment-safety.server.ts` — guard implementations
- `docs/reports/provider-staging-smoke-plan.md` — first smoke candidate
- `docs/reports/final-self-review-safety-gate.md` — FULL MERGE gate

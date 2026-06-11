# InfluexAI Audit Report — 2026-06-11

**Scope:** Full read-only audit of the InfluexAI Next.js codebase (repo commit `a5a8724`).  
**Stack (actual):** Next.js **16.2.7**, TypeScript, Tailwind v3, Supabase, Stripe, fal.ai, ElevenLabs, Akool, Anthropic Claude (`claude-sonnet-4-5-20250929`).  
**Note:** Audit checklist references Next.js 15; project runs Next.js 16 with Turbopack.

**Commands run:**
- `npx tsc --noEmit` → **0 errors**
- `npm run build` → **success** (warnings: middleware→proxy deprecation, edge runtime static gen)

---

## 🔴 Critical (blocks launch or breaks functionality)

| # | Finding | Location | What's wrong | Fix |
|---|---------|----------|--------------|-----|
| C1 | Agent text runs free | `src/app/api/agent/execute/route.ts` L268, L287 | `usedCredits: 0` always returned; text tools via `orchestrate()` do not call `deductCredits` | Deduct per tool using `AGENT_TOOL_CREDITS` / registry after successful runs; return real `usedCredits` |
| C2 | Campaign credits not deducted | `src/lib/agent/campaignExecutor.ts` L345–349 | `usedCredits` is hardcoded sum; no `deductCredits` calls | Charge credits per executed campaign step via RPC |
| C3 | Image generated before credit deduct | `src/app/api/generate-image/route.ts` L156–209 | FAL + storage complete before `deductCredits`; on 402 user keeps asset | Deduct first (hold) or rollback generation on deduct failure |
| C4 | Agent image QA double-billing | `src/lib/agent/visualQuality.ts` L332–378 | `runVisualQAWithRetry` calls `runImageGeneratorGeneration` twice; each run deducts credits | Single charge + retry flag, or cap at one billed generation |
| C5 | Checklist routes 404 | See routing table below | `/dashboard/trend-script`, `/dashboard/produkt-werbung`, `/dashboard/bild-generator`, `/dashboard/thumbnail`, `/dashboard/lora` have **no pages** | Add redirects in `middleware.ts` to canonical paths or create alias pages |
| C6 | Missing legal pages | — | `/widerruf` and `/faq` routes **do not exist** | Add `/widerruf` page + link from AGB/checkout; FAQ is landing-only (`Sections.tsx`) |
| C7 | Admin email mismatch | `src/lib/admin-allowlist.ts` L2–4 | Default allowlist is `paschalidis.georgio38@gmail.com`; audit expects `paschalidisgeorgios38@gmail.com` | Align allowlist with production admin email via `ADMIN_EMAIL_ALLOWLIST` env |
| C8 | Migration 059 not in production | `supabase/migrations/059_protect_profiles_sensitive_columns.sql` | Sensitive column protection (GUC + trigger) may be undeployed per project policy | Run staging test script `scripts/db/test-migration-059-profiles-security.sql` before controlled prod deploy |
| C9 | Plan gate bypass | `src/app/api/upscale-image/route.ts` L18–27, `src/app/api/purchase-image-download/route.ts`, `src/app/api/avatar/start-render/route.ts` | Auth only — no `assertKiToolAccess` / plan check | Add `assertKiToolAccess(creditCost)` like `generate-image` |
| C10 | `/admin` page client-only guard | `src/app/admin/page.tsx` L38–39 | Fetches `/api/admin/stats` client-side; page shell renders before auth | Server layout guard or redirect; API is protected (`requireAdmin`) but UI flashes |
| C11 | Wrong API paths in docs/registry | `src/lib/agent/tools-definition.ts` L125 | References `POST /api/image-generator` — **route does not exist** | Update to `/api/generate-image` |
| C12 | Kling 2.5 UI without backend | `src/lib/kling25-config.ts` L22 | `KLING_25_PROVIDER_ENABLED = false` but UI may expose model | Hide UI option or implement `runKling25Generation` |
| C13 | Direct profile credit update (test) | `src/app/api/test/set-credits/route.ts` L40 | `.update({ credits })` bypasses RPC | Gate behind `E2E_TEST_API` only in CI; block in production builds |
| C14 | No prompt-level safety block | `src/lib/agent/planner-guard.ts`, execute routes | NSFW/celebrity/minor prompts not rejected before AI calls | Add input moderation layer before orchestration |

---

## 🟡 Warning (degrades experience or has wrong data)

| # | Finding | Location | What's wrong | Fix |
|---|---------|----------|--------------|-----|
| W1 | Next.js version drift | `package.json` L49 | Next **16.2.7**, not 15 | Update docs/checklist |
| W2 | Build warning | build output | Middleware file convention deprecated (use proxy) | Plan Next 16 proxy migration |
| W3 | Credit/model mismatch | `src/lib/fal-credits.ts`, `src/lib/image-generator-fal.ts` L69–91 | Standard billed as `fluxDev` (5 cr) but primary model is `flux-2-pro` | Align pricing labels and `FAL_CREDITS` |
| W4 | `characters.training_images` column | Audit checklist vs schema | Column **does not exist** in `060_characters.sql`; API computes `training_images` from generations | Document as computed field; do not query DB column |
| W5 | No separate `credits` or `gallery` tables | `002_generations_and_credit_transactions.sql` | Credits live on `profiles.credits`; gallery = `generations` table | Update internal docs |
| W6 | Triple intent routers | `router.ts`, `intentRouter.ts`, `planner.ts` | Same prompt can map to different tools | Consolidate on registry planner |
| W7 | `avatar_workflow` / `thumbnail_concept` dropped | `src/lib/agent/toolOrchestrator.ts` L386+ | Intents fall through to viral-hook | Add orchestrator cases |
| W8 | Text quality retry doubles API cost | `src/lib/agent/qualityScoring.ts` L143 | Retries Claude without extra user credits (good for user, bad for margin) | Accept or cap retries |
| W9 | Visual QA stubs | `src/lib/agent/visualQuality.ts` L259–265 | `genderMatches: true` always | Implement real constraint checks |
| W10 | `scoreOutput` fallback 100 | `src/lib/agent/qualityScoring.ts` L91, L97 | LLM failure → pass quality gate | Fail closed or lower default score |
| W11 | FAQ vs Datenschutz | `messages/de.json` `landingPage.faq.a3` vs `src/app/datenschutz/page.tsx` | FAQ implies EU-only processing; Datenschutz lists US AI vendors | Align copy |
| W11 | DSGVO wording drift | `messages/de.json` L623 vs L1369 | `DSGVO-konform` vs `DSGVO-bewusst` | Pick one consistent term |
| W12 | German/English mix | `src/lib/dashboard-flows.ts` L410–613 | Sidebar categories in English | i18n keys in `de.json` |
| W13 | Duplicate agent routes | `/dashboard`, `/dashboard/agent`, `/dashboard/ki-agent` | Three entry points | Canonicalize to one route |
| W14 | Voice Agent still linked | `src/app/dashboard/voice-agent/page.tsx`, sidebar | Coming-soon page still in nav | Hide or badge non-clickable |
| W15 | `stimme/speak` vs `generate-voice` | `src/app/api/stimme/speak/route.ts` | 2 credits, no gallery; duplicate of 3-cr action | Deprecate or unify |
| W16 | ElevenLabs missing from `.env.local.example` | `.env.local.example` | No `ELEVENLABS_API_KEY`, `AKOOL_*`, `ANTHROPIC_API_KEY` | Document all required keys |
| W17 | Credit pack Stripe placeholders | `.env.local.example` L31–34 | `STRIPE_CREDITS_*=price_xxx` | Set real price IDs in deployment |
| W18 | `purchase-image-download` deduct order | `src/app/api/purchase-image-download/route.ts` | Credits deducted before unlock confirmed | Refund on unlock failure |
| W19 | Live-portrait external URL | `src/app/api/live-portrait/route.ts` | Often no `generated-assets` ingest | Persist to storage + gallery |
| W20 | Product-ad Kling v1.6 | `src/app/api/product-ad/generate/route.ts` | Oldest Kling; 75 credits/video | Evaluate v2.5+ upgrade |
| W21 | Agent registry stale href | `src/lib/agent/redirect-tools.ts` L22 | `/dashboard/produkt-werbung` (404) | Change to `/dashboard/produkt` |
| W22 | Most dashboard pages lack metadata | e.g. `src/app/dashboard/viral-hook/page.tsx` | Only `dashboard/admin/content` exports `metadata` | Add `metadata` or layout titles |
| W23 | Missing loading skeletons | `campaign-autopilot`, `seedance`, `motion-transfer`, `live-creator`, `live-portrait`, `avatar-studio` | Spinner or text-only loading | Add layout-matched skeletons |
| W24 | `AiOutputDisclaimer` gaps | `src/components/agent/MasterAgentChat.tsx` | Main dashboard agent has no disclaimer | Add below outputs |
| W25 | `ab-track` unauthenticated writes | `src/app/api/ab-track/route.ts` | Service role insert without auth | Rate limit + validation |
| W26 | Agency routes present | `/dashboard/agency`, `/api/agency/checkout` | Agency WIP should stay blocked per policy | Feature-flag or env gate before prod marketing |
| W27 | Custom domain redirect | HTTP check `www.influexai.com` | 302 → `influexai-com.l.ink` (DNS outside repo) | Verify Vercel domain config |
| W28 | `mockExecutor` naming | `src/lib/agent/mockExecutor.ts` L52 | Still exports `buildMockResult`; execute imports `createExecution` from same file | Rename module; remove dead mock paths |
| W29 | Voice clone API only | `src/app/api/stimme/clone/route.ts` | No UI; FAQ promises cloning | UI with consent or adjust marketing |
| W30 | Footer dead social links | `src/components/landing/Sections.tsx` ~586 | `href="#"` | Remove or add real URLs |

---

## 🟢 Passed (confirmed working correctly)

| # | Area | Evidence |
|---|------|----------|
| P1 | TypeScript compile | `npx tsc --noEmit` exit 0 |
| P2 | Production build | `npm run build` exit 0, 629 static pages generated |
| P3 | Claude model consistency | `SCRIPT_GENERATOR_MODEL`, `INTENT_ROUTER_MODEL`, `PLANNER_MODEL`, `IMAGE_PROMPT_ENHANCER_MODEL` = `claude-sonnet-4-5-20250929` |
| P4 | Plan preview no credits | `src/app/api/agent/plan-preview/route.ts` L31–32, L60 — `assertKiToolAccess(0)`, no deduct |
| P5 | Stripe webhook idempotency | `057_stripe_events.sql`, `058_processed_checkout_dedup.sql`, `webhook/route.ts` L480–507 |
| P6 | Subscription pricing | `src/lib/subscription-plans.ts` — Starter €9.99, Creator €49, Pro €99, Business €199 |
| P7 | Credit packs | `src/lib/credit-packages.ts` — 50/€5, 150/€12, 350/€25, 800/€45 |
| P8 | Stripe env naming | `NEXT_PUBLIC_STRIPE_INFLUEXAI_*` convention in `subscription-plans.ts` |
| P9 | Atomic credit RPC | `056_atomic_credits.sql`, `src/lib/credits.ts` `deductCredits` / `addCredits` |
| P10 | Auth middleware | `src/middleware.ts` L152–164 — unauthenticated `/dashboard/*` → `/auth/sign-in` |
| P11 | Admin API guard | `src/app/api/admin/stats/route.ts` L10–16 — `requireAdmin()` |
| P12 | Admin credit bypass server-side | `src/lib/credits.ts` L129 — `isCreditExemptUser` |
| P13 | Legal pages exist | `/impressum`, `/datenschutz`, `/agb`, `/cookies` |
| P14 | Processors in Datenschutz | Anthropic, fal.ai, ElevenLabs, Stripe, Supabase listed |
| P15 | No fake testimonials live | `SocialProofPopup` not mounted; no `garantiert viral` in codebase |
| P16 | Stimme/Musik activated | `VOICE_COMING_SOON = false` in `feature-flags.ts` |
| P17 | Live Creator activated | `LIVE_CREATOR_COMING_SOON = false` |
| P18 | Image prompt enhancer (main path) | `prepareImageGeneratorPrompts` → `enhanceImagePrompt` in `image-generator-prompt-pipeline.ts` |
| P19 | Flux primary model | `FAL_IMAGE_MODELS.FLUX_2_PRO` in `image-generator-fal.ts` L86 |
| P20 | Generated media ownership | `src/app/api/generated-image/[id]/route.ts` L27 — `getOwnedGeneration` |
| P21 | RLS on generations | `002_generations_and_credit_transactions.sql` L26–33 |
| P22 | RLS on creator_profiles | `062_creator_profiles.sql` L12–29 |
| P23 | RLS on agent_executions | `049_agent_executions.sql` L19–23 |
| P24 | agent_jobs table | `052_agent_jobs.sql` |
| P25 | campaign_results table | `050_campaign_results.sql` |
| P26 | agent_feedback table | `051_agent_feedback.sql` |
| P27 | stripe_events table | `057_stripe_events.sql` |
| P28 | lora_models table | `040_lora_models.sql` |
| P29 | characters table | `060_characters.sql` |
| P30 | Hydration warning | `src/app/layout.tsx` L142, L155 — `suppressHydrationWarning` on html/body |
| P31 | `/preise` redirect | `middleware.ts` L49–51 → `/pricing` |
| P32 | Tool loading skeletons (recent) | `tool-output-skeletons.tsx` wired in viral-hook, content-kalender, trend-to-script, produkt, ki-agent, voice |
| P33 | ElevenLabs TTS + gallery audio | `generate-voice.ts`, `/api/generated-audio/[id]` |
| P34 | Akool async polling | `live-creator/route.ts`, `ugc-video/route.ts` — charge on completion |
| P35 | Landing index exports | `src/components/landing/index.ts` — all exports resolve (no root `components/index.ts` exists; not required) |

---

## 📋 Todo (improvements, not blockers)

| # | Finding | Location | Suggestion |
|---|---------|----------|------------|
| T1 | No `components/index.ts` | — | Optional barrel file; not blocking |
| T2 | ~26 sidebar tools | `dashboard-flows.ts` | Collapse groups, favorites, search |
| T3 | Unused landing sections | `StackedDemoSection`, `LandingProofSection`, etc. | Archive or delete dead exports |
| T4 | `console.log` in production paths | ~25 files (e.g. `training-set/route.ts` 14×) | Replace with structured logger or remove |
| T5 | TODO/FIXME comments | `mockExecutor.ts`, `publish/route.ts`, etc. | Triage and close |
| T6 | Limited error boundaries | Only 7 `error.tsx` files | Add dashboard tool-level boundaries |
| T7 | Hero 3-video rotation | `HeroSection.tsx` L120–189 | Reduce mobile LCP impact |
| T8 | Kling version fragmentation | v1.6 product-ad, v3 motion, v2.5 disabled | Document matrix in ops runbook |
| T9 | GPT Image / Recraft evaluation | — | PoC on staging only |
| T10 | FAL sync-lipsync v3 evaluation | — | Compare vs Akool for talking creator |
| T11 | Favorite gallery feature | — | Not implemented (smoke test mentions it) |
| T12 | i18n for `AiOutputDisclaimer` | `AiOutputDisclaimer.tsx` L5–19 | Move to `messages/de.json` |
| T13 | E2E mock path | `src/lib/e2e-mock-generations.ts` | Ensure `E2E_MOCK_GENERATIONS=1` never in prod |
| T14 | Middleware → proxy migration | Next 16 warning | Follow Next.js 16 docs |
| T15 | Performance: GridReveal canvas | `GridReveal.tsx` | Disable on mobile |
| T16 | `creator_profiles` migration 062 | May not be in prod | Verify before agent memory features |
| T17 | Voice page ElevenLabs branding | `voice/page.tsx` | Consider user-facing “KI-Stimme” only |
| T18 | Melodia widget | `MelodiaWidget.tsx` TODO | Review if needed |
| T19 | Agency teaser on landing | `Sections.tsx` AgencyTeaserSection | Keep hidden if agency blocked |
| T20 | Unit test coverage | `vitest` configured | Expand beyond e2e smoke |

---

## Detailed checklist results

### 1. Build & compilation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ Success |
| Warnings | Middleware deprecation; edge runtime static gen |
| `components/index.ts` | ❌ Does not exist (not required) |
| `components/landing/index.ts` | ✅ Exports valid |

### 2. Routing & pages

| Requested path | Status | Actual / notes |
|----------------|--------|-----------------|
| `/` | ✅ | `src/app/page.tsx` |
| `/dashboard` | ✅ | Master Agent Chat |
| `/dashboard/viral-hook` | ✅ | |
| `/dashboard/content-kalender` | ✅ | |
| `/dashboard/trend-script` | ❌ 404 | Use `/dashboard/trend-to-script` |
| `/dashboard/produkt-werbung` | ❌ 404 | Use `/dashboard/produkt` |
| `/dashboard/ki-ich` | ✅ | |
| `/dashboard/bild-generator` | ❌ 404 | Use `/dashboard/image-generator` |
| `/dashboard/gallery` | ✅ | |
| `/dashboard/thumbnail` | ❌ 404 | Use `/dashboard/thumbnail-concept` |
| `/dashboard/lora` | ❌ 404 | Use `/dashboard/lora-training` |
| `/dashboard/ki-agent` | ✅ | |
| `/dashboard/campaign-autopilot` | ✅ | |
| `/dashboard/stimme-musik` | ✅ | Re-exports voice page |
| `/dashboard/live-creator` | ✅ | |
| `/admin` | ✅ | Client page; API guarded |
| `/preise` | ✅ redirect | → `/pricing` |
| `/business` | ✅ | |
| `/impressum` | ✅ | |
| `/datenschutz` | ✅ | |
| `/agb` | ✅ | |
| `/widerruf` | ❌ | Missing |
| `/faq` | ❌ | FAQ section on landing only |

**Metadata:** Most dashboard pages are `"use client"` without `export const metadata`.

### 3. API routes (checklist vs actual)

| Requested | Actual route | Auth | Credits RPC | Notes |
|-----------|--------------|------|-------------|-------|
| `/api/viral-hook` | ✅ | ✅ | ✅ | |
| `/api/content-kalender` | ✅ | ✅ | ✅ | |
| `/api/trend-script` | ✅ | ✅ | ✅ refund on fail | |
| `/api/product-ad/generate` | ✅ | ✅ | After success | No refund on FAL fail |
| `/api/ki-agent` | ✅ | ✅ | varies | |
| `/api/agent/execute` | ✅ | ✅ preflight | ❌ text not deducted | C1 |
| `/api/agent/campaign` | ✅ | ✅ preflight | ❌ not deducted | C2 |
| `/api/agent/job/[id]` | ✅ | ✅ | — | |
| `/api/agent/publish` | ✅ | ✅ | — | |
| `/api/bild-generator` | ❌ | — | — | Use `/api/generate-image` |
| `/api/ki-ich/train` | ❌ | — | — | KI-Ich: `/api/ki-ich` (portrait, not LoRA train) |
| `/api/ki-ich/status` | ❌ | — | — | KI-Influencer: `/api/ki-influencer/status/[id]` |
| `/api/stripe/checkout` | ✅ | ✅ | — | |
| `/api/stripe/webhook` | ✅ | signature | add_credits RPC | |
| `/api/admin/*` | ✅ | `requireAdmin` | — | |

**Total API routes:** 114 `route.ts` files under `src/app/api/`.

### 4. Supabase

| Table | Migration | RLS |
|-------|-----------|-----|
| profiles | pre-existing + patches | PARTIAL in repo (043, 059) |
| credits (column) | on `profiles.credits` | via 059 trigger when deployed |
| characters | 060 | ✅ |
| creator_profiles | 062 | ✅ |
| agent_executions | 049 | ✅ |
| campaign_results | 050 | ✅ |
| agent_feedback | 051 | ✅ |
| agent_jobs | 052 | ✅ |
| stripe_events | 057 | ✅ (service role) |
| generations (gallery) | 002, 032 | ✅ |
| lora_models | 040 | ✅ |

**RPC usage:** `deductCredits` / `addCredits` in `src/lib/credits.ts` — preferred path. Exceptions: agency tenant pool updates, test route, `credits_used` on generations row (not balance).

### 5. Authentication

| Check | Result |
|-------|--------|
| `/dashboard/*` protected | ✅ middleware |
| `/admin/*` protected | ✅ middleware + admin profile check |
| Admin server guard | ✅ `requireAdmin`, `isPlatformAdminServer` |
| Credit exempt admin | ✅ server `isCreditExemptUser` |
| Redirect unauthenticated | ✅ `/auth/sign-in?redirect=...` |
| Default admin email | ⚠️ `paschalidis.georgio38@gmail.com` (see C7) |

### 6. Stripe

| Check | Result |
|-------|--------|
| 4 subscription plans | ✅ €9.99 / €49 / €99 / €199 |
| 4 credit packs | ✅ €5 / €12 / €25 / €45 |
| Env convention | ✅ `NEXT_PUBLIC_STRIPE_INFLUEXAI_*` |
| `checkout.session.completed` | ✅ webhook L480 |
| `invoice.paid` | ✅ webhook L501 |
| `customer.subscription.deleted` | ✅ webhook L507 |
| `stripe_events` idempotency | ✅ |

### 7. Credits system

| Check | Result |
|-------|--------|
| Signup 0 credits | ✅ `024_paid_only_new_users.sql` |
| Plan required for KI tools | ✅ mostly `assertKiToolAccess` |
| Admin bypass | ✅ |
| Deduct before AI | ❌ many routes deduct after (generate-image, seedance, etc.) |
| Refund on failure | PARTIAL (trend-script yes; most image/video no) |
| Agent/campaign billing | ❌ Critical C1/C2 |

### 8. AI integrations

| Check | Result |
|-------|--------|
| Anthropic model | ✅ sonnet 4.5 everywhere checked |
| fal.ai flux-2-pro primary | ✅ |
| imagePromptEnhancer before fal (Bild Generator) | ✅ via pipeline |
| KI-Ich `/api/ki-ich` | ⚠️ uses flux-pulid; enhancer not in ki-ich path |
| Quality retry < 70 | ✅ text: no extra credit; image agent: **double charge** |
| ElevenLabs | ✅ code complete; env in Vercel per ops |
| Akool async | ✅ |
| Mock data in prod | ✅ only `E2E_MOCK_GENERATIONS=1` paths |

### 9. UI & design

| Check | Result |
|-------|--------|
| Acid Noir tokens | PARTIAL — mix of Tailwind + inline styles on older pages |
| Loading skeletons | PARTIAL — see W23 |
| Error states | PARTIAL — most tools show inline errors |
| Mobile | PARTIAL — overflow guards present; hero heavy |
| Duplicate KI Agent nav | ⚠️ `/dashboard`, `/dashboard/agent`, `/dashboard/ki-agent` |
| suppressHydrationWarning | ✅ layout.tsx |

### 10. Environment variables (used in codebase)

**Public (client-safe):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_*` (8 plan price IDs)
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

**Server-only (must NOT be NEXT_PUBLIC):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CREDITS_50/150/350/800`
- `FAL_API_KEY` / `FAL_KEY`
- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY`
- `AKOOL_CLIENT_ID`, `AKOOL_API_KEY`
- `ADMIN_EMAIL_ALLOWLIST`
- `RESEND_API_KEY`, `YOUTUBE_API_KEY`
- `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `E2E_TEST_API`, `PLAYWRIGHT`, `E2E_MOCK_GENERATIONS`

**Missing from `.env.local.example`:** `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `AKOOL_*`, `ADMIN_EMAIL_ALLOWLIST`, `RESEND_API_KEY` (W16).

### 11. Performance & code quality

| Metric | Finding |
|--------|---------|
| useEffect cleanup | Not exhaustively audited; hero videos have cleanup |
| Error boundaries | 7 route-level `error.tsx` |
| console.log | ~25 files with logs |
| TODO/FIXME | ~14 matches across 5 files |
| next/image | Most landing/dashboard images use `next/image`; some `<img>` in visualizer |

### 12. COMING SOON / locked features

| Feature | Flag | Status |
|---------|------|--------|
| Stimme & Musik | `VOICE_COMING_SOON` | **false** — active |
| Live Creator | `LIVE_CREATOR_COMING_SOON` | **false** — active |
| Voice Agent | `dashboard-flows.ts` `locked: true` | Coming soon page |
| Kling 2.5 provider | `KLING_25_PROVIDER_ENABLED` | **false** — UI may show option |
| Agency / White-label | routes exist | WIP — block deploy per policy |
| Campaign autopilot preview flag | `CAMPAIGN_AUTOPILOT_IS_PREVIEW` | **false** — real execution |

---

## Modell-Matrix (summary)

| Workflow | Model | API | Credits |
|----------|-------|-----|---------|
| Bild Generator Standard | fal-ai/flux-2-pro | /api/generate-image | 5 |
| Bild High-Res | flux-2-pro (+ flux-pro fallback) | /api/generate-image | 8 |
| Charakter Edit | seedream v4.5/edit | /api/character-image | 5 |
| KI-Ich | flux-pulid | /api/ki-ich | 8 |
| Upscale | clarity-upscaler | /api/upscale-image | 4 |
| LoRA infer | flux-lora | /api/lora/generate | 2 |
| Seedance I2V | seedance 2.0 | /api/seedance | 40 |
| Product Ad | kling v1.6 | /api/product-ad/generate | 75 |
| Motion Transfer | kling v3 | /api/motion-transfer | 8 |
| Live Creator | Akool + ElevenLabs | /api/live-creator | 10 |
| UGC Video | Akool | /api/ugc-video | 5 |
| TTS | ElevenLabs | generate-voice action | 3 |
| Agent text | Claude Sonnet 4.5 | /api/agent/execute | **0 (bug)** |

---

## Smoke test plan (executable)

### A) Public
1. `/`, `/pricing`, `/business`, `/tools/script-generator/fitness`
2. Legal: impressum, datenschutz, agb, cookies — **+ widerruf when added**
3. Mobile 390px — hero, CTAs, no horizontal scroll
4. Verify `influexai.com` DNS → Vercel (not stale redirect)

### B) Auth
1. Sign-up → 0 credits, plan gate
2. Sign-in redirect back to tool
3. Admin login → credit exempt + admin routes

### C) Agent
1. Plan preview — no credit change
2. Execute script plan — **verify credits decrease (currently fails)**
3. Campaign autopilot end-to-end

### D) Generation
1. generate-image, seedance, product-ad, voice TTS
2. Induce FAL failure — verify credit behavior

### E) Payments
1. Checkout session, webhook replay (idempotent)

### F) Gallery
1. New generation visible, download, cross-user 403

---

## Recommended next fix (single prompt)

```
Fix agent/campaign credit billing only (minimal scope):
- src/app/api/agent/execute/route.ts: deduct credits per completed text/image tool run
- src/lib/agent/campaignExecutor.ts: call deductCredits for each step
- Return accurate usedCredits and remainingCredits
- No DB migration, no other refactors
- npm run build must pass
```

---

*End of audit report. No code changes were made during this audit.*

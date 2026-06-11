# InfluexAI Deep Audit Report
## Date: 2026-06-03
## Auditor: Cursor AI
## Files Reviewed: 832
## Total Findings: 97

Scope: `src/app` (275 files), `src/lib` (234), `src/components` (203), `src/hooks` (6), `src/types` (1), `public` (47), `supabase/migrations` (63), config files, 114 API `route.ts` files. Automated scans: `npx tsc --noEmit`, `npm run build`, `npx eslint . --ext .ts,.tsx`, custom audit scripts in `scripts/audit-*.mjs`.

---

## 🔴 P0 — CRITICAL (Fix before launch, breaks money or security)

1. **Agent execute never deducts credits for text tools** | `src/app/api/agent/execute/route.ts:31,267-290` | `deductCredits` imported but unused (ESLint L31); response hardcodes `usedCredits: 0` at L267 and L287. Text orchestration via `toolOrchestrator` runs Claude + text tools with zero billing. | Wire per-tool `deductCredits` after successful tool runs; return actual `usedCredits`.

2. **Campaign Autopilot reports credits but never charges** | `src/lib/agent/campaignExecutor.ts:342-365`, `src/app/api/agent/execute/route.ts:162,178` | `usedCredits` is a hardcoded sum (image=5, trend=4, hook=3, kalender=5, product=3) with no `deductCredits` calls anywhere in campaign flow. Campaign route `execute/route.ts` completes with `usedCredits: 0` at L162. | Deduct credits per executed step via RPC; align reported vs actual.

3. **Image QA retry can charge 2× credits** | `src/lib/agent/visualQuality.ts:359-378`, `src/lib/image-generator-run.ts:159-165` | `runVisualQAWithRetry` calls `runImageGeneratorGeneration` twice on low score; each call runs `deductCredits` internally. Agent path at `toolOrchestrator.ts:330` uses this. | Skip second deduction on QA retry or mark retry as `skipBilling`.

4. **Bild Generator deducts credits AFTER FAL success** | `src/app/api/generate-image/route.ts:145-203` | FAL generation + asset ingest + DB record complete before `deductCredits` at L189. If deduction fails (L205-209), user keeps generated image in storage/DB. | Deduct before FAL call (or rollback asset on deduct failure).

5. **Motion Transfer deducts AFTER video generation** | `src/lib/motion-transfer-generate.ts:148-212` | FAL subscribe + ingest complete; `deductCredits` only at L195. Failed deduction leaves paid asset in storage. | Deduct before FAL or rollback on failure.

6. **Character-image / agent image paths same post-success pattern** | `src/app/api/character-image/route.ts:132`, `src/lib/image-generator-run.ts:159-165` | Credits deducted after generation succeeds. | Move deduction before provider call.

7. **Public v1 API exposes paid generation without session** | `src/app/api/v1/image/route.ts:1-19`, `src/lib/api-v1/handle-route.ts:14-15` | Uses API-key auth (not Supabase session) — intentional but **must** have rate limits + key rotation documented. Keys grant credit spend. | Audit API key issuance; ensure keys cannot be scraped from client (they are server-only ✓). Confirm billing on every v1 route.

8. **Test credits endpoint in production codebase** | `src/app/api/test/set-credits/route.ts:9,40` | Gated by `E2E_TEST_API` / `PLAYWRIGHT` env but route exists in prod build. Misconfigured env = arbitrary credit grants. | Remove from production bundle or hard-block when `NODE_ENV=production`.

9. **Migration 059 not confirmed in production** | `supabase/migrations/059_protect_profiles_sensitive_columns.sql` | Protects `profiles.credits` / `plan` from direct client UPDATE. Without it, RLS gaps may allow credit manipulation. | Apply migration 059 in production Supabase.

10. **Trend-script charges BEFORE AI, no refund if DB insert fails** | `src/app/api/trend-script/route.ts:103-127,167-177` | Credits deducted pre-generation (good); refund on AI fail at L156 ✓; but no refund if generation succeeds and only DB insert fails. | Add refund path or transactional flow.

11. **Viral-hook / content-kalender charge AFTER AI** | `src/app/api/viral-hook/route.ts:85-95`, similar pattern in `content-kalender/route.ts` | User receives AI output; if `deductCredits` fails, they keep output without paying. | Deduct before AI or invalidate output on payment failure.

12. **Stripe webhook direct profile credit pool update (bypasses RPC for tenants)** | `src/app/api/stripe/webhook/route.ts:109-115,352` | Agency path uses direct `.update({ agency_credits })` — acceptable for agency fields but verify not used for user `profiles.credits`. User credits use `addCredits` RPC ✓ at L416. | Audit agency credit paths separately.

---

## 🟡 P1 — IMPORTANT (Fix soon, degrades experience or revenue)

1. **Audit checklist routes do not exist (404)** | Missing: `src/app/dashboard/trend-script/page.tsx`, `produkt-werbung`, `bild-generator`, `thumbnail`, `lora`, `(marketing)/preise`, `impressum`, `datenschutz`, `agb`, `widerruf`, `faq` | Actual routes: `/dashboard/trend-to-script`, `/dashboard/produkt`, `/dashboard/image-generator`, `/dashboard/thumbnail-concept`, `/dashboard/lora-training`, `/pricing`, `/impressum`, `/datenschutz`, `/agb`. | Update docs/links or add redirects.

2. **No `/widerruf` page** | Glob: 0 files under `src/app/**/widerruf` | Legally required for DE e-commerce with subscriptions. | Create `/widerruf` page.

3. **No standalone `/faq` page** | FAQ content only on landing sections | Users/bookmarks to `/faq` 404. | Add `/faq` route.

4. **Impressum missing USt-IdNr.** | `src/app/impressum/page.tsx:17-27` | Has name, address, email; no VAT ID. | Add USt-Id if registered.

5. ~~**Wrong Anthropic model strings**~~ **FIXED** | `src/lib/anthropic.ts`, `anthropic-agent.ts`, `viral-score/route.ts`, `competitor-run.ts` | All standardized to `claude-sonnet-4-5-20250929`. | Done.

6. **ESLint fails CI (12 errors)** | `src/components/live-creator/face-swap-panel.tsx:439,494`, `src/components/ui/AnimatedCredits.tsx:18,30` | `react-hooks/refs` — ref access during render. | Refactor to event handlers / state.

7. **Duplicate agent entry points** | `src/app/dashboard/page.tsx:7` (MasterAgentChat at `/dashboard`), `src/app/dashboard/ki-agent/page.tsx` (legacy agent UI), `src/lib/dashboard-flows.ts:622` (mobile quick nav → `/dashboard/ki-agent`) | Sidebar top link goes to `/dashboard`; mobile nav goes to `/dashboard/ki-agent`. Different UIs, confusing. | Consolidate to one agent route.

8. **Stimme & Musik path split** | `src/app/dashboard/stimme-musik/page.tsx:3-6` re-exports `voice/page`; sidebar uses `/dashboard/voice` (`dashboard-flows.ts:609`) | Two URLs, one implementation. | Pick canonical URL + redirect.

9. **Plan gate missing on upscale routes** | `src/app/api/upscale-image/route.ts:18-25`, `src/app/api/purchase-image-download/route.ts` | Auth only; no `assertKiToolAccess`. | Add plan gate + credit check.

10. **Avatar start-render no plan gate** | `src/app/api/avatar/start-render/route.ts` | Auth only per automated scan. | Add `assertKiToolAccess`.

11. **KI-Influencer generate/train — credit deduction via separate helper** | `src/app/api/ki-influencer/generate/route.ts`, `train/route.ts` | Uses `deductKiInfluencerCredits` not standard `deductCredits` — verify RPC usage inside helper. | Confirm atomic RPC in `ki-influencer-api.ts`.

12. **Credit label mismatch Trend-Script** | `src/lib/trend-script-tool.ts:9` (3 cr) vs `src/lib/trend-script-analysis.ts:5` (4 cr) vs `campaignExecutor.ts:345` (4 cr) | UI/agent/registry disagree. | Single source of truth.

13. **Kling 2.5 disabled in backend** | `src/lib/kling25-config.ts:13` (`KLING_25_PROVIDER_ENABLED = false`) | UI may still reference premium video tier. | Align UI with flag.

14. **Migration 059 + 060 + 062 may be pending** | Latest migrations: `059`, `060_characters.sql`, `061`, `062_creator_profiles.sql` | Production schema may lack `characters`, `creator_profiles`, column protection. | Run pending migrations.

15. **Admin email hardcoded default** | `src/lib/admin-allowlist.ts:2-4` | Default `paschalidis.georgio38@gmail.com` when `ADMIN_EMAIL_ALLOWLIST` unset. | Set env in production.

16. **Outlier detector API — no auth** | `src/app/api/outlier-detector/route.ts` | `hasAuth: false` in scan; burns Anthropic without login. | Add auth or remove public access.

17. **Agent intent-route — no auth** | `src/app/api/agent/intent-route/route.ts` | Public intent routing. | Add auth.

18. **Beta stats/signup public** | `src/app/api/beta/stats/route.ts`, `beta/signup/route.ts` | No auth. | Rate-limit + captcha.

19. **ElevenLabs speak vs generate-voice credit mismatch** | `src/app/api/stimme/speak/route.ts:13` (2 cr), `src/app/actions/generate-voice.ts:17` (3 cr) | Same feature family, different costs. | Unify pricing.

20. **Campaign autopilot page — no skeleton, minimal error handling** | `.audit-pages.txt` line for `campaign-autopilot/page.tsx` | `hasSkeleton: false`, `hasErrorUI: false`. | Add loading skeleton + error states.

21. **Stimme-musik page — no skeleton** | `stimme-musik/page.tsx` audit | `hasSkeleton: false` (wrapper only). | Skeleton in voice page.

22. **Auth sign-in/up re-export without metadata** | `src/app/auth/sign-in/page.tsx:1`, `sign-up/page.tsx` | `hasDefault: false`; delegates to `(auth)/login`. | Add metadata on canonical routes.

23. **`.env.local.example` missing critical keys** | `.env.local.example` | Missing: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `AKOOL_*`, `ADMIN_EMAIL_ALLOWLIST`, `YOUTUBE_API_KEY`, `RESEND_API_KEY`. | Extend example file.

24. **Middleware deprecation warning** | `npm run build` output | Next.js 16.2.7 warns middleware → proxy migration. | Plan Next 16 middleware migration.

25. **Motion transfer: assets on FAL failure not charged** | `motion-transfer-generate.ts:164-166` | Returns error without charge ✓; but on deduct failure after success, asset orphaned. | See P0 #5.

---

## 🟠 P2 — WARNING (Fix when possible)

1. **47 ESLint warnings** | Full list in `.audit-eslint.txt` | Mostly `@typescript-eslint/no-unused-vars`, `@next/next/no-img-element`, `react-hooks/exhaustive-deps`. | Clean incrementally.

2. **66 console.log in src** | See `.audit-dead.txt` CONSOLE_LOGS section | Production noise; includes `image-generator-fal.ts` (9×), `training-set/route.ts` (14×). | Replace with structured logging or remove.

3. **29 potentially unused components** | `.audit-dead.txt` UNUSED_COUNT | Heuristic false positives possible; includes `MelodiaWidget`, `MobileNav`, `BuyCreditsModal`. | Verify before deletion.

4. **14 TODO/FIXME comments** | `src/lib/agent/mockExecutor.ts:55-102`, `publish/route.ts:28-29`, `qualityScoring.ts:165-166` | Agent guards/publishing not implemented. | Track in backlog.

5. **No `: any` in src** | Grep `: any\b|as any` → 0 matches | ✓ TypeScript strict usage good. | Maintain.

6. **Hydration risks on client pages** | `ki-ich/page.tsx`, `gallery/page.tsx`, `ki-agent/page.tsx`, `image-generator/page.tsx`, `produkt/page.tsx`, `lora-training/page.tsx` | Use `window`/`document` without `typeof window` guard per audit script. | Guard browser APIs.

7. **Most dashboard pages lack route-level loading.tsx** | Only `dashboard/layout.tsx` has skeleton pulse; individual pages mostly client-side loading | Acceptable pattern but inconsistent with Next.js conventions. | Optional `loading.tsx` per route.

8. **`<img>` instead of next/image** | `avatar-studio/page.tsx:448`, `competitor/page.tsx:305,483`, `live-portrait/page.tsx:271`, `lora-training/page.tsx:402,577`, `produkt/page.tsx:513,546` | ESLint `@next/next/no-img-element`. | Migrate to `next/image` where possible.

9. **Hero section video/asset load** | `src/components/landing/HeroSection.tsx` | Multiple video sources; verify lazy load. | Performance audit.

10. **vercel.json maxDuration gaps** | `vercel.json` | `seedance`, `motion-transfer`, `generate-image`, `lora/train` not listed (default 60s on Pro). Long FAL jobs may timeout. | Add maxDuration for long routes.

11. **LoRA train maxDuration 30s** | `src/app/api/lora/train/route.ts:19` | Training is async via webhook but submit may timeout. | Increase or confirm async pattern.

12. **Double Stripe webhook files** | `src/app/api/stripe/webhook/route.ts`, `src/app/api/webhooks/stripe/route.ts` | Second appears empty/stub. | Remove dead route.

13. **produkt-werbung API stub** | `src/app/api/produkt-werbung/route.ts` | No auth, no try/catch in scan. | Remove or implement.

14. **sentry-test route** | `src/app/api/sentry-test/route.ts:5` | Gated by `SENTRY_TEST_ENABLED` but exists in prod. | Restrict to dev.

15. **test-elevenlabs route public** | `src/app/api/test-elevenlabs/route.ts` | No auth. | Remove or protect.

16. **Impressum — no explicit GmbH legal form** | `impressum/page.tsx:18` | Shows "INFLUEXAI" + person name, not "InfluexAI GmbH" (metadata uses GmbH at `layout.tsx:66`). | Align legal entity naming.

17. **Interactive demo DATEV/DSGVO marketing claim** | `src/components/landing/InteractiveDemo.tsx:163` | "DSGVO-konform" in demo copy — ensure substantiated. | Legal review.

18. **Sidebar agent label vs ki-agent page** | Sidebar `tNav("agent")` → `/dashboard`; no sidebar link to `/dashboard/ki-agent` | Not duplicate sidebar entries; mobile quick nav differs. | Clarify UX.

19. **Character-image uses Seedream model** | `src/lib/character-image-fal.ts:13` | `fal-ai/bytedance/seedream/v4.5/edit` — verify pricing in credits. | Document in tool registry.

20. **Gallery type `audio` newly added** | `generate-voice.ts`, `gallery-types.ts` | Verify migration supports `generations.type = 'audio'`. | Confirm DB accepts type.

21. **Auth callback uses service patterns** | `src/app/auth/callback/route.ts` | Standard Supabase flow ✓. | —

22. **Cookie banner present** | `src/app/layout.tsx:11`, `CookieBanner` component | Functional ✓. | Verify consent logging if required.

23. **AI labeling** | `impressum/page.tsx:63-68`, `AiOutputDisclaimer` component | KI-Kennzeichnung present on legal + tool outputs. | Extend to all generated media downloads.

24. **Feature flag VOICE_COMING_SOON** | `src/lib/feature-flags.ts` | Set `false` — voice active. Sidebar still checks flag. | ✓ OK.

25. **LIVE_CREATOR_COMING_SOON flag** | Sidebar gates live creator when true | Verify current value. | Confirm enabled state.

26. **Agency credit pool direct update** | `src/app/actions/agency.ts:252-257` | Tenant pool not user credits — acceptable pattern. | Document.

27. **No gallery API route** | Gallery via server action `get-gallery.ts` | Not REST `/api/gallery` — by design. | Document for integrators.

28. **Ki-influencer status polling 10s** | `KiInfluencerTrainingVisualizer.tsx` | Implemented ✓. | —

29. **Plan gate header-only for some routes** | `middleware.ts:294-297` | Sets `x-plan-upgrade-required` but does not block navigation. | Client-side PlanGateProvider enforces.

30. **FAL_KEY vs FAL_API_KEY** | `src/lib/fal-image.ts:26` | Accepts either. Example documents both. | ✓ OK.

---

## 🟢 PASSED (Confirmed working)

1. **TypeScript compile clean** — `npx tsc --noEmit` exit 0 (2026-06-03).
2. **Production build succeeds** — `npm run build` exit 0, Next.js **16.2.7**.
3. **Middleware protects `/dashboard/*`** — `src/middleware.ts:152-157` redirects unauthenticated users.
4. **Middleware protects `/admin/*`** — `src/middleware.ts:159-187` auth + `isPlatformAdminServer`.
5. **Credits use RPC `deduct_credits` / `add_credits`** — `src/lib/credits.ts:155-161,251-257`; migration `056_atomic_credits.sql`.
6. **Stripe webhook idempotency** — `stripe_events` table `057_stripe_events.sql`; check at `webhook/route.ts:468-476`.
7. **Subscription plans pricing** — `subscription-plans.ts:29-61` — Starter €9.99, Creator €49, Pro €99, Business €199 ✓.
8. **Credit packs** — `credit-packages.ts:36-76` — 50/€5, 150/€12, 350/€25, 800/€45 ✓.
9. **Stripe env convention** — `NEXT_PUBLIC_STRIPE_INFLUEXAI_*` used in `subscription-plans.ts:34-60`.
10. **Design tokens** — `globals.css:14-18` — `#060608` bg, `#b4ff00` accent, Bebas + DM Sans ✓.
11. **Root layout suppressHydrationWarning** — `src/app/layout.tsx:142,155` ✓.
12. **Datenschutz lists AI providers** — Anthropic, fal.ai, ElevenLabs, Akool at `datenschutz/page.tsx:67-71` ✓.
13. **ElevenLabs model** — `elevenlabs-config.ts:7` — `eleven_multilingual_v2` ✓.
14. **Image prompt enhancer on Bild Generator** — `image-generator-prompt-pipeline.ts:105-106` calls `enhanceImagePrompt` ✓.
15. **Admin bypass via isCreditExemptUser** — `credits.ts:129-143` server-side only ✓.
16. **Trend-script refund on AI failure** — `trend-script/route.ts:156` ✓.
17. **Akool async polling pattern** — `akool/route.ts:41-80` GET poll; POST disabled 410 ✓.
18. **No service role key in NEXT_PUBLIC_** — Service key only server-side ✓.

---

## 📋 P3 — TECH DEBT (Backlog)

1. Agent publish social APIs stub — `publish/route.ts:29`.
2. Agent mockExecutor guard TODOs — `mockExecutor.ts:55-102`.
3. Quality scoring image/video QA TODOs — `qualityScoring.ts:165-166`.
4. Melodia voice mode TODO — `MelodiaWidget.tsx:317`.
5. Deprecated `upscale-image` route — prefer `/api/upscale`.
6. Deprecated RunPod comments in `.env.local.example:41-44`.
7. 29 unused components (verify) — see `.audit-dead.txt`.
8. `PLAN_RANK` unused — `subscription-plans.ts:71`.
9. Middleware → proxy migration (Next 16).
10. Consolidate `/dashboard` vs `/dashboard/ki-agent` agent UIs.
11. `webhooks/stripe` empty duplicate route.
12. Public API v1 documentation vs session API parity.
13. `agency_credits` direct DB updates vs RPC pattern.
14. Full RLS audit across 63 migrations (automated policy matrix not run).

---

## PHASE 1 — PROJECT STRUCTURE

| Directory | Files | Purpose | Notes |
|-----------|-------|---------|-------|
| `src/app` | 275 | Pages, layouts, 114 API routes, server actions | Next.js App Router; legal at root not `(marketing)/` |
| `src/lib` | 234 | Business logic, AI integrations, credits, agent | Core domain layer |
| `src/components` | 203 | UI, landing, dashboard, agent | No root `components/index.ts` |
| `src/hooks` | 6 | React hooks | Small set |
| `src/types` | 1 | Shared types | Minimal |
| `public` | 47 | Static assets, PWA icons, fonts | |
| `supabase/migrations` | 63 | Schema, RLS, RPC | Through `062_creator_profiles.sql` |
| Config | 6+ | `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vercel.json`, `src/middleware.ts`, `package.json` | |

**Unexpected / notable:**
- Dual agent pages: `/dashboard` + `/dashboard/ki-agent`
- `stimme-musik` wraps `voice` page
- `(auth)/login` canonical; `/auth/sign-in` re-exports
- `(marketing)/business` exists; other legal pages at app root
- 114 API routes (large surface area)
- Test/debug routes: `test/set-credits`, `test-elevenlabs`, `sentry-test`

Full app file list generated at `.audit-tree-app.txt` (275 paths).

---

## PHASE 2 — BUILD & TYPES

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **0 errors** |
| `npm run build` | **Success** (Next.js 16.2.7) |
| `npx eslint . --ext .ts,.tsx` | **Exit 1** — 12 errors, 46 warnings (58 total) |

### ESLint Errors (all `react-hooks/refs`)
| File | Line |
|------|------|
| `src/components/live-creator/face-swap-panel.tsx` | 439, 494 |
| `src/components/ui/AnimatedCredits.tsx` | 18, 30 |

### ESLint Warnings (representative)
| File | Line | Rule |
|------|------|------|
| `src/app/api/agent/execute/route.ts` | 31 | unused `deductCredits` |
| `src/app/dashboard/avatar-studio/page.tsx` | 448 | no-img-element |
| `src/app/dashboard/ki-influencer/page.tsx` | 419 | exhaustive-deps |
| `src/lib/access.server.ts` | 135,141,169 | unused vars |
| (+ 42 more in `.audit-eslint.txt`) | | |

### use client / use server
- No conflicting `"use client"` + `"use server"` in same file detected.
- Server actions in `src/app/actions/` correctly marked `"use server"`.

### `: any` usage
- **0 matches** for `: any` or `as any` in `src/`.

### Broken imports
- None detected by `tsc` or build.

---

## MODELS MATRIX

| Tool | Provider | Model ID | Route | Credits | Status | Issues |
|------|----------|----------|-------|---------|--------|--------|
| Viral Hook | Anthropic | `claude-sonnet-4-5-20250929` (via default) | `/api/viral-hook` | 1 | Active | Deduct after AI |
| Trend Script | Anthropic | Sonnet | `/api/trend-script` | 3 | Active | Label says 4 in places |
| Content Kalender | Anthropic | Sonnet | `/api/content-kalender` | 2 | Active | |
| KI Agent chat | Anthropic | Sonnet / Opus mix | `/api/ki-agent`, `/api/agent/execute` | 0 (bug) | Active | No billing |
| Campaign Autopilot | Anthropic + FAL | Sonnet + flux | `/api/agent/execute?type=campaign` | 0 (bug) | Preview | Hardcoded usedCredits |
| Bild Generator | fal.ai | `fal-ai/flux/dev`, `fal-ai/flux-pro` | `/api/generate-image` | 5 / 8 | Active | Deduct after FAL |
| Character Image | fal.ai | `fal-ai/bytedance/seedream/v4.5/edit` | `/api/character-image` | 5 | Active | |
| Mein KI-Ich | fal.ai | `fal-ai/flux-pulid` | `/api/ki-ich` | 8 | Active | |
| LoRA Train | fal.ai | `fal-ai/flux-lora-portrait-trainer`, fast trainer | `/api/lora/train`, `/api/ki-influencer/train` | dynamic | Active | |
| LoRA Generate | fal.ai | `fal-ai/flux-lora` | `/api/lora/generate` | dynamic | Active | |
| Seedance | ByteDance/fal | `bytedance/seedance-2.0/fast/image-to-video` | `/api/seedance` | 40 | Active | |
| Motion Transfer | fal.ai | `fal-ai/kling-video/v3/pro/motion-control` | `/api/motion-transfer` | 8 | Active | Deduct after FAL |
| Product Ad Video | fal.ai | `fal-ai/kling-video/v1.6/pro/image-to-video` | `/api/product-ad/generate` | 75 | Active | |
| Kling 2.5 | fal.ai | `fal-ai/kling-video/v2.5-turbo/pro/*` | config only | 40 | **Disabled** | `KLING_25_PROVIDER_ENABLED=false` |
| Live Portrait | fal.ai | `fal-ai/live-portrait` | `/api/live-portrait` | 5 | Active | |
| Live Creator | fal.ai + Akool | flashhead, live-portrait | `/api/live-creator` | 10-20 | Active | |
| Face Swap | Akool/fal | various | `/api/faceswap` | varies | Active | maxDuration 300 |
| UGC Video | Akool + ElevenLabs | avatars | `/api/ugc-video` | varies | Active | |
| Upscale | fal.ai | `fal-ai/clarity-upscaler` | `/api/upscale` | 4 | Active | No plan gate |
| Stimme (voice page) | ElevenLabs | `eleven_multilingual_v2` | `actions/generate-voice` | 3 | Active | Gallery save ✓ |
| Stimme speak API | ElevenLabs | `eleven_multilingual_v2` | `/api/stimme/speak` | 2 | Active | Cost mismatch |
| Stimme clone | ElevenLabs | | `/api/stimme/clone` | varies | Active | |
| Viral Score | Anthropic | `claude-sonnet-4-5-20250929` | `/api/viral-score` | varies | Active | — |
| Competitor | Anthropic | `claude-sonnet-4-5-20250929` | `/api/competitor` | varies | Active | — |
| Agent (legacy) | Anthropic | `claude-sonnet-4-5-20250929` | `anthropic-agent.ts` | — | Active | — |
| Melodia chat | Anthropic | `claude-haiku-4-5-20251001` | `/api/melodia` | varies | Active | |
| Image prompt improve | Anthropic | `claude-haiku-4-5-20251001` | `improve-image-prompt.ts` | — | Internal | |
| Visual QA | Anthropic | `claude-sonnet-4-5-20250929` | `visualQuality.ts` | — | Active | Retry 2× image cost |

---

## CREDITS MATRIX

| Tool | Route | Credits | Timing | RPC | Admin Bypass | Refund on Fail |
|------|-------|---------|--------|-----|--------------|----------------|
| Viral Hook | `/api/viral-hook` | 1 | After AI | ✓ | ✓ | No |
| Trend Script | `/api/trend-script` | 3 | Before AI | ✓ | ✓ | Yes (AI fail) |
| Content Kalender | `/api/content-kalender` | 2 | After AI | ✓ | ✓ | No |
| KI Agent execute | `/api/agent/execute` | 0 | Never | — | partial | N/A |
| Campaign Autopilot | `/api/agent/execute` (campaign) | 0 | Never | — | partial | N/A |
| Bild Generator | `/api/generate-image` | 5/8 | After FAL | ✓ | ✓ | No |
| Agent image (orchestrator) | via `runImageGeneratorGeneration` | 5 | Before (in helper) | ✓ | ✓ | No; QA retry 2× |
| Character Image | `/api/character-image` | 5 | After FAL | ✓ | ✓ | No |
| Mein KI-Ich | `/api/ki-ich` | 8 | Before | ✓ | ✓ | No |
| LoRA Train | `/api/lora/train` | calc | Before | ✓ | ✓ | No |
| LoRA Generate | `/api/lora/generate` | calc | Before | ✓ | ✓ | No |
| Seedance | `/api/seedance` | 40 | In generate helper | ✓ | ✓ | No |
| Motion Transfer | `/api/motion-transfer` | 8 | After FAL | ✓ | ✓ | No |
| Product Ad | `/api/product-ad/generate` | 75 | Before video | ✓ | ✓ | Partial |
| Live Portrait | `/api/live-portrait` | 5 | After | ✓ | ✓ | No |
| Live Creator | `/api/live-creator` | 10+ | On completion GET | ✓ | ✓ | No |
| Face Swap | `/api/faceswap` | varies | Before | ✓ | ✓ | No |
| UGC Video | `/api/ugc-video` | varies | Before | ✓ | ✓ | No |
| Upscale | `/api/upscale` | 4 | In helper | ✓ | ✓ | No |
| Voice (action) | `generate-voice.ts` | 3 | After TTS | ✓ | ✓ | No |
| Stimme speak | `/api/stimme/speak` | 2 | After TTS | ✓ | ✓ | No |
| Stimme clone | `/api/stimme/clone` | varies | Before | ✓ | ✓ | No |
| KI Agent route | `/api/ki-agent` | varies | Before | ✓ | ✓ | No |
| Viral Score | `/api/viral-score` | varies | Before | ✓ | ✓ | No |
| Melodia | `/api/melodia` | varies | Before | ✓ | ✗ plan | No |
| Purchase download | `/api/purchase-image-download` | 1 | Before | ✓ | ✓ | No |
| Ki-Influencer train | `/api/ki-influencer/train` | calc | Before | helper | ✓ admin | No |
| Ki-Influencer generate | `/api/ki-influencer/generate` | varies | Before | helper | ✓ | No |
| Stripe credit pack | webhook | +pack | On payment | add_credits ✓ | N/A | N/A |
| Referral | `addCredits` | +bonus | Event | ✓ | N/A | N/A |

---

## ENV VARS LIST

| Variable | Used In (sample) | Public/Private | Required | In Example |
|----------|------------------|----------------|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | middleware.ts:109 | Public | **Yes** | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | middleware.ts:110 | Public | **Yes** | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | credits.ts:72, webhook | **Private** | **Yes** | ✓ |
| `ANTHROPIC_API_KEY` | anthropic.ts:36 | **Private** | **Yes** | ✗ |
| `FAL_API_KEY` / `FAL_KEY` | fal-image.ts:26 | **Private** | **Yes** (media) | ✓ |
| `ELEVENLABS_API_KEY` | elevenlabs-tts.ts:36 | **Private** | Voice tools | ✗ |
| `AKOOL_CLIENT_ID` | akool.ts:19 | **Private** | Live/UGC | ✗ |
| `AKOOL_API_KEY` | akool.ts:20 | **Private** | Live/UGC | ✗ |
| `STRIPE_SECRET_KEY` | stripe.ts:4 | **Private** | **Yes** (paid) | ✓ |
| `STRIPE_WEBHOOK_SECRET` | webhook/route.ts:447 | **Private** | **Yes** (paid) | ✓ |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_*` | subscription-plans.ts | Public IDs | **Yes** (checkout) | ✓ |
| `STRIPE_CREDITS_*` | credit-packages.ts | **Private** | Credit packs | partial |
| `ADMIN_EMAIL_ALLOWLIST` | admin-allowlist.server.ts:9 | **Private** | Admin access | ✗ |
| `YOUTUBE_API_KEY` | youtube.ts:51 | **Private** | Trend script | ✗ |
| `RESEND_API_KEY` | newsletter-email.ts:10 | **Private** | Email | ✗ |
| `NEXT_PUBLIC_APP_URL` | visualQuality.ts:157 | Public | Redirects/QA | ✓ |
| `E2E_TEST_API` | test/set-credits/route.ts:9 | **Private** | Test only | ✗ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | PushPermission.tsx | Public | Push | ✗ |
| `VAPID_PRIVATE_KEY` | web-push-server.ts:43 | **Private** | Push | ✗ |

Full env scan: `.audit-env.txt` (43 unique variables).

---

## PAGES STATUS

| Page | Route | Exists | Auth Guard | Loading State | Mobile | Issues |
|------|-------|--------|------------|---------------|--------|--------|
| Landing | `/` | ✓ | No | No loading.tsx | ✓ sm:/md: | — |
| Root layout | `/layout` | ✓ | — | — | — | metadata ✓ |
| Dashboard home (Agent) | `/dashboard` | ✓ | Middleware | Client skeleton in chat | ✓ | Agent credits bug |
| Dashboard layout | `/dashboard/layout` | ✓ | Middleware | Pulse in layout | — | error.tsx ✓ |
| Viral Hook | `/dashboard/viral-hook` | ✓ | Middleware | Skeleton ✓ | ✗ breakpoints sparse | — |
| Content Kalender | `/dashboard/content-kalender` | ✓ | Middleware | Skeleton ✓ | ✗ | — |
| Trend Script (checklist path) | `/dashboard/trend-script` | **✗** | — | — | — | Use `/dashboard/trend-to-script` |
| Trend→Script | `/dashboard/trend-to-script` | ✓ | Middleware | Skeleton ✓ | ✗ | — |
| Produkt-Werbung (checklist) | `/dashboard/produkt-werbung` | **✗** | — | — | — | Use `/dashboard/produkt` |
| Produkt | `/dashboard/produkt` | ✓ | Middleware | Skeleton ✓ | ✗ | hydration risk |
| KI-Ich | `/dashboard/ki-ich` | ✓ | Middleware | Skeleton ✓ | ✗ | console.log L71, hydration |
| Bild Generator (checklist) | `/dashboard/bild-generator` | **✗** | — | — | — | Use `/dashboard/image-generator` |
| Image Generator | `/dashboard/image-generator` | ✓ | Middleware | Skeleton ✓ | ✓ | hydration risk |
| Gallery | `/dashboard/gallery` | ✓ | Middleware | Skeleton ✓ | ✓ | hydration, empty state ✓ |
| Thumbnail (checklist) | `/dashboard/thumbnail` | **✗** | — | — | — | Use `/dashboard/thumbnail-concept` |
| Thumbnail Concept | `/dashboard/thumbnail-concept` | ✓ | Middleware | Skeleton ✓ | ✗ | error.tsx ✓ |
| LoRA (checklist) | `/dashboard/lora` | **✗** | — | — | — | Use `/dashboard/lora-training` |
| LoRA Training | `/dashboard/lora-training` | ✓ | Middleware | ✗ skeleton | ✗ | hydration, img tags |
| KI Agent (legacy UI) | `/dashboard/ki-agent` | ✓ | Middleware | Skeleton ✓ | ✓ | Duplicate of /dashboard |
| Campaign Autopilot | `/dashboard/campaign-autopilot` | ✓ | Middleware | ✗ | ✗ | No error UI |
| Stimme & Musik | `/dashboard/stimme-musik` | ✓ | Middleware | ✗ | ✗ | Wrapper only |
| Voice (canonical) | `/dashboard/voice` | ✓ | Middleware | Skeleton ✓ | — | Active |
| Live Creator | `/dashboard/live-creator` | ✓ | Middleware | Skeleton ✓ | ✓ | — |
| Admin | `/admin` | ✓ | Middleware admin | ✗ | ✗ | empty state ✓ |
| Preise (checklist) | `/(marketing)/preise` | **✗** | — | — | — | Use `/pricing` |
| Pricing | `/pricing` | ✓ | No | ✗ | ✓ | — |
| Business | `/(marketing)/business` | ✓ | No | ✗ | ✗ | metadata ✓ |
| Impressum | `/impressum` | ✓ | No | ✗ | ✗ | No USt-ID |
| Datenschutz | `/datenschutz` | ✓ | No | ✗ | ✗ | Providers listed ✓ |
| AGB | `/agb` | ✓ | No | ✗ | ✗ | — |
| Widerruf | `/widerruf` | **✗** | — | — | — | **Missing** |
| FAQ | `/faq` | **✗** | — | — | — | **Missing** |
| Sign-in | `/auth/sign-in` | ✓ | — | ✗ | ✗ | Re-export only |
| Sign-up | `/auth/sign-up` | ✓ | — | ✗ | ✗ | Re-export only |

---

## API ROUTES STATUS

### Checklist routes (individual)

| Route | Method | Auth | Credits | Plan Gate | Error Handling | Issues |
|-------|--------|------|---------|-----------|----------------|--------|
| `/api/viral-hook` | POST | ✓ | 1 after AI | ✓ | try/catch ✓ | Charge timing |
| `/api/content-kalender` | POST | ✓ | 2 after AI | ✓ | ✓ | Charge timing |
| `/api/trend-script` | POST | ✓ | 3 before AI | ✓ | ✓ + refund | Cost label mismatch |
| `/api/product-ad/generate` | POST | ✓ | 75 | ✓ | ✓ | maxDuration 300 |
| `/api/generate-image` | POST | ✓ | 5/8 after FAL | ✓ | ✓ | **P0 timing** |
| `/api/character-image` | POST | ✓ | 5 after | ✓ | ✓ | timing |
| `/api/upscale-image` | POST | ✓ | 4 | **✗** | partial | deprecated |
| `/api/ki-ich` | POST | ✓ | 8 before | ✓ | ✓ | — |
| `/api/ki-influencer/train` | POST | ✓ | calc | ✓ gated | ✓ | separate credit helper |
| `/api/ki-influencer/status/[id]` | GET | ✓ | — | — | ✓ | — |
| `/api/lora/train` | POST | ✓ | calc before | ✓ gated | ✓ | maxDuration 30 |
| `/api/lora/generate` | POST | ✓ | calc before | ✓ | ✓ | — |
| `/api/seedance` | POST | ✓ | 40 | ✓ | ✓ | maxDuration 300 |
| `/api/motion-transfer` | POST | ✓ | 8 after | ✓ | ✓ | **P0 timing** |
| `/api/live-creator` | GET/POST | ✓ | on complete | ✓ | ✓ | maxDuration 300 |
| `/api/ugc-video` | GET/POST | ✓ | yes | ✓ | ✓ | maxDuration 300 |
| `/api/stimme/speak` | POST | ✓ | 2 after | ✓ gated | ✓ | no gallery save |
| `/api/generate-voice` | — | — | — | — | — | **Does not exist**; use `actions/generate-voice` |
| `/api/agent/execute` | POST | ✓ | **0** | ✓ | ✓ | **P0 billing** |
| `/api/agent/campaign` | POST | ✓ | **0** | ✓ | ✓ | async job queue |
| `/api/agent/job/[id]` | GET | ✓ | — | — | partial | — |
| `/api/agent/publish` | POST | ✓ | — | **✗** | partial | TODO guards |
| `/api/agent/plan-preview` | POST | ✓ | — | ✓ | ✓ | — |
| `/api/stripe/checkout` | POST | session | — | — | partial | — |
| `/api/stripe/webhook` | POST | signature | add | — | ✓ | idempotent ✓ |
| `/api/admin/*` | GET/POST | admin | — | — | partial | 7 sub-routes |
| Gallery | action | ✓ | — | — | — | No REST route |

### All 114 routes — routes WITHOUT auth (public)
`ab-track`, `agent/intent-route`, `auth/is-admin` (session optional), `avatar/runpod-callback`, `beta/*`, `community/preview/[id]`, `guides/[slug]/pdf`, `lora/webhook`, `newsletter/confirm`, `outlier-detector`, `push/send`, `sentry-test`, `stripe/checkout` (creates session), `stripe/credits-checkout`, `stripe/agency-checkout`, `test-elevenlabs`, `unsubscribe*`, `v1/*` (API key auth), `webhooks/stripe` (stub).

---

## PHASE 5 — SUPABASE & DATABASE (summary)

### Migrations (63 files, ordered by prefix 001–062)

| Migration | Key changes |
|-----------|-------------|
| `002` | `generations`, credit transactions |
| `040` | `lora_models` |
| `049` | `agent_executions` |
| `050` | `campaign_results` |
| `051` | `agent_feedback` |
| `052` | `agent_jobs` |
| `056` | **`deduct_credits` / `add_credits` RPC** |
| `057` | **`stripe_events`** idempotency |
| `058` | `processed_checkout_sessions` dedup |
| `059` | Protect profiles sensitive columns |
| `060` | **`characters`** table (KI-Influencer) |
| `061` | characters source column |
| `062` | **`creator_profiles`** |

### Table verification
| Table | In migrations | Notes |
|-------|---------------|-------|
| profiles | 004+ | credits, plan, stripe fields |
| credits | RPC only | Balance on `profiles.credits` |
| characters | 060 | No `training_images` column — computed in API |
| creator_profiles | 062 | Agent memory |
| generations | 002, 045 | Gallery source |
| agent_executions | 049 | |
| campaign_results | 050 | |
| agent_feedback | 051 | |
| agent_jobs | 052 | |
| stripe_events | 057 | |
| lora_models | 040 | |

### Direct credit updates (non-RPC)
- `src/app/api/test/set-credits/route.ts:40` — test only
- `src/app/actions/agency.ts:252-257` — tenant pool (not user credits)
- `src/app/api/stripe/webhook/route.ts:109-115` — agency_credits field

All user credit deductions in production paths use `deductCredits()` → RPC ✓.

---

## PHASE 6–14 SUMMARY

### Anthropic
- **Files:** 30+ (see grep `anthropic` in src)
- **API key:** `ANTHROPIC_API_KEY` env
- **Canonical Sonnet:** `claude-sonnet-4-5-20250929`
- **Model IDs:** All Anthropic calls use `claude-sonnet-4-5-20250929` (P1 #5 fixed)
- **Streaming:** `melodia/stream-chat.ts` — SSE with error handling

### fal.ai
- **Enhancer:** Called via `prepareImageGeneratorPrompts` → `enhanceImagePrompt` for Bild Generator ✓; also `imagePromptEnhancer.ts` for agent path
- **Quality scoring:** `runWithQualityRetry` on text routes; `runVisualQAWithRetry` on agent images
- **Auto-retry < 70:** `QUALITY_RETRY_THRESHOLD` in qualityScoring — image retry charges 2× (P0 #3)

### ElevenLabs
- Model: `eleven_multilingual_v2` ✓
- Voice page saves to gallery (`type: audio`) ✓
- `/api/stimme/speak` does not save to gallery

### Akool
- Endpoints: live-creator, ugc-video, faceswap; poll via GET `/api/akool?jobId=`
- Env: `AKOOL_CLIENT_ID`, `AKOOL_API_KEY`
- maxDuration 300 on live-creator ✓

### Stripe
- 4 plans + 4 packs verified ✓
- Webhook events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted/updated`
- Idempotency: `stripe_events` + `processed_checkout_sessions`

### Authentication & Security
- Middleware: dashboard + admin ✓
- `isPlatformAdminServer` server-only ✓
- Service role not exposed client-side ✓
- SQL injection: Supabase parameterized queries ✓
- Prompt injection: partial sanitization `sanitize-user-message.ts`

### Performance
- vercel.json maxDuration set for heavy routes; gaps for seedance/motion-transfer/generate-image
- Dynamic imports: partial (landing lazy sections exist)

### Legal
- Impressum: incomplete (no USt-ID)
- Datenschutz: complete provider list ✓
- Widerruf: missing
- Cookie banner: present ✓
- No false "EU-only" claims; DSGVO mentioned appropriately

---

## SMOKE TEST COMMANDS RUN

```bash
npx tsc --noEmit          # exit 0
npm run build             # exit 0, Next.js 16.2.7
npx eslint . --ext .ts,.tsx  # exit 1, 58 problems
node scripts/audit-pages.mjs
node scripts/audit-env.mjs
node scripts/audit-dead.mjs
```

---

*End of report. No code was modified during this audit.*

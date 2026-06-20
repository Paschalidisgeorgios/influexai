# Visual QA Auth Truth — G.10-O0F

Generated: 2026-06-20

## Executive summary

**Root cause:** Preview client bundle has **staging** Supabase URL (`jvjmqtxlqfqaoyjklpxh`) but **production** anon JWT ref (`hszjafdelcydnppyolkm`). `signInWithPassword` targets staging with a production anon key → UI shows *„Falsche E-Mail oder falsches Passwort“* even when the user/password are correct on staging.

This is **not** a login-form bug. Direct Supabase sign-in with matching local `.env.local` keys should PASS after `npm run staging:ensure-visual-qa-user`.

## Preview bundle scan (automated)

| Field | Value |
|-------|--------|
| Preview URL | `https://influexai-iad04g5x8-paschalidisgeorgios-projects.vercel.app` |
| URL refs in bundle | `jvjmqtxlqfqaoyjklpxh` |
| Anon JWT refs in bundle | `hszjafdelcydnppyolkm` |
| URL/anon mismatch | **YES** |

Scan command: `node scripts/scan-preview-supabase-bundle.mjs`

## Required Vercel fix (manual, Preview only)

In Vercel → Project → Settings → Environment Variables → **Preview**:

1. `NEXT_PUBLIC_SUPABASE_URL` = `https://jvjmqtxlqfqaoyjklpxh.supabase.co`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = **staging** anon key from Supabase project `jvjmqtxlqfqaoyjklpxh` (Settings → API)
3. `SUPABASE_SERVICE_ROLE_KEY` = **staging** service role (same project)

Verify anon JWT decodes to ref `jvjmqtxlqfqaoyjklpxh`, **not** `hszjafdelcydnppyolkm`.

Then redeploy Preview (no `--prod`):

```bash
npx vercel --yes
```

Re-scan:

```bash
node scripts/scan-preview-supabase-bundle.mjs https://<new-preview-url>
```

Expect: `url_anon_mismatch: false`, both refs `jvjmqtxlqfqaoyjklpxh`.

## Auth truth automation

```bash
# Requires VISUAL_QA_PASSWORD in .env.local
npm run staging:visual-qa-auth-truth
```

Steps: ensure user → direct anon sign-in → bundle scan → Playwright UI probe.

## Code changes (repo)

- `scripts/visual-qa-auth-truth.mjs` — orchestrated truth test
- `scripts/lib/supabase-env-audit.mjs` — ref/JWT audit helpers
- `scripts/scan-preview-supabase-bundle.mjs` — bundle-only scan
- `scripts/ensure-staging-visual-qa-user.mjs` — anon sign-in verification after password sync
- `src/lib/supabase/env-guard.ts` + `client.ts` — console error on URL/anon ref mismatch
- `src/app/(auth)/login/page.tsx` — trim email before sign-in
- `tests/e2e/flows/visual-qa-auth-truth.test.ts` — Playwright preview login probe

## Stop rules observed

- No provider smoke, no `--prod`, no production Supabase writes, no secrets in report.

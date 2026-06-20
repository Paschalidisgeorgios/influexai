# Launch Auth Truth — G.10-P

Generated: 2026-06-20T20:25:00Z  
Branch: `master`  
HEAD (pre-commit): `b97be1e`

## Safety Preflight

| Check | Result |
|-------|--------|
| Branch | `master` |
| `PROVIDERS_DISABLED` | `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | `false` |
| `STRIPE_MODE` | `test` |
| Local Supabase ref | `jvjmqtxlqfqaoyjklpxh` (staging) |
| Local anon JWT ref | `jvjmqtxlqfqaoyjklpxh` (match) |
| Production Supabase locally | **blocked** (not configured) |
| Stripe Live | **no** |
| `.env.local` staged | **no** |
| `public/images/lora-training/` staged | **no** |
| `VISUAL_QA_PASSWORD` | **missing** in shell and `.env.local` |
| Provider call | **none** |
| `vercel --prod` | **not run** |

### Preflight tests

| Command | Result |
|---------|--------|
| `npm run lint` | PASS (0 errors, warnings only) |
| `npm run test:unit -- --run` | PASS (231/231) |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

---

## Launch Gate Summary

| Gate | Result | Notes |
|------|--------|-------|
| Auth Gate (direct Supabase sign-in) | **BLOCKED** | `VISUAL_QA_PASSWORD` not set — script cannot run Step 1–2 |
| Preview Gate (bundle + provider guard) | **FAIL** | Bundle URL/anon mismatch; provider guard PASS |
| UI Smoke Ready | **SKIPPED** | Bundle gate fail + no password |

**Overall: NOT launch-ready for G.10-O Provider-UI-Smoke**

---

## Direct Supabase Auth

| Field | Value |
|-------|-------|
| User | `visualqa@influexai.test` |
| `direct_supabase_sign_in_ok` | **not run** (password missing) |
| Supabase ref (local) | `jvjmqtxlqfqaoyjklpxh` |
| user_id | n/a |
| error code/message | n/a |
| password logged | **false** |

**Action required:**

```powershell
$env:VISUAL_QA_PASSWORD = 'DEIN_NEUES_TEMPORÄRES_PASSWORT'
npm run launch:auth-truth
```

---

## Preview

| Field | Value |
|-------|-------|
| Preview URL | `https://influexai-iad04g5x8-paschalidisgeorgios-projects.vercel.app` |
| Preview Ready | **yes** (29m, Environment: Preview) |
| Newest deployment | `cx6vgrsrz` — **Production** (skipped intentionally) |
| JS chunks scanned | 21 |

### Preview Bundle Supabase Ref

| Scan | Ref |
|------|-----|
| URL refs | `jvjmqtxlqfqaoyjklpxh` (staging) ✅ |
| Anon JWT refs | `hszjafdelcydnppyolkm` (production) ❌ |
| Production URL ref in bundle | **no** |
| `url_anon_mismatch` | **true** |

**Interpretation:** Client bundle calls staging Supabase URL with a production anon JWT. Supabase rejects auth → UI shows generic „Falsche E-Mail oder falsches Passwort“.

### Provider Guard

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/generate-image` (via `vercel curl`) |
| Result | **PASS** |
| `code` | `PROVIDERS_DISABLED` |
| `generationId` | **no** |
| `imageUrl` | **no** |
| Provider call | **none** |

---

## UI Login (Playwright)

| Field | Value |
|-------|-------|
| UI Login PASS | **skipped** |
| Reason | Preview bundle gate fail + `VISUAL_QA_PASSWORD` missing |
| Final URL | n/a |
| Error Text | n/a |
| Auth Request Host | n/a |
| Auth Request Status | n/a |
| Session gesetzt | n/a |

After Vercel env fix + password set, re-run:

```powershell
$env:VISUAL_QA_PASSWORD = '…'
npm run launch:auth-truth
```

Login page now detects URL/anon mismatch client-side and shows a config error instead of misleading bad-credentials text.

---

## Dashboard Readiness

| Check | Result |
|-------|--------|
| Dashboard erreichbar | **not tested** |
| Image Generator erreichbar | **not tested** |
| Credits 75 sichtbar | **not tested** |
| Provider-disabled Banner | **not tested** |
| Gallery erreichbar | **not tested** |

---

## Diagnosis

**Fall B — Preview Env/Deploy mismatch (`preview_anon_key_production_url_staging`)**

Root cause is **not** wrong password, user sync, or login-form bug. Preview `NEXT_PUBLIC_SUPABASE_ANON_KEY` JWT ref is production while `NEXT_PUBLIC_SUPABASE_URL` points to staging.

### Vercel Fix (Preview only — no `--prod`)

1. Vercel Dashboard → Project **influexai** → Settings → Environment Variables → **Preview**
2. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the **staging** anon key (JWT ref must be `jvjmqtxlqfqaoyjklpxh`)
3. Confirm `NEXT_PUBLIC_SUPABASE_URL` = `https://jvjmqtxlqfqaoyjklpxh.supabase.co`
4. Redeploy preview only:

   ```bash
   npx vercel --yes
   ```

5. Verify bundle:

   ```bash
   node scripts/scan-preview-supabase-bundle.mjs
   ```

   Expect: `url_anon_mismatch: false`, `anon_jwt_refs: ["jvjmqtxlqfqaoyjklpxh"]`

6. Re-run auth truth with password set.

---

## Code Fixes (this sprint)

| Change | Purpose |
|--------|---------|
| `scripts/visual-qa-auth-truth.mjs` | G.10-P launch gate: ensure user → direct sign-in → bundle scan → provider guard → Playwright |
| `scripts/lib/resolve-latest-preview.mjs` | Auto-resolve latest Ready Preview (skips Production) |
| `scripts/lib/preview-provider-guard.mjs` | Windows-safe `vercel curl` POST probe (`--` separator) |
| `src/app/(auth)/login/page.tsx` | Detect URL/anon mismatch; show config error not bad password |
| `tests/e2e/flows/visual-qa-auth-truth.test.ts` | G.10-P read-only UI probe incl. gallery |
| `package.json` | `launch:auth-truth` script |

No DB migration. No provider calls. No production deploy.

---

## G.10-O Provider-UI-Smoke — remaining blockers

1. Fix Vercel Preview `NEXT_PUBLIC_SUPABASE_ANON_KEY` (staging JWT ref)
2. Set `VISUAL_QA_PASSWORD` and confirm direct sign-in PASS
3. Re-scan bundle → `url_anon_mismatch: false`
4. Playwright UI login PASS
5. Dashboard read-only checks PASS
6. Explicit provider window (separate sprint — not G.10-P)

---

## Secrets

No passwords, keys, or bypass tokens logged in this report.

# Generate Image Save Failure — Diagnosis (G.10-F)

**Date:** 2026-06-20  
**Branch:** `master`  
**Smoke phase:** G.10-E (single supervised run)

---

## Summary

| Item | Finding |
|------|---------|
| **Root cause** | ✅ **PostgreSQL 42501** — missing `GRANT` on `public.generations` (and `credit_transactions`) on staging |
| **Provider reached?** | ✅ **Yes** (~83s duration → FAL + storage before DB insert) |
| **imageUrl** | ❌ **null** (insert failed before response built) |
| **Credits safe?** | ✅ **75 → 75** (RPC deduct + refund in catch) |
| **Gallery SSOT** | `generations` table — correct code path, DB not writable |
| **Code fix** | Error classification + dev `saveHint` |
| **Infra fix** | Migration **068** (not yet applied on staging) |
| **Provider smoke allowed now?** | ❌ **No** — apply 068 first |

---

## 1. Symptom

From `scripts/supervised-smoke-result.json`:

```json
{
  "http_status": 500,
  "duration_ms": 83481,
  "error": "Generierung konnte nicht gespeichert werden.",
  "generationId": null,
  "imageUrl": null,
  "credits_before": 75,
  "credits_after": 75
}
```

---

## 2. Code path

```
POST /api/generate-image
  generateImageProviderGuardResponse()     → pass (G.10-D window)
  assertKiToolAccess + deductCredits       → profiles RPC ✅
  generateCategoryImage (FAL)              → ✅ (~60–80s)
  ingestImageGeneratorAssets (service)     → ✅ generated-assets bucket
  createGenerationRecord (user client)     → ❌ INSERT 42501
  catch → addCredits refund                → ✅ credits restored
  HTTP 500                                 → generic message (now with saveHint in dev)
```

**Not involved:** legacy `gallery_assets`, wrong provider mapping, null `imageUrl` from FAL.

---

## 3. DB diagnosis (no provider call)

```
npm run smoke:generate-image:verify-db
```

Current staging (`jvjmqtxlqfqaoyjklpxh`):

| Table | service_role | authenticated |
|-------|--------------|---------------|
| `profiles` | ok | ok |
| `generations` | **42501** | **42501** |
| `credit_transactions` | **42501** | **42501** |

**42501** = table-level privilege missing. RLS policies exist (migration 045) but PostgreSQL requires explicit `GRANT`.

---

## 4. Why credits stayed stable

1. `deductCredits` uses `deduct_credits` RPC on `profiles` (granted) — credits temporarily −5.
2. `createGenerationRecord` throws `GenerationSaveError`.
3. Catch calls `addCredits` refund — net **0**.

`skipGenerationLog: true` on deduct avoids a second generations insert during deduct.

---

## 5. Fixes applied (repo)

| Change | File |
|--------|------|
| GRANT migration | `supabase/migrations/068_generations_authenticated_grants.sql` |
| SQL Editor script | `scripts/apply-generations-sql-editor.sql` |
| Error classification | `src/lib/generation-save-errors.ts` |
| Dev saveHint on 500 | `src/app/api/generate-image/route.ts` |
| Unit tests | `tests/unit/lib/generation-save-errors.test.ts` |
| Smoke npm scripts | `package.json` |
| Local artifact ignore | `.gitignore` → `scripts/supervised-smoke-result.json` |

---

## 6. Open — requires human on staging

Apply migration 068:

```bash
supabase link --project-ref jvjmqtxlqfqaoyjklpxh
supabase db push --linked
```

Or paste GRANT section from `scripts/apply-generations-sql-editor.sql` in Supabase SQL Editor.

Verify:

```bash
npm run smoke:generate-image:verify-db
# Expect: ok: true, blockers: []
```

---

## 7. Next provider smoke (G.10-G) — when allowed

**Preconditions:** `verify-db` → `ok: true`

### One-command flow (after opening env window manually)

1. **Open window** (`.env.local` only, never commit):
   ```env
   ALLOW_SAFE_DEV_PROVIDER_SMOKE=true
   PROVIDERS_DISABLED=false
   ```
2. Restart: `npm run dev`
3. **Single run:**
   ```bash
   npm run smoke:generate-image:run-safe
   ```
   (`run-safe` runs audit + verify-db + exactly one provider call)

4. **Close window** (script prints reminder):
   ```env
   PROVIDERS_DISABLED=true
   # ALLOW_SAFE_DEV_PROVIDER_SMOKE=false or unset
   ```
5. Restart dev + `npm run smoke:generate-image:guard-probe` → expect 503

### Env that must stay OFF outside window

- `ALLOW_PRODUCTION_DEV_WRITES` / `I_UNDERSTAND_PRODUCTION_WRITES`
- Stripe live keys
- Production Supabase ref
- Akool / ElevenLabs keys during image smoke

---

## 8. Abschluss

| Question | Answer |
|----------|--------|
| Ursache gefunden | **ja** — missing GRANTs |
| Migration nötig | **ja** — 068 on staging |
| Weiterer Provider-Smoke | **nein** bis 068 applied + verify-db ok |
| Refund nötig war | **ja** (automatisch im catch) |

# Provider Smoke Result — generate-image

**Last updated:** 2026-06-20 (G.10-F diagnosis)  
**Branch:** `master`

---

## G.10-F — Save Failure Diagnosis

### Symptom (G.10-E smoke)

| Field | Value |
|-------|-------|
| HTTP status | **500** |
| Error | `Generierung konnte nicht gespeichert werden.` |
| Duration | **~83s** (FAL + storage likely succeeded) |
| Credits | **75 → 75** (deduct + refund via RPC) |
| Generations | **0** (insert never committed) |
| `scripts/supervised-smoke-result.json` | Confirms above |

### Root cause: **PostgreSQL 42501 — missing table GRANTs**

Staging Supabase (`jvjmqtxlqfqaoyjklpxh`) has `public.generations` with RLS policies, but **`authenticated` and `service_role` lack table-level GRANTs**.

Diagnostic (no provider call):

```
profiles:           ok
generations:        42501 permission denied for table generations
credit_transactions: 42501 permission denied for table credit_transactions
user generations:   42501 permission denied for table generations
```

**Not the cause:**

| Ruled out | Evidence |
|-----------|----------|
| Provider guard / dev-write guard | Request reached handler (~83s) |
| FAL failure | Would fail faster with FAL error message |
| Storage upload | Would throw `Storage-Upload fehlgeschlagen` |
| RLS policy mismatch | Error is **42501** (privilege), not RLS violation |
| Insert payload shape | Same payload fails with permission denied before row check |
| Output URL mapping | Never reached — no `generationId` |
| Gallery SSOT logic | Correct target (`generations`); table unreadable |

### Failure chain

```
POST /api/generate-image
  → deductCredits (RPC deduct_credits on profiles) ✅
  → generateCategoryImage (FAL) ✅ ~60–80s
  → ingestImageGeneratorAssets (service_role storage) ✅
  → createGenerationRecord (user supabase client INSERT) ❌ 42501
  → catch → addCredits refund ✅ → HTTP 500 generic message
```

### Fix (no provider retry in G.10-F)

| Item | Action |
|------|--------|
| Migration | `supabase/migrations/068_generations_authenticated_grants.sql` |
| Manual SQL | `scripts/apply-generations-sql-editor.sql` (updated with GRANTs, staging ref) |
| Apply on staging | `supabase db push --linked` or paste SQL in Supabase SQL Editor |
| Code | `GenerationSaveError` + non-prod `code` / `saveHint` on 500 responses |
| Tests | `tests/unit/lib/generation-save-errors.test.ts` |

**After migration 068 on staging:** re-run supervised smoke (G.10-G) — expect insert + gallery row.

### Improved error mapping (dev/preview)

Non-production 500 responses now include:

```json
{
  "success": false,
  "error": "Generierung konnte nicht gespeichert werden.",
  "code": "GENERATIONS_PERMISSION_DENIED",
  "saveHint": "Staging DB lacks GRANT on public.generations — apply migration 068..."
}
```

Production responses remain generic (no `saveHint`).

### Credit / refund status (G.10-E)

| Step | Status |
|------|--------|
| Deduct before FAL | Likely succeeded (`deduct_credits` RPC) |
| Refund on save failure | Likely succeeded (same RPC path) |
| Net credits | **0** (75 → 75) ✅ |
| `credit_transactions` insert | May also fail 42501 if logged separately — migration 068 fixes |

### Logs

| Source | Finding |
|--------|---------|
| `.next/logs/next-development.log` | Not present in repo (Next 16 dev output in terminal) |
| Terminal dev server | No persisted `DB INSERT FEHLER` line in captured logs |
| Server log pattern | `DB INSERT FEHLER` now includes `saveErrorCode` |

---

## Prior phases (summary)

| Phase | Outcome |
|-------|---------|
| G.10-A/B | BLOCKED — missing FAL key |
| G.10-C | FAIL — dev write guard 403 |
| G.10-D | Narrow `ALLOW_SAFE_DEV_PROVIDER_SMOKE` implemented |
| G.10-E | FAIL — HTTP 500 save (this diagnosis) |

---

## Next step — G.10-G

1. Apply migration **068** on staging (`jvjmqtxlqfqaoyjklpxh`)
2. Verify: `select` on `generations` as test user succeeds
3. Supervised smoke **one** run with G.10-D env window
4. Expect: HTTP 200, −5 credits, `generations` row, gallery entry

**Do not re-run provider smoke until 068 is applied.**

---

## Sign-off (G.10-F)

| Question | Answer |
|----------|--------|
| Root cause identified | ✅ Missing GRANTs on `generations` |
| Fix without provider call | ✅ Migration 068 + error diagnostics |
| Provider re-run in G.10-F | ❌ None |

# Launch Operator — G.10-Q

Generated: 2026-06-20T20:35:00Z  
Branch: `master`  
HEAD (pre-commit): `955fc5a`

## Operator Status

**Full operator run: BLOCKED** — `VISUAL_QA_PASSWORD` not set in shell or `.env.local`.

```powershell
$env:VISUAL_QA_PASSWORD = 'DEIN_NEUES_TEMPORÄRES_PASSWORT'
npm run launch:operator
```

The operator script (`scripts/launch-operator.mjs`) is ready and will:

1. Validate local safety (staging Supabase, test Stripe, providers disabled)
2. Sync Preview-scoped Vercel env from `.env.local` (never logs values)
3. Deploy Preview via `npx vercel --yes` (never `--prod`)
4. Scan client bundle for Supabase ref alignment
5. Ensure `visualqa@influexai.test` on staging
6. Direct `signInWithPassword` probe
7. Playwright UI login + dashboard read-only checks
8. Provider guard probe (`PROVIDERS_DISABLED`)
9. Write this report with Go/No-Go gates

---

## Launch Gate (not executed)

| Gate | Result |
|------|--------|
| Preview Gate | **pending** |
| Auth Gate | **pending** |
| UI Gate | **pending** |
| Provider Guard | **pending** |
| G.10-O Provider-UI-Smoke ready | **no** |

---

## Safety Preflight (local)

| Check | Result |
|-------|--------|
| `.env.local` present | yes |
| `.env.local` staged | no |
| `public/images/lora-training/` staged | no |
| `PROVIDERS_DISABLED` | `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | `false` |
| `STRIPE_MODE` | `test` |
| Local Supabase ref | `jvjmqtxlqfqaoyjklpxh` |
| Local anon JWT ref | `jvjmqtxlqfqaoyjklpxh` (match) |
| Production Supabase locally | blocked |
| Stripe Live | no |
| `VISUAL_QA_PASSWORD` | **missing** |
| Provider call | none |
| Production deploy | none |

### Tests

| Command | Result |
|---------|--------|
| `npm run lint` | PASS |
| `npm run test:unit -- --run` | PASS (231/231) |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

---

## Known Blocker (from G.10-P)

Last bundle scan on Ready Preview showed **URL staging + anon JWT production** mismatch. The operator re-syncs Preview env from local `.env.local` and redeploys automatically to fix this.

---

## Production Dry-Run

**Not enabled** in this run. Requires:

```
LAUNCH_SCOPE=production-dry-run
LAUNCH_CONFIRM=I_UNDERSTAND_DRY_RUN_NO_LIVE
```

Even when confirmed, the operator does **not** run `vercel --prod` automatically.

---

## Diagnosis

- **operator_blocked_missing_password**
- Next: set `VISUAL_QA_PASSWORD` → `npm run launch:operator`

No secrets in this report.

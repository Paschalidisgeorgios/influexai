# Gallery Persistence Decision Note

**Date:** 2026-06-16  
**Branch:** `launch-train/overnight-safe-completion`  
**Status:** Decision record for next technical phase (no migration in this prompt)

---

## 1. Current State — Two Parallel Systems

| System | Table / storage | Primary consumer | Migration in repo |
|--------|-----------------|------------------|-------------------|
| **Active (SSOT for `/dashboard/gallery`)** | `generations` + bucket `generated-assets` | `getGallery()` in `src/app/actions/get-gallery.ts` | ✅ `002`, `032`, `041`, `045`, indexes |
| **Legacy (Studio sidebar)** | `gallery_assets` | `GET /api/dashboard/init`, `POST/DELETE /api/dashboard/asset` | ❌ **No migration file** |

**Staging observation:** `gallery_assets` table is **missing** on staging Supabase (`jvjmqtxlqfqaoyjklpxh`). Init route logs error and returns empty `assets[]` — non-fatal.

---

## 2. Active Gallery Architecture

### Database: `generations`

Defined in `supabase/migrations/045_ensure_generations.sql` (consolidates earlier migrations):

- Columns: `id`, `user_id`, `type`, `prompt`, `credits_used`, `result` (JSONB), `created_at`, community flags
- RLS: user owns rows; public read policies for community profiles
- Indexes: `(user_id, created_at)`, `(user_id, type)`

### Storage: `generated-assets`

Managed by `src/lib/generation-assets.ts`:

- Images: `{userId}/{generationId}/preview.jpg`, `final.jpg`, `source.jpg`
- Video: `final.mp4`
- Audio: `final.mp3`

### UI entry point

- Page: `/dashboard/gallery`
- Server action: `getGallery(filter, page, limit, search)`
- Also aggregates **non-media** tables: `saved_scripts`, `thumbnail_concepts`, `niche_saves`, `outlier_results`, `remix_results`

---

## 3. Legacy Gallery Architecture

### Database: `gallery_assets`

Referenced in:

- `src/app/api/dashboard/init/route.ts` — last 20 assets for Studio sidebar
- `src/app/api/dashboard/asset/route.ts` — POST/DELETE for agent-saved assets
- Comments in `delete-account` route

**No `CREATE TABLE gallery_assets` in `supabase/migrations/`** — table may exist only on older production DBs or was never migrated to staging.

### Behavior

- Agent text tools could save via `POST /api/dashboard/asset` with `skipDeduction: true`
- Medien tools were expected to persist via `generations` directly (per route comments)

---

## 4. Tool → Persistence Matrix

### 4a — Media tools → `generations` (gallery persisted)

| Tool ID | API route(s) | `generations.type` | In `GALLERY_PERSISTED_TOOL_IDS` | Notes |
|---------|--------------|-------------------|--------------------------------|-------|
| `image-gen` | `POST /api/generate-image` | `image` | ✅ | First provider smoke; full asset pipeline |
| `img-to-video` | `POST /api/seedance`, Akool i2v | `video` / product types | ✅ | Defer provider smoke |
| `text-to-video` | Akool t2v, product-ad | `video` | ✅ | Defer |

### 4b — Media tools → `generations` (implemented but not in UI set)

| Tool / route | Persists? | Notes |
|--------------|-----------|-------|
| `POST /api/upscale-image` | Yes (`generations`) | Upscale variants |
| `POST /api/ki-ich` | Yes | PuLID portraits |
| `POST /api/product-ad/generate` | Yes | Video ads |
| `POST /api/stimme/speak` | Yes | Audio type |
| `POST /api/live-creator` | Yes | High risk — defer |
| LoRA generate | Yes | Excluded from smoke |
| Agent stream tools | Sometimes | Via tool-specific handlers |

**UI gap:** Setup copy only promises gallery for `GALLERY_PERSISTED_TOOL_IDS` (3 tools). Other media tools may persist without user-facing promise.

### 4c — Text / analysis → dedicated tables (shown in gallery aggregate)

| Tool ID | Table | Gallery `_type` |
|---------|-------|-----------------|
| viral-hook / scripts | `saved_scripts` | `script` |
| thumbnail | `thumbnail_concepts` | `thumbnail` |
| niche | `niche_saves` | `niche` |
| outlier | `outlier_results` | `outlier` |
| remix | `remix_results` | `remix` |

Some routes **also** insert into `generations` for audit (e.g. `trend-script`, `content-kalender`, `competitor`) — dual write pattern.

### 4d — Inline-only (no gallery persistence expected)

| Tool / feature | Result location | Rationale |
|----------------|-----------------|-----------|
| `viral-score` | Inline JSON + optional `generations.result` | Score display in tool |
| `competitor-analysis` | Inline + optional generation log | Report UX |
| `agent/plan-preview` | Inline only | No DB write |
| `onboarding/copilot` | Inline | Ephemeral |
| Model/voice **lists** (GET akool/ugc voices) | N/A | Read-only |
| Stripe / billing flows | `profiles.credits` | Not gallery |

---

## 5. Missing Tables / Migrations

| Item | Status | Impact |
|------|--------|--------|
| `generations` | ✅ Migrated | Gallery works on staging |
| `generated-assets` bucket | ✅ Expected on staging | Required for image smoke |
| `gallery_assets` | ❌ Not in repo migrations | Studio sidebar empty on staging |
| `saved_scripts`, `thumbnail_concepts`, etc. | ✅ Various migrations | Text gallery filters work if populated |

---

## 6. Recommendation — Next Technical Phase

### Phase G.10 (proposed): Gallery SSOT consolidation (docs + small code, no big-bang)

1. **Declare `generations` + `generated-assets` as the single source of truth** for all new media persistence.
2. **Do not add `gallery_assets` migration to staging** unless a product decision requires Studio sidebar parity — prefer reading last N from `generations` in `dashboard/init`.
3. **Expand `GALLERY_PERSISTED_TOOL_IDS`** only after each tool’s provider smoke confirms stable `generations` writes (start with `image-gen` only).
4. **Deprecate `POST /api/dashboard/asset`** for new features; keep for backward compatibility until production `gallery_assets` is empty or migrated.
5. **Delete path:** `deleteGalleryItem` today does **not** delete `generations` rows — add generation delete in a follow-up (storage cleanup + RLS).

### Phase G.11 (proposed): After first provider smoke

- Verify `generate-image` row appears in `getGallery('image')`.
- Document generation `type` enum conventions (`image`, `video`, audio types).
- Optional: backfill Studio sidebar from `generations` query (limit 20).

### Explicitly out of scope (4G.9-A)

- No migration files
- No data backfill
- No removal of `gallery_assets` code paths

---

## 7. Decision Summary

| Question | Decision |
|----------|----------|
| Active gallery table? | **`generations`** (+ storage bucket) |
| Legacy table? | **`gallery_assets`** — legacy, unmigrated on staging |
| First tool to validate end-to-end? | **`image-gen`** via `/api/generate-image` |
| Tools with inline-only UX? | Plan preview, list endpoints, billing, ephemeral copilot |
| Next code change (when approved)? | Point `dashboard/init` at `generations` instead of `gallery_assets` |

---

## References

- `src/app/actions/get-gallery.ts` — primary gallery reader
- `src/app/api/dashboard/init/route.ts` — legacy sidebar loader
- `src/lib/generation-assets.ts` — media persistence helpers
- `src/components/dashboard/core/production-tool-setup-ui.ts` — `GALLERY_PERSISTED_TOOL_IDS`
- `docs/reports/provider-staging-smoke-plan.md` — smoke verification steps
- `DASHBOARD_IA_FREEZE.md` — notes dual gallery sources unchanged in launch train

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
| `canvas/tool-credit-costs.ts` | Canvas coin display | **Replace** with canonical creditPolicy |
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
| `/api/lora/train` | postpay | fal job submitted before deductCredits |
| `/api/stimme/speak`, `/api/stimme/clone` | postpay | ElevenLabs before debit |
| Server actions: niche, script, thumbnail, content calendar | postpay | provider before debit |
| `/api/v1/*` | postpay | withCredits after generation |
| `/api/live-creator` POST→GET | deferred | Akool job before debit on poll |
| `/api/agent/copilot` | none | no plan/credit gate |
| `/api/agent/stream-tool` | none | unbilled stream |

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

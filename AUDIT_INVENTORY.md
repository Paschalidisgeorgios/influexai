# AUDIT INVENTORY — INFLUEXAI Dashboard
> Generated: 2026-06-15 | Branch: main | Commit: 8f315e3

---

## 1. `src/components/dashboard/core/`

| File | Description |
|------|-------------|
| `AgentBox.tsx` | Floating command overlay: tool forms (viral-hook, content-calendar, trend-script, img-to-video) + Claude SSE streaming (`/api/agent`) + copilot chat (`/api/agent/copilot`) |
| `AssetModal.tsx` | Fullscreen cinematic asset viewer (image/video/text) with metadata panel, copy actions, Escape-to-close |
| `DashboardBoard.tsx` | Canvas board shell composing IntelligenceBridge + PanelStrip + ShortcutsHelp |
| `DashboardHeader.tsx` | Top header: BrandWordmark, personalized greeting, admin badge, onboarding button |
| `DashboardIntelligenceBridge.tsx` | Invisible bridge: connects Claude agent events to canvas store |
| `DashboardLayout.tsx` | **Primary layout**: left sidebar, Studio Home, tool views, gallery, settings, right panel, credit/gallery orchestration |
| `DashboardMobileNav.tsx` | Mobile bottom bar + slide-up drawer wrapping DashboardSidebarContent |
| `DashboardNodeErrorBoundary.tsx` | React error boundary for dashboard panel nodes |
| `DashboardPanelStrip.tsx` | Horizontal strip for ToolControlPanel and asset viewer nodes |
| `DashboardShell.tsx` | Root layout wrapper: routes legacy pages vs. new DashboardLayout |
| `DashboardShortcutsHelp.tsx` | Keyboard shortcuts overlay (?, Esc, G) |
| `DashboardSidebar.tsx` | Fixed 280px glass sidebar shell (canvas-era) |
| `DashboardSidebarContent.tsx` | Accordion sidebar with toolApiSchema categories, credits, logout |
| `GalleryGrid.tsx` | Krea-style asset grid: image/video/text cards, skeleton, hover actions, AssetModal |
| `PipelineProvider.tsx` | Minimal React context (placeholder for tool-to-viewer wiring) |
| `SettingsPanel.tsx` | Right sidebar: tool-specific settings (image, fal video, UGC) + preset management |
| `SettingsView.tsx` | Full-page settings: Profile/Credits, API Keys, Danger Zone (GDPR) |
| `TopUpOverlay.tsx` | Modal overlay shown when user has insufficient credits |
| `onboarding/OnboardingAgentShell.tsx` | Inactivity wrapper mounting OnboardingChatOverlay |
| `onboarding/OnboardingChatOverlay.tsx` | Floating onboarding copilot UI driven by onboarding-store |

---

## 2. `src/components/dashboard/tools/`

| File | Description |
|------|-------------|
| `BaseTool.tsx` | Generic wrapper for registered ToolModule: form, validation, credit warning, generate button |
| `KreaImageTool.tsx` | Image generator module (Fal/Krea): model, prompt, aspect ratio, count → `POST /api/generate-image` |
| `ParamFields.tsx` | Dynamic fallback form renderer from ToolParamSchema for non-migrated tools |
| `ToolControlPanel.tsx` | Control panel per canvas node: BaseTool for registered modules or ParamFields fallback |
| `UgcVideoTool.tsx` | Video generator (Seedance/Akool): model, duration, resolution, image upload → `POST /api/seedance` |
| `shared.tsx` | UI primitives: FieldLabel, TextareaField, SelectField, SliderField, DropzoneField, GroupedModelSelect |
| `types.ts` | `ToolModule` + `ToolFormProps` interfaces (validate, buildPayload, apiRoute, polling) |

---

## 3. `src/components/dashboard/viewer/`

| File | Description |
|------|-------------|
| `AssetErrorState.tsx` | Error display for failed generation with optional retry |
| `AssetLoadingShader.tsx` | Animated loading shader during processing |
| `AssetNode.tsx` | Full viewer panel: header + status-gated body (loading/error/reveal) + share panel |
| `AssetReveal.tsx` | Renders completed media (img / video player / text) with motion reveal |
| `AssetSharePanel.tsx` | Copy link, download, open-in-new-tab actions |
| `BrollRecommendViewer.tsx` | B-roll recommendations placeholder (stub) |

---

## 4. New API Routes

### `src/app/api/dashboard/`

| Route | Method | Description |
|-------|--------|-------------|
| `init/route.ts` | GET | Loads user credits from `profiles` + last 20 `gallery_assets`; returns `{ credits, assets }` |
| `asset/route.ts` | POST | Saves asset; optionally deducts credits (`skipDeduction` flag); returns `{ asset, remainingCredits }` |
| `asset/route.ts` | DELETE | Removes asset by `?id=uuid` for authenticated user |
| `delete-account/route.ts` | DELETE | GDPR Art. 17 — `auth.admin.deleteUser`, signOut, clears session cookies |
| `revoke-contract/route.ts` | POST | Records `contract_revoked_at` on profile; triggers `contract-revocation-email` edge function (§355 BGB) |

### `src/app/api/agent/`

| Route | Method | Description |
|-------|--------|-------------|
| `copilot/route.ts` | POST | SSE copilot stream; system prompt includes `[[NAVIGATE:tool-id]]` markers; requires auth |
| `stream-tool/route.ts` | POST | Thin Anthropic streaming proxy with tool-specific system prompts (viral-hook, content-calendar, trend-script) |

---

## 5. `src/lib/dashboard/promptOptimizer.ts`

### Exports
```ts
interface OptimizedPromptResult {
  original:       string
  optimized:      string
  wasGerman:      boolean
  creditsRequired: number
  enhancements:   string[]
}

async function optimizeUserPrompt(userPrompt, toolId, settings?) → OptimizedPromptResult
function calculateExactCredits(toolId, settings?) → number
function formatCreditCost(credits) → string
```

### `optimizeUserPrompt` Pipeline
1. Detect German (umlauts + stopwords) → dictionary translate
2. Text tools → prepend Claude no-intro system prefix
3. Image tools → inject model keywords + cinematic suffix + dynamic `--ar` flag
4. Video tools (`img-to-video`, `text-to-video`) → motion keywords + Kling cinematic suffix
5. Other media → translation only

### `calculateExactCredits` Table
| Tool | Credits |
|------|---------|
| `gallery`, `settings`, `studio` | 0 |
| Text tools (`viral-hook`, `content-calendar`, `trend-script`) | 1 |
| `image-gen` / `img-to-img` — nano-banana-pro / flux-2-pro | 5 |
| `image-gen` / `img-to-img` — default | 3 |
| `img-to-video` / `text-to-video` — 10s | 30 |
| `img-to-video` / `text-to-video` — 5s | 15 |
| `ecommerce-ads` | 8 |
| Akool tools (avatar-video, talking-avatar, etc.) | 10 |
| `tts`, `voice-clone`, `voice-changer` | 2 |
| `jarvis-moderator` | 1 |
| default | 5 |

---

## 6. `ToolId` Union Type

```
Navigation:  studio | gallery | settings
Text:        viral-hook | content-calendar | trend-script
Video:       img-to-video | text-to-video | video-to-video | ref-to-video
             face-swap-video | character-swap | char-studio-video | avatar-video
             video-translation | talking-avatar | talking-photo | ai-video-editor | ecommerce-ads
Image:       face-swap-image | image-gen | img-to-img | char-studio-image | jarvis-moderator
Audio:       tts | voice-clone | voice-changer
Live/Akool:  live-camera | streaming-avatar | live-face-swap | ai-support-agent
             akool-production | holographic-avatar | akool-edge
```

Also: `FalModelPreset` = `kling-v3-4k | kling-v2-master | kling-v2.5-turbo | nano-banana-2 | nano-banana-pro`

---

## 7. DashboardLayout — State Variables

```ts
activeTool:       ToolId                          // default: "studio"
isRightPanelOpen: boolean                         // default: false
credits:          number                          // default: 0
creditsLoaded:    boolean                         // default: false
galleryAssets:    GalleryItem[]                   // default: []
isGalleryLoading: boolean                         // default: true
toolsGenerating:  Partial<Record<ToolId, boolean>> // default: {}
searchQuery:      string                          // default: ""
activeFilter:     "all"|"image"|"video"|"text"    // default: "all"
toolSettings:     ToolSettings | null             // default: null
// Ref (no re-render):
toolSettingsRef:  ToolSettings | null
// LeftSidebar internal:
toolsExpanded:    boolean                         // default: false
```

---

## 8. Navigation Structure

### TOP_NAV (top-level sidebar)
| id | Label | toolTarget |
|----|-------|-----------|
| `agent` | Agent | `gallery` |
| `tools` | Tools | `viral-hook` (+ expands tool list) |
| `projects` | Projects | `gallery` |
| `my-brand` | My Brand | `settings` |

**Advanced section:** Studio → `studio`

### resolveTopNav() mapping
- `studio` → Studio button (Advanced)
- `gallery` → `projects`
- `settings` → `my-brand`
- Text tools → `agent`
- All other tools → `tools`

### TOOLS_WITH_RIGHT_PANEL (auto-opens SettingsPanel)
`image-gen` | `img-to-img` | `img-to-video` | `text-to-video` | `ecommerce-ads`

---

## 9. Studio Home Cards

### HERO_CARDS (3-column Breitbild-Grid, `aspect-[16/10]`)
| # | id | CTA | Image |
|---|----|----|-------|
| 1 | `img-to-video` | "AD FLOW →" | Unsplash studio scene + lime glow |
| 2 | `avatar-video` | "AVATAR VIDEO →" | Unsplash portrait + cinema gradient |
| 3 | `viral-hook` | "AI MEDIA BUYER →" | Vercel-style grid + radial white glow |

### SMALL_CARDS_CREATE
`image-gen` (Asset Generator, hot) · `ecommerce-ads` (Video Ad, new) · `img-to-img` (Image Ad)

### SMALL_CARDS_ANALYZE
`viral-hook` · `content-calendar` · `trend-script`

---

## 10. AgentBox.tsx — Key Types & Internal Components

### Exported
```ts
interface AgentBoxProps { activeTool, toolSettings?, currentCredits?, onActionExecute, onNavigate? }
const AgentBox  // memo-wrapped
```

### Internal Form Types
```ts
ViralHookValues       { thema, tonalitaet }
ContentCalendarValues { thema, plattformen }
TrendScriptValues     { trendLink, laenge }
ImgToVideoValues      { startFrameUrl, endFrameUrl, motionPrompt }
FormValues            // union of above
```

### Internal Components
`NakedTextarea` · `PlatformLinks` · `TinySelect` · `FormActionRow`
`ViralHookForm` · `ContentCalendarForm` · `TrendScriptForm`
`FrameDropzone` · `ImgToVideoForm` · `MediaActionButton`
`OutputPanel` · `CopilotChat`

### Key Sets
```ts
MEDIA_TOOLS           = { image-gen, ecommerce-ads, img-to-video, text-to-video, video-to-video }
COPILOT_TRIGGER_TOOLS = { gallery, settings }
```

---

## 11. SettingsPanel.tsx — Tool Routing

| Tools | Panel | Controls |
|-------|-------|---------|
| `image-gen`, `img-to-img` | `ImageGenPanel` | Model (nano-banana-2/pro, flux-2-pro), aspect ratio, CFG scale, steps, presets |
| `img-to-video`, `text-to-video` | `FalVideoPanel` | Kling model variants, aspect ratio, duration (5s/10s), presets |
| `ecommerce-ads` | `UgcVideoPanel` | Format, KI voice, subtitles toggle, audiobed toggle, presets |
| All text tools | `EmptyState` | "Keine erweiterten Einstellungen für Text-Tools" |

---

## 12. GalleryGrid.tsx — `GalleryItem` Interface

```ts
export interface GalleryItem {
  id:        string
  type:      "text" | "image" | "video"
  url?:      string
  content?:  string
  prompt:    string
  tool:      string
  createdAt: string
}
```

---

## 13. SettingsView.tsx — Sections

| Tab | Content |
|-----|---------|
| `profile` — "Profil & Guthaben" | Email (Supabase auth), credit balance, link to `/dashboard/credits` |
| `api` — "API-Integrationen" | fal.ai + Akool API key inputs (show/hide), save button, billing link |
| `danger` — "Gefahrenzone & Rechtliches" | Contract revocation (§355 BGB) → `POST /api/dashboard/revoke-contract`; Account deletion (Art. 17 DSGVO, confirm "LÖSCHEN") → `DELETE /api/dashboard/delete-account` |

Layout: 3-column grid — left tab nav, right 2 cols active content.

---

## Summary

| Area | Count |
|------|-------|
| Core components | 20 |
| Tool modules | 7 |
| Viewer components | 6 |
| New API routes | 7 |
| ToolId values | 37 |
| FalModelPreset values | 5 |
| Dashboard state variables | 11 |
| SettingsPanel tool panels | 4 |
| Studio Hero cards | 3 |
| Studio small cards | 6 |

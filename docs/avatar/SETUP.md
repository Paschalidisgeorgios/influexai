# Avatar Studio — Setup Anleitung

## Aktueller Stand
- ✅ Dashboard UI (Avatar Studio)
- ✅ API Routes (`create-job`, `start-render`, `job/[id]`)
- ✅ Supabase Tabelle (`avatar_render_jobs`)
- ✅ Credit Pricing (`estimateAvatarCredits`)
- ✅ fal.ai Live Portrait (`fal-ai/live-portrait`) — synchroner Render
- ❌ Untertitel / Branding / Voiceover (Post-Processing, später)

## Voraussetzungen

In `.env.local` und Vercel **Production**:

```
FAL_API_KEY=...   # oder FAL_KEY=
```

Optional: `NEXT_PUBLIC_APP_URL` für absolute URLs in E-Mails/Redirects.

## Testen

1. Avatar Studio öffnen (`/dashboard/avatar-studio`)
2. Testbild + Driving-Video hochladen (max. 30 Sek.)
3. Optionen wählen, Einwilligung bestätigen
4. Render starten — dauert ca. 30–90 Sekunden (synchron)
5. Video wird angezeigt; Credits werden erst nach Erfolg abgebucht

## Legacy

RunPod-Integration wurde entfernt. Alte Doku: `docs/avatar/RUNPOD_WORKER.md` (veraltet).

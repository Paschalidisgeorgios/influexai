# Avatar Studio — Setup Anleitung

## Aktueller Stand
- ✅ Dashboard UI (Avatar Studio)
- ✅ API Routes (`create-job`, `start-render`, `job/[id]`, callback)
- ✅ Supabase Tabelle (`avatar_render_jobs`)
- ✅ Credit Pricing (`estimateAvatarCredits`)
- ✅ Types (`AvatarRenderJob` etc.)
- ⚠️ RunPod Integration (vorbereitet, Mock-Modus aktiv)
- ❌ Docker Worker (noch nicht gebaut)
- ❌ FasterLivePortrait (lokal noch nicht getestet)

## Aktivieren wenn RunPod bereit

1. RunPod Account + Guthaben
2. Docker Worker bauen (`docs/avatar/RUNPOD_WORKER.md`)
3. Endpoint erstellen
4. In Vercel setzen:
   ```
   RUNPOD_API_KEY=...
   RUNPOD_ENDPOINT_ID=...
   ```
5. `RUNPOD_WEBHOOK_SECRET` setzen
6. Callback URL in RunPod eintragen:
   ```
   https://influexaicreator.com/api/avatar/runpod-callback
   ```

## Testen
1. Avatar Studio öffnen
2. Testbild hochladen
3. Test-Video hochladen (5–10 Sekunden)
4. Optionen wählen
5. Render starten
6. RunPod Dashboard prüfen
7. Ergebnis im Dashboard anzeigen

# Quality Gates

## Text Quality Checks (implementiert — heuristisch)
- Brand Fit (Wortlänge, Verbotene Claims)
- Claim Risk: garantiert/spart €/heilt → HIGH RISK
- CTA Strength: Aktionsverben vorhanden?
- Platform Fit: TikTok/Reels/Shorts → high

## Schwellenwerte
- Score ≥ 90: accept
- Score 75–89: improve (Repair Agent)
- Score < 75: regenerate
- claimRisk HIGH: manual_review (nie auto-accept)

## Bild Quality Checks (TODO — Mock)
TODO: Vision-Modell für Bildanalyse anbinden
Geplante Prüfungen:
- Geschlecht entspricht Anforderung?
- Anzahl Personen korrekt?
- Hände/Finger korrekt (keine extra Finger)?
- Gesicht sauber?
- Kein Text-Artefakt im Bild?
- Kein verzerrtes Logo?
- Format korrekt?
- NSFW/Safety ok?

type VisualQAReport = {
  passed: boolean
  genderMatches?: boolean
  subjectCountMatches?: boolean
  anatomyOk?: boolean
  handsOk?: boolean
  faceOk?: boolean
  textOk?: boolean
  logoOk?: boolean
  formatOk?: boolean
  brandFit?: 'low' | 'medium' | 'high'
  issues: string[]
  repairPrompt?: string
}

## Quality Gate Loop
Generate → Evaluate → [failed] → Repair → Evaluate
Max 2-3 Versuche. Danach: Nutzerhinweis.

## Regel: Text/Logo nicht in Bild-KI
Bild-KI generiert NUR Motiv/Hintergrund/Person.
Text, Logo, CTA → nachträglich als Overlay.
Grund: Bild-KI verzerrt Text und Logos.

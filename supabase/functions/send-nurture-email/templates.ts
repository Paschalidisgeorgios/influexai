const SITE = "https://influexaicreator.com";

function layout(body: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111114;border-radius:12px;border:1px solid #222228;">
<tr><td style="padding:28px 32px 8px;text-align:center;">
  <span style="font-size:26px;font-weight:bold;letter-spacing:0.06em;color:#B4FF00;">Influex<span style="color:#e8e8e8;">AI</span></span>
</td></tr>
<tr><td style="padding:8px 32px 28px;color:#e8e8e8;font-size:15px;line-height:1.65;">
${body}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #222228;text-align:center;font-size:12px;color:#666;line-height:1.6;">
  <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">Abmelden</a><br/>
  InfluexAI · <a href="${SITE}" style="color:#888;text-decoration:none;">influexaicreator.com</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function cta(href: string, label: string): string {
  return `<p style="margin:28px 0 8px;text-align:center;">
<a href="${href}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#0a0a0a;font-weight:bold;font-size:15px;text-decoration:none;border-radius:8px;">${label}</a>
</p>`;
}

export function welcomeEmail(
  firstName: string,
  credits: number,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 16px;font-size:17px;color:#e8e8e8;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">willkommen bei <strong style="color:#B4FF00;">InfluexAI</strong> — dein KI Creator Studio für virale Shorts.</p>
<p style="margin:0 0 16px;">Du startest mit <strong style="color:#B4FF00;">${credits} Starter-Credits</strong>. Damit kannst du sofort loslegen.</p>
<p style="margin:0 0 12px;font-weight:bold;color:#B4FF00;">Die 3 besten Features zum Start:</p>
<ul style="margin:0 0 20px;padding-left:20px;color:#c8c8c8;">
  <li style="margin-bottom:8px;"><strong>Niche Analyzer</strong> — profitable Nischen finden</li>
  <li style="margin-bottom:8px;"><strong>Script Generator</strong> — virale Scripts in Minuten</li>
  <li style="margin-bottom:8px;"><strong>Outlier Detector</strong> — Videos finden, die 10× viral gingen</li>
</ul>
${cta(`${SITE}/dashboard`, "Jetzt erste Creation starten →")}
<p style="margin:24px 0 0;font-size:13px;color:#888;font-style:italic;">PS: Antwort auf diese Mail — ich lese alles persönlich.</p>`;
  return {
    subject: `🚀 Willkommen bei InfluexAI, ${firstName}!`,
    html: layout(body, unsubscribeUrl),
  };
}

export function activationEmail(
  firstName: string,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 16px;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">hast du schon deinen ersten Short erstellt?</p>
<p style="margin:0 0 16px;color:#c8c8c8;">Du hast noch keine Creation gemacht — hier ist der einfachste Start:</p>
<ol style="margin:0 0 20px;padding-left:20px;color:#e8e8e8;line-height:1.8;">
  <li><strong>Niche Analyzer</strong> — Nische wählen (2 Credits)</li>
  <li><strong>Script Generator</strong> — Script aus der Nische (2 Credits)</li>
  <li>Fertig — dein erstes virales Script steht</li>
</ol>
${cta(`${SITE}/dashboard/niche-analyzer`, "In 3 Minuten zum ersten Script →")}`;
  return {
    subject: "Hast du schon deinen ersten Short erstellt? ⚡",
    html: layout(body, unsubscribeUrl),
  };
}

export function featureDiscoveryEmail(
  firstName: string,
  remainingCredits: number,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 16px;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">das wissen die meisten InfluexAI User nicht 👀</p>
<p style="margin:0 0 16px;"><strong style="color:#B4FF00;">Outlier Detector</strong> ist unser stärkstes Feature — und wird oft übersehen.</p>
<p style="margin:0 0 16px;color:#c8c8c8;">Finde Videos, die <strong>10× viral</strong> gingen — und baue sie für deine Nische nach. Ein Klick, klare Hooks, direkt ins Video-Ad-Tool.</p>
<p style="margin:0 0 8px;">Du hast noch <strong style="color:#B4FF00;">${remainingCredits} Credits</strong> — perfekt für einen Outlier-Scan.</p>
${cta(`${SITE}/dashboard/outlier-detector`, "Outlier Detector ausprobieren →")}`;
  return {
    subject: "Das wissen die meisten InfluexAI User nicht 👀",
    html: layout(body, unsubscribeUrl),
  };
}

export function retentionEmail(
  firstName: string,
  generationCount: number,
  remainingCredits: number,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const createdLine =
    generationCount > 0
      ? `Du hast schon <strong style="color:#B4FF00;">${generationCount} Creation${generationCount === 1 ? "" : "s"}</strong> — stark! Dein Studio wartet auf den nächsten Hit.`
      : "Dein KI Creator Studio ist bereit — du musst nur noch starten.";
  const body = `
<p style="margin:0 0 16px;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">dein KI Creator Studio wartet auf dich.</p>
<p style="margin:0 0 16px;">Du hast <strong style="color:#B4FF00;">${remainingCredits} Credits</strong> übrig — lass sie nicht ungenutzt.</p>
<p style="margin:0 0 20px;color:#c8c8c8;">${createdLine}</p>
${cta(`${SITE}/dashboard`, "Weitermachen →")}`;
  return {
    subject: "Dein KI Creator Studio wartet auf dich",
    html: layout(body, unsubscribeUrl),
  };
}

export function upgradeEmail(
  firstName: string,
  remainingCredits: number,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 16px;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">Creator, die viral gehen, machen das täglich 🎯</p>
<p style="margin:0 0 16px;color:#c8c8c8;">Die erfolgreichsten Creator nutzen InfluexAI jeden Tag — Nischen, Scripts, Outliers, Ads. Konstante Output = konstantes Wachstum.</p>
<p style="margin:0 0 12px;">Du hast noch <strong>${remainingCredits} Credits</strong>. Mit einem Paket bist du für Wochen versorgt:</p>
<ul style="margin:0 0 20px;padding-left:20px;color:#c8c8c8;">
  <li style="margin-bottom:6px;">Starter — für regelmäßige Creator</li>
  <li style="margin-bottom:6px;">Creator — unser beliebtestes Paket</li>
  <li style="margin-bottom:6px;">Business — maximale Produktion</li>
</ul>
${cta(`${SITE}/dashboard/credits`, "Credits aufladen und durchstarten →")}`;
  return {
    subject: "Creator die viral gehen, machen das täglich 🎯",
    html: layout(body, unsubscribeUrl),
  };
}

export function winbackHighEmail(
  firstName: string,
  credits: number,
  newFeatureCount: number,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 16px;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">es ist eine Weile her — dein InfluexAI Studio wartet auf dich 👀</p>
<p style="margin:0 0 16px;color:#c8c8c8;">Seit deinem letzten Besuch haben wir <strong style="color:#B4FF00;">${newFeatureCount} neue Features</strong> gebaut:</p>
<ul style="margin:0 0 20px;padding-left:20px;color:#c8c8c8;line-height:1.7;">
  <li>Thumbnail Konzept Generator</li>
  <li>Outlier Detector Verbesserungen</li>
  <li>Script Generator Updates</li>
</ul>
${cta(`${SITE}/dashboard`, "Schau mal rein →")}
<p style="margin:20px 0 0;font-size:13px;color:#888;font-style:italic;">PS: Du hast noch <strong style="color:#B4FF00;">${credits} Credits</strong> — lass sie nicht verfallen.</p>`;
  return {
    subject: "Dein InfluexAI Studio wartet auf dich 👀",
    html: layout(body, unsubscribeUrl),
  };
}

export function winbackCriticalEmail(
  firstName: string,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 16px;font-size:17px;color:#e8e8e8;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">wir vermissen dich — deshalb habe ich dir <strong style="color:#B4FF00;">5 Bonus-Credits</strong> auf dein Konto gelegt. Kein Haken, einfach ein kleiner Anstoß damit du wieder reinkommst.</p>
<p style="margin:0 0 20px;color:#c8c8c8;">Dein Creator-Studio steht bereit. Ein Outlier-Scan oder ein frisches Script dauert nur wenige Minuten.</p>
${cta(`${SITE}/dashboard`, "Credits abholen und loslegen →")}
<p style="margin:24px 0 0;font-size:13px;color:#666;">— Das InfluexAI Team</p>`;
  return {
    subject: "5 Bonus-Credits — nur für dich 🎁",
    html: layout(body, unsubscribeUrl),
  };
}

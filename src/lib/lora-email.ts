import { SITE_URL } from "@/lib/beta";

async function sendResendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[lora-email] RESEND_API_KEY not set — skipped:", { to, subject });
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "InfluexAI <noreply@influexaicreator.com>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[lora-email]", res.status, await res.text());
    return false;
  }
  return true;
}

export async function sendLoraReadyEmail(
  to: string,
  modelName: string,
  triggerWord: string
): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard/lora-training`;
  const html = `<!DOCTYPE html>
<html lang="de"><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:520px;background:#111;border-radius:12px;border:1px solid rgba(180,255,0,0.2);">
<tr><td style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.65;">
<p style="margin:0 0 16px;">Dein LoRA-Modell <strong style="color:#B4FF00;">${modelName}</strong> ist fertig!</p>
<p style="margin:0 0 12px;">Trigger Word: <code style="color:#B4FF00;">${triggerWord}</code></p>
<p style="margin:0 0 20px;">Nutze es jetzt im Bild Generator, KI-Ich, Thumbnails oder Produkt-Werbung.</p>
<p style="text-align:center;margin:24px 0;">
<a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">LoRA öffnen →</a>
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  return sendResendEmail(to, `✅ Dein LoRA „${modelName}" ist bereit`, html);
}

export async function sendLoraFailedEmail(
  to: string,
  modelName: string
): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard/lora-training`;
  const html = `<!DOCTYPE html>
<html lang="de"><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:520px;background:#111;border-radius:12px;border:1px solid rgba(239,68,68,0.25);">
<tr><td style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.65;">
<p style="margin:0 0 16px;">Das Training für <strong>${modelName}</strong> ist fehlgeschlagen.</p>
<p style="margin:0 0 16px;">Deine Credits wurden zurückerstattet. Bitte prüfe deine Trainingsbilder (min. 10, klare Motive, gute Qualität) und versuche es erneut.</p>
<p style="text-align:center;margin:24px 0;">
<a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">Erneut versuchen →</a>
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  return sendResendEmail(to, `LoRA Training fehlgeschlagen — ${modelName}`, html);
}

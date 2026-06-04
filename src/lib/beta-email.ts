import { SITE_URL } from "@/lib/beta";

export async function sendBetaWelcomeEmail(
  to: string,
  code: string,
  firstName: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const signupUrl = `${SITE_URL}/signup?beta=${encodeURIComponent(code)}`;

  if (!apiKey) {
    console.log("[beta-email] RESEND_API_KEY not set — skipped:", { to, code });
    return false;
  }

  const html = `<!DOCTYPE html>
<html lang="de"><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:520px;background:#111;border-radius:12px;border:1px solid rgba(180,255,0,0.2);">
<tr><td style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.65;">
<p style="margin:0 0 16px;">Hey ${firstName},</p>
<p style="margin:0 0 16px;">du hast einen der <strong style="color:#B4FF00;">100 Beta-Plätze</strong> bei InfluexAI gesichert.</p>
<p style="margin:0 0 12px;font-weight:bold;color:#B4FF00;">Dein Beta-Code:</p>
<p style="margin:0 0 20px;font-size:22px;font-weight:bold;letter-spacing:0.08em;color:#B4FF00;">${code}</p>
<p style="margin:0 0 16px;">Damit bekommst du:</p>
<ul style="margin:0 0 20px;padding-left:20px;color:#c8c8c8;">
<li>50 Gratis-Credits (statt 10)</li>
<li>Lifetime 30% Rabatt auf Credit-Pakete</li>
<li>Beta Creator Badge — forever</li>
</ul>
<p style="text-align:center;margin:24px 0;">
<a href="${signupUrl}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">Account erstellen →</a>
</p>
<p style="margin:0;font-size:13px;color:#666;">Link: ${signupUrl}</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "InfluexAI <noreply@influexaicreator.com>",
      to: [to],
      subject: `🎉 Dein InfluexAI Beta-Code: ${code}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[beta-email]", await res.text());
    return false;
  }
  return true;
}

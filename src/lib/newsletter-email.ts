import { SEO_BASE_URL } from "@/lib/seo";

const FROM = "InfluexAI <noreply@influexaicreator.com>";

async function sendResend(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[newsletter-email] RESEND_API_KEY not set — skipped:", to);
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    console.error("[newsletter-email]", await res.text());
    return false;
  }
  return true;
}

export async function sendNewsletterConfirmEmail(
  to: string,
  token: string
): Promise<boolean> {
  const confirmUrl = `${SEO_BASE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

  const html = `<!DOCTYPE html><html lang="de"><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%"><tr><td align="center" style="padding:32px 16px;">
<table style="max-width:520px;background:#111;border-radius:12px;border:1px solid rgba(180,255,0,0.2);">
<tr><td style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.65;">
<p style="margin:0 0 16px;">Fast geschafft — bestätige deine Anmeldung:</p>
<p style="text-align:center;margin:24px 0;">
<a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">Newsletter bestätigen →</a>
</p>
<p style="margin:0;font-size:13px;color:#666;">Falls du dich nicht angemeldet hast, ignoriere diese E-Mail.</p>
</td></tr></table></td></tr></table></body></html>`;

  return sendResend(to, "Bitte bestätige deine InfluexAI Creator Tips", html);
}

export async function sendNewsletterWelcomeEmail(to: string): Promise<boolean> {
  const signupUrl = `${SEO_BASE_URL}/signup?source=newsletter`;

  const html = `<!DOCTYPE html><html lang="de"><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%"><tr><td align="center" style="padding:32px 16px;">
<table style="max-width:520px;background:#111;border-radius:12px;border:1px solid rgba(180,255,0,0.2);">
<tr><td style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.65;">
<p style="margin:0 0 16px;">Willkommen bei den wöchentlichen Creator Tips von InfluexAI.</p>
<p style="margin:0 0 16px;font-weight:bold;color:#B4FF00;">Dein Bonus: 3 Script-Templates</p>
<ol style="margin:0 0 20px;padding-left:20px;color:#c8c8c8;">
<li><strong>Curiosity Hook:</strong> „Die meisten machen X falsch — so geht es richtig.“</li>
<li><strong>List Hook:</strong> „3 Dinge die [Zielgruppe] sofort ändern sollte.“</li>
<li><strong>Story Hook:</strong> „Ich habe [Ergebnis] erreicht — ohne [Erwartung].“</li>
</ol>
<p style="margin:0 0 16px;">Kopiere ein Template, passe Nische und CTA an, und generiere Varianten im Script Generator.</p>
<p style="text-align:center;margin:24px 0;">
<a href="${signupUrl}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">InfluexAI testen →</a>
</p>
</td></tr></table></td></tr></table></body></html>`;

  return sendResend(to, "Willkommen + 3 Script-Templates (InfluexAI)", html);
}

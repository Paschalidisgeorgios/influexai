import type { DailyVideoIdea } from "./types.ts";

const SITE = "https://influexaicreator.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ideaCard(idea: DailyVideoIdea, index: number): string {
  const topic = encodeURIComponent(idea.title.trim());
  const scriptUrl = `${SITE}/dashboard/script-generator?topic=${topic}`;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr><td style="background:#18181d;border:1px solid rgba(180,255,0,0.2);border-radius:12px;padding:20px;">
      <p style="margin:0 0 8px;font-size:12px;color:#B4FF00;font-weight:bold;">IDEE ${index + 1}</p>
      <h3 style="margin:0 0 10px;color:#F0EFE8;font-size:17px;">${escapeHtml(idea.title)}</h3>
      <p style="margin:0 0 8px;color:#c8c8c8;font-size:14px;"><strong style="color:#B4FF00;">Hook:</strong> ${escapeHtml(idea.hook)}</p>
      <p style="margin:0 0 8px;color:#888;font-size:13px;line-height:1.5;">${escapeHtml(idea.outline)}</p>
      <p style="margin:0 0 14px;color:#666;font-size:12px;font-style:italic;">${escapeHtml(idea.why_viral)}</p>
      <a href="${scriptUrl}" style="display:inline-block;padding:10px 18px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;font-size:13px;">Script generieren →</a>
    </td></tr>
  </table>`;
}

export function buildDailySuggestionsEmailHtml(
  firstName: string,
  niche: string,
  ideas: DailyVideoIdea[],
  unsubscribeUrl: string,
  credits = 0
): string {
  const cards = ideas.map((idea, i) => ideaCard(idea, i)).join("");
  const dashboardUrl = `${SITE}/dashboard`;

  return `<!DOCTYPE html>
<html lang="de"><body style="margin:0;background:#060608;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:560px;background:#111;border-radius:12px;border:1px solid rgba(180,255,0,0.15);">
<tr><td style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.65;">
<p style="margin:0 0 8px;color:#B4FF00;font-weight:bold;font-size:13px;letter-spacing:0.06em;">CREATOR GROWTH AGENT</p>
<p style="margin:0 0 16px;">Hey ${escapeHtml(firstName)},</p>
<p style="margin:0 0 20px;">dein Tagesplan für <strong style="color:#B4FF00;">${escapeHtml(niche)}</strong> — 3 Video-Ideen basierend auf aktuellen YouTube-Trends:</p>
${cards}
<p style="text-align:center;margin:24px 0;">
<a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">Dashboard öffnen →</a>
</p>
<p style="margin:16px 0 0;font-size:13px;color:#888;text-align:center;">
Dein Credit-Guthaben: <strong style="color:#B4FF00;">${credits}</strong> Credits
</p>
<p style="margin:12px 0 0;font-size:12px;color:#505055;text-align:center;">
<a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline;">Tägliche Ideen-Emails abbestellen</a>
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

export async function sendDailySuggestionsEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log("[growth-agent] RESEND_API_KEY not set — email skipped:", to);
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
    console.error("[growth-agent] Resend:", await res.text());
    return false;
  }
  return true;
}

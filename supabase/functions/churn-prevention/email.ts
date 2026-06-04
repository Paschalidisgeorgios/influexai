import type { ChurnEmailType, Day3Idea, Day7Trends } from "./types.ts";

const SITE = "https://influexaicreator.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(body: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de"><body style="margin:0;background:#060608;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:560px;background:#111;border-radius:12px;border:1px solid rgba(180,255,0,0.15);">
<tr><td style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.65;">
${body}
<p style="margin:28px 0 0;font-size:12px;color:#505055;text-align:center;">
<a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline;">E-Mails abbestellen</a>
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

function ideaBox(idea: Day3Idea): string {
  return `<div style="margin:20px 0;padding:22px;background:#18181d;border:2px solid rgba(180,255,0,0.35);border-radius:12px;">
<p style="margin:0 0 10px;font-size:20px;font-weight:800;color:#B4FF00;line-height:1.35;">${escapeHtml(idea.title)}</p>
<p style="margin:0;color:#F0EFE8;font-size:15px;line-height:1.5;">${escapeHtml(idea.hook)}</p>
</div>`;
}

function scriptCta(topic: string): string {
  const url = `${SITE}/dashboard/script-generator?topic=${encodeURIComponent(topic)}`;
  return `<p style="text-align:center;margin:24px 0;">
<a href="${url}" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">Jetzt Script generieren →</a>
</p>`;
}

export function buildChurnEmail(
  type: ChurnEmailType,
  name: string,
  credits: number,
  niche: string,
  unsubscribeUrl: string,
  idea?: Day3Idea,
  trends?: Day7Trends
): { subject: string; html: string } {
  const ps = `<p style="margin:20px 0 0;font-size:13px;color:#888;font-style:italic;">P.S.: Du hast noch <strong style="color:#B4FF00;">${credits}</strong> Credits.</p>`;

  if (type === "day3" && idea) {
    const body = `
<p style="margin:0 0 16px;">Hey ${escapeHtml(name)}, hier ist deine nächste Video-Idee:</p>
${ideaBox(idea)}
${scriptCta(idea.title)}
${ps}`;
    return {
      subject: "Wir haben eine Video-Idee für dich 💡",
      html: layout(body, unsubscribeUrl),
    };
  }

  if (type === "day7" && trends) {
    const list = trends.trends
      .map(
        (t, i) =>
          `<li style="margin-bottom:10px;color:#c8c8c8;"><strong style="color:#B4FF00;">${i + 1}.</strong> ${escapeHtml(t)}</li>`
      )
      .join("");
    const body = `
<p style="margin:0 0 16px;">Hey ${escapeHtml(name)},</p>
<p style="margin:0 0 16px;">hier sind <strong style="color:#B4FF00;">3 Trends</strong> in deiner Nische <em>${escapeHtml(niche)}</em>, die gerade performen:</p>
<ul style="margin:0 0 20px;padding-left:20px;">${list}</ul>
${scriptCta(trends.trends[0] ?? niche)}
${ps}`;
    return {
      subject: `3 Trends in deiner Nische: ${niche}`,
      html: layout(body, unsubscribeUrl),
    };
  }

  const body = `
<p style="margin:0 0 16px;">Hey ${escapeHtml(name)},</p>
<p style="margin:0 0 16px;">wir vermissen dich bei InfluexAI — deshalb schenken wir dir <strong style="color:#B4FF00;">10 Bonus-Credits</strong>, damit du direkt wieder loslegen kannst.</p>
<p style="margin:0 0 16px;color:#c8c8c8;">Die Credits wurden deinem Account gutgeschrieben.</p>
<p style="text-align:center;margin:24px 0;">
<a href="${SITE}/dashboard" style="display:inline-block;padding:14px 28px;background:#B4FF00;color:#060608;font-weight:bold;text-decoration:none;border-radius:8px;">Zurück zum Dashboard →</a>
</p>
${ps}`;
  return {
    subject: "10 Bonus Credits für dich 🎁",
    html: layout(body, unsubscribeUrl),
  };
}

export async function sendChurnEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log("[churn-prevention] RESEND_API_KEY not set — skipped:", to);
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
    console.error("[churn-prevention] Resend:", await res.text());
    return false;
  }
  return true;
}

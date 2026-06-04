import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nurtureUnsubscribeToken } from "@/lib/nurture-unsubscribe";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function unsubscribedPage(message: string, ok: boolean) {
  const color = ok ? "#B4FF00" : "#ff6b7a";
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Abmeldung – InfluexAI</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#060608;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:420px;padding:40px 32px;text-align:center;">
    <p style="font-size:22px;font-weight:bold;color:#B4FF00;margin:0 0 16px;">InfluexAI</p>
    <p style="font-size:16px;color:${color};line-height:1.6;margin:0 0 24px;">${message}</p>
    <a href="https://influexaicreator.com/dashboard" style="color:#888;font-size:14px;text-decoration:underline;">Zurück zum Dashboard</a>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");
  const token = request.nextUrl.searchParams.get("token");

  if (!uid || !token) {
    return unsubscribedPage("Ungültiger Abmelde-Link.", false);
  }

  const expected = nurtureUnsubscribeToken(uid);
  if (token !== expected) {
    return unsubscribedPage("Ungültiger Abmelde-Link.", false);
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ nurture_unsubscribed: true })
    .eq("id", uid);

  if (error) {
    console.error("[unsubscribe]", error.message);
    return unsubscribedPage(
      "Abmeldung fehlgeschlagen. Bitte später erneut versuchen.",
      false
    );
  }

  return unsubscribedPage("Du wurdest abgemeldet.", true);
}

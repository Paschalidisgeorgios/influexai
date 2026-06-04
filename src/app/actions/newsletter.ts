"use server";

import { randomBytes } from "node:crypto";
import {
  sendNewsletterConfirmEmail,
  sendNewsletterWelcomeEmail,
} from "@/lib/newsletter-email";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeNewsletter(
  email: string,
  source: string
): Promise<{ ok: boolean; message: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, message: "Bitte gib eine gültige E-Mail ein." };
  }

  const supabase = createServiceSupabaseClient();
  const token = randomBytes(24).toString("hex");

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, confirmed")
    .eq("email", trimmed)
    .maybeSingle();

  if (existing?.confirmed) {
    return { ok: true, message: "Du bist bereits angemeldet." };
  }

  if (existing) {
    await supabase
      .from("newsletter_subscribers")
      .update({ confirm_token: token, source })
      .eq("id", existing.id);
  } else {
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: trimmed,
      source,
      confirm_token: token,
      confirmed: false,
    });
    if (error) {
      console.error("newsletter insert:", error);
      return { ok: false, message: "Anmeldung fehlgeschlagen." };
    }
  }

  await sendNewsletterConfirmEmail(trimmed, token);

  return {
    ok: true,
    message:
      "Bitte bestätige deine E-Mail — wir haben dir einen Link geschickt.",
  };
}

export async function confirmNewsletterByToken(
  token: string
): Promise<{ ok: boolean }> {
  if (!token) return { ok: false };

  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, confirmed")
    .eq("confirm_token", token)
    .maybeSingle();

  if (!data) return { ok: false };

  if (!data.confirmed) {
    await supabase
      .from("newsletter_subscribers")
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirm_token: null,
      })
      .eq("id", data.id);

    await sendNewsletterWelcomeEmail(data.email);
  }

  return { ok: true };
}

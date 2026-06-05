import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { applyBetaOnSignup } from "@/app/actions/beta";
import {
  confirmReferralRewards,
  registerReferralOnSignup,
} from "@/app/actions/referral";
import { invokeWelcomeNurtureEmail } from "@/lib/nurture-email";
import { REFERRAL_REF_COOKIE } from "@/lib/referral-ref-cookie";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const referredBy = user.user_metadata?.referred_by as
          | string
          | undefined;
        const refFromCookie = cookieStore.get(REFERRAL_REF_COOKIE)?.value?.trim();
        const ref = referredBy?.trim() || refFromCookie;
        if (ref) {
          await registerReferralOnSignup(user.id, ref);
        }
        await confirmReferralRewards(user.id);
        const betaCode = user.user_metadata?.beta_code as string | undefined;
        if (betaCode) {
          await applyBetaOnSignup(user.id, betaCode);
        }
        void invokeWelcomeNurtureEmail(user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}

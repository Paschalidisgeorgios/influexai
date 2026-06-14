import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { confirmBetaSignup } from "@/app/actions/beta";
import {
  confirmReferralRewards,
  recordReferralIntent,
} from "@/app/actions/referral";
import { invokeWelcomeNurtureEmail } from "@/lib/nurture-email";
import { REFERRAL_REF_COOKIE } from "@/lib/referral-ref-cookie";
import {
  logAuthRedirect,
  resolvePostAuthRedirect,
} from "@/lib/auth-redirect.server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

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
          await recordReferralIntent(user.id, ref);
        }
        await confirmReferralRewards(user.id);

        const betaCode = user.user_metadata?.beta_code as string | undefined;
        if (betaCode) {
          await confirmBetaSignup(user.id, betaCode);
        }
        void invokeWelcomeNurtureEmail(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, role, plan")
          .eq("id", user.id)
          .single();

        const target = await resolvePostAuthRedirect(
          {
            email: user.email,
            is_admin: profile?.is_admin,
            role: profile?.role,
            plan: profile?.plan,
            id: user.id,
          },
          nextParam
        );

        logAuthRedirect({
          userId: user.id,
          role: profile?.role,
          target,
          source: "auth_callback",
        });

        return NextResponse.redirect(`${origin}${target}`);
      }
    }
  }
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_error`);
}

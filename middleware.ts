import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { shouldRequireOnboarding } from "@/lib/onboarding";
import {
  isMainHost,
  subdomainFromHost,
  parseHostname,
  resolveTenantFromHost,
  isTenantAccessible,
} from "@/lib/tenant";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { isValidLocale, resolveLocaleFromRequest } from "@/lib/locale";

const handleIntl = createIntlMiddleware(routing);

async function getOnboardingState(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, created_at")
    .eq("id", userId)
    .single();

  if (!profile) return { needsOnboarding: false };

  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const needsOnboarding = shouldRequireOnboarding(
    {
      onboarding_completed: profile.onboarding_completed ?? false,
      created_at: profile.created_at,
    },
    count ?? 0
  );

  return { needsOnboarding };
}

export async function middleware(request: NextRequest) {
  const langParam = request.nextUrl.searchParams.get("lang");

  const intlResponse = handleIntl(request);
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    if (isValidLocale(langParam)) {
      intlResponse.cookies.set("locale", langParam, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
      });
    }
    return intlResponse;
  }

  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") ?? "";
  let abVariant: "a" | "b" | null = null;

  const requestHeaders = new Headers(request.headers);
  if (isValidLocale(langParam)) {
    requestHeaders.set("x-url-lang", langParam);
  }
  requestHeaders.set("x-tenant-host", hostname);

  const subdomain = subdomainFromHost(hostname);
  if (subdomain) {
    requestHeaders.set("x-tenant-slug", subdomain);
  } else if (!isMainHost(hostname)) {
    requestHeaders.set("x-tenant-custom-domain", parseHostname(hostname));
  }
  if (pathname === "/") {
    const existing = request.cookies.get("ab_variant")?.value;
    abVariant =
      existing === "a" || existing === "b"
        ? existing
        : Math.random() > 0.5
          ? "b"
          : "a";
    requestHeaders.set("x-ab-variant", abVariant);
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOnboarding =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user && isOnboarding) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isTenantHost =
    Boolean(subdomain) || (!isMainHost(hostname) && !subdomain);
  if (user && isTenantHost && isDashboard) {
    const tenant = await resolveTenantFromHost(hostname);
    if (!tenant) {
      return NextResponse.redirect(
        new URL("/white-label?expired=1", request.url)
      );
    }
    if (!isTenantAccessible(tenant)) {
      try {
        const service = createServiceSupabaseClient();
        const { data: profile } = await service
          .from("profiles")
          .select("tenant_id, tenant_role")
          .eq("id", user.id)
          .single();
        const isOwner =
          profile?.tenant_id === tenant.id &&
          (profile?.tenant_role === "owner" || tenant.owner_id === user.id);
        if (!isOwner && profile?.tenant_id === tenant.id) {
          return NextResponse.redirect(
            new URL("/login?tenant_expired=1", request.url)
          );
        }
      } catch {
        /* allow through on lookup failure */
      }
    }
  }

  if (user) {
    let needsOnboarding = false;
    if (isDashboard || isOnboarding || isAuthPage) {
      try {
        const state = await getOnboardingState(supabase, user.id);
        needsOnboarding = state.needsOnboarding;
      } catch {
        needsOnboarding = false;
      }
    }

    if (isAuthPage) {
      const dest = needsOnboarding ? "/onboarding" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (needsOnboarding && isDashboard) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (!needsOnboarding && isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/" && abVariant) {
    supabaseResponse.cookies.set("ab_variant", abVariant, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    supabaseResponse.headers.set("x-ab-variant", abVariant);
  }

  const localeFromQuery = isValidLocale(langParam) ? langParam : null;
  const existingLocale = request.cookies.get("locale")?.value;

  if (localeFromQuery) {
    supabaseResponse.cookies.set("locale", localeFromQuery, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  } else if (!existingLocale) {
    const locale = resolveLocaleFromRequest(
      undefined,
      request.headers.get("accept-language")
    );
    supabaseResponse.cookies.set("locale", locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  intlResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "x-middleware-override") return;
    supabaseResponse.headers.set(key, value);
  });
  intlResponse.cookies.getAll().forEach((c) => {
    supabaseResponse.cookies.set(c.name, c.value);
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

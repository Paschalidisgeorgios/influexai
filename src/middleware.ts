import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isMainHost,
  subdomainFromHost,
  parseHostname,
  resolveTenantFromHost,
  isTenantAccessible,
} from "@/lib/tenant";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isValidLocale, locales, resolveLocaleFromRequest } from "@/lib/locale";
import {
  REFERRAL_REF_COOKIE,
  REFERRAL_REF_MAX_AGE,
} from "@/lib/referral-ref-cookie";
import { getRouteGate, isRouteAllowed } from "@/lib/plan-gating";

export async function middleware(request: NextRequest) {
  const langParam = request.nextUrl.searchParams.get("lang");
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // Locale is resolved in i18n.ts (no [locale] segment). Do not use
  // next-intl middleware here — it rewrites "/" to "/de" and breaks routes on Vercel.
  for (const locale of locales) {
    if (pathname === `/${locale}`) {
      return NextResponse.redirect(new URL("/" + search, request.url));
    }
    if (pathname.startsWith(`/${locale}/`)) {
      const stripped = pathname.slice(locale.length + 1) || "/";
      return NextResponse.redirect(new URL(stripped + search, request.url));
    }
  }

  // Legacy auth URLs → canonical /auth/sign-in|sign-up
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/auth/sign-in" + search, request.url));
  }
  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/auth/sign-up" + search, request.url));
  }
  if (pathname === "/auth" && search === "") {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Legacy /white-label → public agency landing (logged-in users → dashboard WL)
  if (pathname === "/white-label" || pathname.startsWith("/white-label/")) {
    if (pathname !== "/white-label") {
      const target = `/dashboard${pathname.slice("/white-label".length)}${search}`;
      return NextResponse.redirect(new URL(target, request.url));
    }
    // /white-label alone: resolved after auth check below (see whiteLabelRedirect)
  }

  const whiteLabelLegacyPath = pathname === "/white-label";

  const hostname = request.headers.get("host") ?? "";
  let abVariant: "a" | "b" | null = null;

  const requestHeaders = new Headers(request.headers);
  if (isValidLocale(langParam)) {
    requestHeaders.set("x-url-lang", langParam);
  }
  requestHeaders.set("x-tenant-host", hostname);

  // Platform "/" is always the marketing landing (src/app/page.tsx)
  if (pathname === "/" && isMainHost(hostname)) {
    requestHeaders.set("x-platform-landing", "1");
  }

  const subdomain = subdomainFromHost(hostname);
  if (subdomain) {
    requestHeaders.set("x-tenant-slug", subdomain);
  } else if (!isMainHost(hostname)) {
    requestHeaders.set("x-tenant-custom-domain", parseHostname(hostname));
  }

  const isPlatformHost = isMainHost(hostname);
  const isTenantHost =
    Boolean(subdomain) || (!isPlatformHost && !subdomain);

  if (pathname === "/" && isPlatformHost) {
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
  const isAuthPage =
    pathname === "/auth" ||
    pathname === "/auth/sign-in" ||
    pathname === "/auth/sign-up" ||
    pathname === "/login" ||
    pathname === "/signup";

  // Tenant subdomain/custom domain: landing is not the main marketing site
  if (isTenantHost && pathname === "/" && !user) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  if (!user && isDashboard) {
    const redirectParam = encodeURIComponent(pathname + search);
    return NextResponse.redirect(
      new URL(`/auth/sign-in?redirect=${redirectParam}`, request.url)
    );
  }

  if (!user && isOnboarding) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  if (user && isTenantHost && isDashboard) {
    const tenant = await resolveTenantFromHost(hostname);
    if (!tenant) {
      return NextResponse.redirect(
        new URL("/dashboard/white-label?expired=1", request.url)
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
            new URL("/auth/sign-in?tenant_expired=1", request.url)
          );
        }
      } catch {
        /* allow through on lookup failure */
      }
    }
  }

  if (user && (isAuthPage || isOnboarding)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Legacy /white-label → agency marketing (guests) or dashboard (logged in)
  if (whiteLabelLegacyPath) {
    const target = user ? `/dashboard/white-label${search}` : `/agency${search}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (user && isDashboard) {
    const gate = getRouteGate(pathname);
    if (gate) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, role, is_admin")
        .eq("id", user.id)
        .single();
      if (!isRouteAllowed(pathname, profile ?? { plan: "free" })) {
        requestHeaders.set("x-plan-upgrade-required", gate.minPlan);
      }
    }
  }

  const refParam = request.nextUrl.searchParams.get("ref")?.trim();
  if (refParam) {
    supabaseResponse.cookies.set(REFERRAL_REF_COOKIE, refParam, {
      maxAge: REFERRAL_REF_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }

  if (pathname === "/" && abVariant && isPlatformHost) {
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

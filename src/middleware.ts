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

export async function middleware(request: NextRequest) {
  const langParam = request.nextUrl.searchParams.get("lang");
  const pathname = request.nextUrl.pathname;

  // Locale is resolved in i18n.ts (no [locale] segment). Do not use
  // next-intl middleware here — it rewrites "/" to "/de" and breaks routes on Vercel.
  for (const locale of locales) {
    if (pathname === `/${locale}`) {
      return NextResponse.redirect(
        new URL("/" + request.nextUrl.search, request.url)
      );
    }
    if (pathname.startsWith(`/${locale}/`)) {
      const stripped = pathname.slice(locale.length + 1) || "/";
      return NextResponse.redirect(
        new URL(stripped + request.nextUrl.search, request.url)
      );
    }
  }
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
    if (isAuthPage || isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const refParam = request.nextUrl.searchParams.get("ref")?.trim();
  if (refParam) {
    supabaseResponse.cookies.set(REFERRAL_REF_COOKIE, refParam, {
      maxAge: REFERRAL_REF_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

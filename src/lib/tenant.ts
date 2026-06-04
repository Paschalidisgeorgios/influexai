import { headers } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { AgencyPlanId } from "@/lib/agency-plans";

export const TENANT_GRACE_DAYS = 7;

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  plan: AgencyPlanId;
  max_seats: number;
  credits_pool: number;
  is_active: boolean;
  deactivated_at: string | null;
  owner_id: string;
  stripe_subscription_id: string | null;
};

export function tenantInGracePeriod(tenant: Tenant): boolean {
  if (tenant.is_active) return false;
  if (!tenant.deactivated_at) return false;
  const end = new Date(tenant.deactivated_at);
  end.setDate(end.getDate() + TENANT_GRACE_DAYS);
  return end > new Date();
}

export function isTenantAccessible(tenant: Tenant): boolean {
  return tenant.is_active || tenantInGracePeriod(tenant);
}

export type TenantBranding = {
  appName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  plan: AgencyPlanId;
  showPoweredBy: boolean;
  slug: string;
};

export const MAIN_HOSTS = new Set([
  "influexaicreator.com",
  "www.influexaicreator.com",
  "influexai.vercel.app",
  "localhost",
  "127.0.0.1",
]);

/** Vercel preview/production aliases — must not be treated as agency custom domains. */
function isVercelPlatformHost(host: string): boolean {
  return (
    host.endsWith(".vercel.app") ||
    host === "vercel.app" ||
    host.endsWith(".vercel.sh")
  );
}

export function parseHostname(host: string): string {
  return (host.split(":")[0] ?? host).toLowerCase();
}

export function subdomainFromHost(hostname: string): string | null {
  const host = parseHostname(hostname);
  if (MAIN_HOSTS.has(host)) return null;
  if (host.endsWith(".localhost")) {
    const sub = host.replace(".localhost", "");
    return sub && sub !== "www" ? sub : null;
  }
  if (host.endsWith(".influexaicreator.com")) {
    const sub = host.replace(".influexaicreator.com", "");
    if (!sub || sub === "www") return null;
    return sub;
  }
  return null;
}

export function isMainHost(hostname: string): boolean {
  const host = parseHostname(hostname);
  if (MAIN_HOSTS.has(host)) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (isVercelPlatformHost(host)) return true;
  return false;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();
    if (data && !isTenantAccessible(data as Tenant)) return null;
    return (data as Tenant) ?? null;
  } catch {
    return null;
  }
}

export async function getTenantByCustomDomain(
  domain: string
): Promise<Tenant | null> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("custom_domain", domain.toLowerCase())
      .maybeSingle();
    if (data && !isTenantAccessible(data as Tenant)) return null;
    return (data as Tenant) ?? null;
  } catch {
    return null;
  }
}

export async function resolveTenantFromHost(
  hostname: string
): Promise<Tenant | null> {
  const sub = subdomainFromHost(hostname);
  if (sub) return getTenantBySlug(sub);
  if (!isMainHost(hostname)) {
    return getTenantByCustomDomain(parseHostname(hostname));
  }
  return null;
}

export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";

  // Marketing site on platform domains — never apply agency tenant on "/".
  if (isMainHost(host)) return null;

  const slug = h.get("x-tenant-slug");
  if (slug) return getTenantBySlug(slug);

  const customDomain = h.get("x-tenant-custom-domain");
  if (customDomain && !isMainHost(customDomain)) {
    const byDomain = await getTenantByCustomDomain(customDomain);
    if (byDomain) return byDomain;
  }

  return resolveTenantFromHost(host);
}

export function tenantToBranding(tenant: Tenant | null): TenantBranding {
  if (!tenant) {
    return {
      appName: "InfluexAI",
      logoUrl: null,
      primaryColor: "#B4FF00",
      secondaryColor: "#060608",
      plan: "starter",
      showPoweredBy: false,
      slug: "",
    };
  }
  return {
    appName: tenant.name,
    logoUrl: tenant.logo_url,
    primaryColor: tenant.primary_color,
    secondaryColor: tenant.secondary_color,
    plan: tenant.plan,
    showPoweredBy: tenant.plan !== "enterprise",
    slug: tenant.slug,
  };
}

export function tenantCssVariables(tenant: Tenant | null): string {
  const b = tenantToBranding(tenant);
  return `
:root {
  --accent: ${b.primaryColor};
  --background: ${b.secondaryColor};
  --acid: ${b.primaryColor};
  --bg: ${b.secondaryColor};
  --app-name: "${b.appName.replace(/"/g, '\\"')}";
}
`;
}

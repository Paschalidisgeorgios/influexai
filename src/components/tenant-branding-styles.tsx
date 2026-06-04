import { tenantCssVariables, type Tenant } from "@/lib/tenant";

export function TenantBrandingStyles({ tenant }: { tenant: Tenant | null }) {
  const css = tenantCssVariables(tenant);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

import fs from "fs";
import path from "path";

const pages = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/dashboard/layout.tsx",
  "src/app/dashboard/viral-hook/page.tsx",
  "src/app/dashboard/content-kalender/page.tsx",
  "src/app/dashboard/trend-script/page.tsx",
  "src/app/dashboard/produkt-werbung/page.tsx",
  "src/app/dashboard/ki-ich/page.tsx",
  "src/app/dashboard/bild-generator/page.tsx",
  "src/app/dashboard/gallery/page.tsx",
  "src/app/dashboard/thumbnail/page.tsx",
  "src/app/dashboard/lora/page.tsx",
  "src/app/dashboard/ki-agent/page.tsx",
  "src/app/dashboard/campaign-autopilot/page.tsx",
  "src/app/dashboard/stimme-musik/page.tsx",
  "src/app/dashboard/live-creator/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/(marketing)/preise/page.tsx",
  "src/app/(marketing)/business/page.tsx",
  "src/app/(marketing)/impressum/page.tsx",
  "src/app/(marketing)/datenschutz/page.tsx",
  "src/app/(marketing)/agb/page.tsx",
  "src/app/(marketing)/widerruf/page.tsx",
  "src/app/(marketing)/faq/page.tsx",
  "src/app/auth/sign-in/page.tsx",
  "src/app/auth/sign-up/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/impressum/page.tsx",
  "src/app/datenschutz/page.tsx",
  "src/app/agb/page.tsx",
  "src/app/dashboard/trend-to-script/page.tsx",
  "src/app/dashboard/produkt/page.tsx",
  "src/app/dashboard/image-generator/page.tsx",
  "src/app/dashboard/thumbnail-concept/page.tsx",
  "src/app/dashboard/lora-training/page.tsx",
];

for (const p of pages) {
  if (!fs.existsSync(p)) {
    console.log(JSON.stringify({ p, exists: false }));
    continue;
  }
  const c = fs.readFileSync(p, "utf8");
  const dir = path.dirname(p);
  const hasDefault = /export default/.test(c);
  const hasMeta = /export const metadata|export async function generateMetadata/.test(c);
  const hasLoading = fs.existsSync(path.join(dir, "loading.tsx"));
  const hasError = fs.existsSync(path.join(dir, "error.tsx"));
  const isClient = /^["']use client["']/.test(c.trim());
  const hasSkeleton = /Skeleton|animate-pulse|tool-output-skeletons|ImageGenerationLoading/.test(c);
  const consoleLogs = (c.match(/console\.log\(/g) || []).length;
  const hasMobile = /sm:|md:|lg:|max-w-|min-h-\[44/.test(c);
  const hydrationRisk =
    /(window\.|document\.|localStorage)/.test(c) && !/typeof window/.test(c);
  const hasEmpty = /empty|Keine|Noch keine|no results/i.test(c);
  const hasErrorUI = /error|Error|catch|setError|isError/.test(c);
  console.log(
    JSON.stringify({
      p,
      exists: true,
      hasDefault,
      hasMeta,
      hasLoading,
      hasError,
      isClient,
      hasSkeleton,
      consoleLogs,
      hasMobile,
      hydrationRisk,
      hasEmpty,
      hasErrorUI,
    })
  );
}

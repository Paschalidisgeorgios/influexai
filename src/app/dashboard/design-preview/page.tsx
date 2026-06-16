/**
 * /dashboard/design-preview — isolated design preview (not production dashboard).
 * Mock data only. Use /dashboard for the real Studio cockpit.
 */

import { Plus_Jakarta_Sans } from "next/font/google";
import { PreviewShell } from "@/components/dashboard/design-preview/PreviewShell";

const plusJakarta = Plus_Jakarta_Sans({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700", "800"],
  variable: "--font-preview-headline",
  display:  "swap",
});

export default function DesignPreviewPage() {
  return (
    <div className={plusJakarta.variable}>
      <PreviewShell />
    </div>
  );
}

/**
 * /dashboard/design-preview — InfluexAI Creator Production OS
 * Design Preview · Clean-room rebuild
 *
 * Loads Plus Jakarta Sans (isolated to this route via CSS variable).
 * Does NOT affect any other page or the production dashboard.
 * ALL DATA IS MOCK. No API calls, no credits, no assets.
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

/**
 * /dashboard/design-preview — InfluexAI Editorial Luxury AI Production Studio
 *
 * Loads Plus Jakarta Sans from Google Fonts via next/font (isolated to this
 * route — does NOT affect any other page).  Requires authentication (inherits
 * dashboard auth check).
 *
 * ALL DATA IS MOCK. No API calls. No credit deductions. No asset writes.
 * Does NOT replace the production dashboard.
 */

import { Plus_Jakarta_Sans } from "next/font/google";
import { MonolithicStudioPreview } from "@/components/dashboard/design-preview/MonolithicStudioPreview";

const plusJakarta = Plus_Jakarta_Sans({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700", "800"],
  variable: "--font-preview-headline",
  display:  "swap",
});

export default function DesignPreviewPage() {
  return (
    <div className={plusJakarta.variable}>
      <MonolithicStudioPreview />
    </div>
  );
}

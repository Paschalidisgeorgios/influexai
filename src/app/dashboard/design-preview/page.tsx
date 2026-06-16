/**
 * /dashboard/design-preview
 *
 * Isolated Design-V2 Preview — "Monolithic Studio Architecture"
 * Requires authentication (inherits dashboard layout auth check).
 *
 * IMPORTANT: This is a pure design preview.
 *   - All data is mock
 *   - Zero API calls
 *   - Zero credit deductions
 *   - Zero asset writes
 *   - Does NOT replace the production dashboard
 */

import { MonolithicStudioPreview } from "@/components/dashboard/design-preview/MonolithicStudioPreview";

export default function DesignPreviewPage() {
  return <MonolithicStudioPreview />;
}

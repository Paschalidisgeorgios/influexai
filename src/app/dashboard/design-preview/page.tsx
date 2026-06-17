/**
 * /dashboard/design-preview — isolated design preview (not production dashboard).
 * Mock data only. Use /dashboard for the real Studio cockpit.
 */

import { PreviewShell } from "@/components/dashboard/design-preview/PreviewShell";
import "@/components/dashboard/design-preview/preview-design.css";

export default function DesignPreviewPage() {
  return (
    <div className="preview-studio-root h-dvh max-h-dvh w-full overflow-hidden">
      <PreviewShell />
    </div>
  );
}

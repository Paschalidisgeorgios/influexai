import { redirect } from "next/navigation";

/** Legacy public URL — White Label is dashboard-only. */
export default function WhiteLabelRootRedirect() {
  redirect("/dashboard/white-label");
}

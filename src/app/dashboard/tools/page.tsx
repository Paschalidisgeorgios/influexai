import { redirect } from "next/navigation";

export default function DashboardToolsRedirectPage() {
  redirect("/dashboard?tool=tools");
}

import { redirect } from "next/navigation";

/** Legacy public URL — agency landing (auth users handled in middleware). */
export default function WhiteLabelRootRedirect() {
  redirect("/agency");
}

import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ title?: string; hook?: string; script?: string }>;
};

export default async function VideoAdPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.title) q.set("title", sp.title);
  if (sp.hook) q.set("hook", sp.hook);
  if (sp.script) q.set("script", sp.script);
  const query = q.toString();
  redirect(query ? `/dashboard/produkt?${query}` : "/dashboard/produkt");
}

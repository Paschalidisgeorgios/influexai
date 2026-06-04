/** Read a query param; decode safely (URLSearchParams may already decode once). */
export function getSafeSearchParam(
  params: Pick<URLSearchParams, "get">,
  key: string
): string {
  const raw = params.get(key);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function scriptGeneratorTopicUrl(topic: string): string {
  const q = new URLSearchParams({
    topic: topic.trim(),
  });
  return `/dashboard/script-generator?${q.toString()}`;
}

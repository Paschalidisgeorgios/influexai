type MessageTree = Record<string, unknown>;

/** Deep-merge message trees (later keys override). */
export function deepMergeMessages(
  base: MessageTree,
  override: MessageTree
): MessageTree {
  const out: MessageTree = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof out[key] === "object" &&
      out[key] !== null &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeMessages(
        out[key] as MessageTree,
        value as MessageTree
      );
    } else {
      out[key] = value;
    }
  }

  return out;
}

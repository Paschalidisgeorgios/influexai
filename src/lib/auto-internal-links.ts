import {
  FEATURES,
  NICHES,
  findNicheInText,
  type FeatureKey,
  type NicheKey,
} from "@/lib/programmatic-seo";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isInsideLink(markdown: string, index: number): boolean {
  const before = markdown.slice(0, index);
  const openBracket = before.lastIndexOf("[");
  const closeBracket = before.lastIndexOf("]");
  const openParen = before.lastIndexOf("(");
  if (openBracket > closeBracket && openBracket !== -1) return true;
  if (closeBracket > openBracket && openParen > closeBracket) return true;
  return false;
}

function linkFirstOccurrence(
  markdown: string,
  pattern: RegExp,
  href: string,
  labelGroup = 0
): string {
  const match = pattern.exec(markdown);
  if (!match || match.index === undefined) return markdown;
  if (isInsideLink(markdown, match.index)) return markdown;

  const label = match[labelGroup] ?? match[0];
  const linked = `[${label}](${href})`;
  return (
    markdown.slice(0, match.index) +
    linked +
    markdown.slice(match.index + match[0].length)
  );
}

/**
 * Adds internal links to /tools/{feature}/{niche} for first mentions in markdown.
 */
export function autoInternalLinks(
  markdown: string,
  options?: { defaultNiche?: NicheKey; defaultFeature?: FeatureKey }
): string {
  let content = markdown;
  const defaultNiche =
    options?.defaultNiche ?? findNicheInText(content) ?? "lifestyle";
  const defaultFeature = options?.defaultFeature ?? "script-generator";
  const linkedPairs = new Set<string>();

  const nicheInText = findNicheInText(content) ?? defaultNiche;

  for (const [featureKey, feature] of Object.entries(FEATURES) as [
    FeatureKey,
    (typeof FEATURES)[FeatureKey],
  ][]) {
    const terms = [feature.nameDe, feature.name, ...feature.aliases];
    for (const term of terms) {
      const pattern = new RegExp(`\\b(${escapeRegex(term)})\\b`, "i");
      const pairKey = `${featureKey}:${nicheInText}`;
      if (linkedPairs.has(pairKey)) continue;
      const next = linkFirstOccurrence(
        content,
        pattern,
        `/tools/${featureKey}/${nicheInText}`
      );
      if (next !== content) {
        content = next;
        linkedPairs.add(pairKey);
        break;
      }
    }
  }

  for (const [nicheKey, niche] of Object.entries(NICHES) as [
    NicheKey,
    (typeof NICHES)[NicheKey],
  ][]) {
    const terms = [niche.nameDe, niche.name, nicheKey.replace(/-/g, " ")];
    for (const term of terms) {
      if (term.length < 3) continue;
      const pattern = new RegExp(`\\b(${escapeRegex(term)})\\b`, "i");
      const featureForNiche =
        (Object.keys(FEATURES) as FeatureKey[]).find((f) =>
          linkedPairs.has(`${f}:${nicheKey}`)
        ) ?? defaultFeature;
      const pairKey = `niche:${nicheKey}`;
      if (linkedPairs.has(pairKey)) continue;
      const next = linkFirstOccurrence(
        content,
        pattern,
        `/tools/${featureForNiche}/${nicheKey}`
      );
      if (next !== content) {
        content = next;
        linkedPairs.add(pairKey);
        break;
      }
    }
  }

  return content;
}

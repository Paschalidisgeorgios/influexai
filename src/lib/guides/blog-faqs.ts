import {
  blogCategoryToFeature,
  findNicheInText,
  type NicheKey,
} from "@/lib/programmatic-seo";
import { getToolFaqs } from "./tool-faqs";
import type { GuideFaq } from "./types";

export function getBlogFaqs(input: {
  title: string;
  category: string;
  targetKeyword: string;
  content: string;
}): GuideFaq[] {
  const niche =
    findNicheInText(input.targetKeyword) ??
    findNicheInText(input.content) ??
    ("lifestyle" as NicheKey);
  const feature = blogCategoryToFeature(input.category) ?? "script-generator";

  const toolFaqs = getToolFaqs(feature, niche);
  return [
    {
      question: `Worum geht es in „${input.title}“?`,
      answer: `Der Artikel erklärt praxisnahe Schritte für YouTube Creator zum Thema ${input.targetKeyword || input.category}. Du erhältst umsetzbare Tipps ohne theoretisches BlaBla.`,
    },
    ...toolFaqs.slice(0, 2),
  ];
}

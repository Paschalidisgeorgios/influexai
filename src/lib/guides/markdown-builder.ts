export type GuideSection = {
  h2: string;
  h3?: { title: string; paragraphs: string[] }[];
  paragraphs: string[];
  takeaway?: string;
  cta?: { label: string; href: string };
};

export function sectionsToMarkdown(sections: GuideSection[]): string {
  const parts: string[] = [];
  for (const s of sections) {
    parts.push(`## ${s.h2}`);
    for (const p of s.paragraphs) parts.push("", p);
    if (s.takeaway) {
      parts.push(
        "",
        `> **Key Takeaway:** ${s.takeaway}`
      );
    }
    if (s.cta) {
      parts.push(
        "",
        `**Probier es aus:** [${s.cta.label}](${s.cta.href})`
      );
    }
    if (s.h3) {
      for (const sub of s.h3) {
        parts.push("", `### ${sub.title}`);
        for (const p of sub.paragraphs) parts.push("", p);
      }
    }
  }
  return parts.join("\n");
}

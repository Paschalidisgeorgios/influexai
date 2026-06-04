import { describe, expect, it } from "vitest";
import { parseOutlierConcepts } from "@/lib/outlier-analysis";

describe("parseOutlierConcepts", () => {
  it("splits whyItWorked string without sentence endings into bullets", () => {
    const raw = JSON.stringify([
      {
        title: "Test Video",
        thumbnailConcept: "Bold text",
        outlierScore: 8,
        whyItWorked:
          "Hook in Sekunde eins, hohe Relatability für Zielgruppe, Thumbnail erzeugt Klick-Drang",
        hook: "Das musst du sehen",
        viralMechanism: "Family-Relatability + Challenge",
      },
    ]);
    const items = parseOutlierConcepts(raw);
    expect(items).toHaveLength(1);
    expect(items[0].whyItWorked[0]).toContain("Hook");
    expect(items[0].whyItWorked[1]).toContain("Relatability");
    expect(items[0].viralMechanism).toBe("curiosity_gap");
  });

  it("accepts wrapped outliers key", () => {
    const raw = JSON.stringify({
      outliers: [
        {
          title: "A",
          thumbnailConcept: "B",
          outlierScore: 9,
          whyItWorked: ["a", "b", "c"],
          hook: "h",
          viralMechanism: "list",
        },
      ],
    });
    const items = parseOutlierConcepts(raw);
    expect(items[0].viralMechanism).toBe("list");
  });
});

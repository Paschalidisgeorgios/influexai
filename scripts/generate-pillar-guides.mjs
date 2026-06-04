import fs from "node:fs";
import path from "node:path";

const pillars = [
  {
    slug: "youtube-shorts-erstellen",
    topic: "YouTube Shorts mit KI",
    kw: ["Hook", "Script", "Thumbnail", "CTA"],
    cta: "/dashboard/script-generator",
  },
  {
    slug: "youtube-niche-finden",
    topic: "profitable YouTube-Nischen",
    kw: ["Nische", "Wettbewerb", "Monetarisierung", "Positionierung"],
    cta: "/dashboard/niche-analyzer",
  },
  {
    slug: "viral-youtube-shorts",
    topic: "virale YouTube Shorts",
    kw: ["Algorithmus", "Retention", "Outlier", "Format"],
    cta: "/dashboard/outlier-detector",
  },
  {
    slug: "ki-content-creation",
    topic: "KI Content Creation",
    kw: ["Workflow", "Tools", "Qualität", "Automatisierung"],
    cta: "/dashboard",
  },
  {
    slug: "youtube-kanal-aufbauen",
    topic: "YouTube Kanal von 0 auf 1000 Subscriber",
    kw: ["Strategie", "Konsistenz", "Shorts", "Monetarisierung"],
    cta: "/dashboard/script-generator",
  },
];

const h2s = [
  "Grundlagen und Mindset",
  "Schritt-für-Schritt Workflow",
  "Häufige Fehler vermeiden",
  "Tools und KI richtig einsetzen",
  "Metriken die zählen",
  "Content-Ideen skalieren",
  "Monetarisierung vorbereiten",
  "Checkliste vor dem Upload",
  "Fortgeschrittene Taktiken",
  "Langfristige Strategie",
  "Fallstudien aus der Praxis",
  "Zusammenfassung und nächste Schritte",
];

function para(topic, kw, i, j) {
  const focus = kw[j % kw.length];
  return `Im Kontext von ${topic} ist ${focus} ein wiederkehrendes Erfolgsmuster für Creator im Jahr 2025. In Modul ${i + 1}.${j + 1} lernst du, wie du mit klaren Hypothesen arbeitest: ein Ziel pro Video, eine Metrik als Erfolgskriterium und ein konkreter nächster Schritt nach dem Upload. Professionelle Kanäle dokumentieren nicht nur Views, sondern vor allem frühe Retention, Wiedergaberate und Kommentar-Qualität. Wenn du diese Signale wöchentlich auswertest, erkennst du schneller, welche Formate skalieren und welche du stoppen solltest. So baust du ein System statt einzelner Glückstreffer.`;
}

function build(p) {
  const lines = [`# ${p.topic}`, ""];
  h2s.forEach((h2, i) => {
    lines.push(`## ${h2}`, "");
    for (let j = 0; j < 4; j++) lines.push(para(p.topic, p.kw, i, j), "");
    lines.push(
      `> **Key Takeaway:** In „${h2}“ zählst du Fortschritt in messbaren Wochenzielen, nicht in Vanity-Metriken.`,
      ""
    );
    if (i === 3) {
      lines.push(
        `**Probier es aus:** [InfluexAI ${p.kw[0]} Tool](${p.cta})`,
        ""
      );
    }
    if (i % 3 === 0) {
      lines.push(
        `### Detail: ${p.kw[i % p.kw.length]} vertiefen`,
        "",
        para(p.topic, p.kw, i, 0),
        ""
      );
    }
  });
  return lines.join("\n");
}

const dir = path.join(process.cwd(), "content", "guides");
fs.mkdirSync(dir, { recursive: true });

for (const p of pillars) {
  const md = build(p);
  fs.writeFileSync(path.join(dir, `${p.slug}.md`), md, "utf8");
  const words = md.split(/\s+/).filter(Boolean).length;
  console.log(p.slug, words, "words");
}

import type { Metadata } from "next";
import {
  LegalExternalLink,
  LegalPageLayout,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Impressum | INFLUEXAI",
  description: "Impressum und Anbieterkennzeichnung der INFLUEXAI Plattform.",
};

export default function ImpressumPage() {
  return (
    <LegalPageLayout title="IMPRESSUM">
      <LegalSection title="Angaben gemäß § 5 TMG">
        <LegalParagraph>INFLUEXAI</LegalParagraph>
        <LegalParagraph>Georgios Paschalidis</LegalParagraph>
        <LegalParagraph>
          Bozenerstrasse 31
          <br />
          72379 Hechingen
          <br />
          Deutschland
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Kontakt">
        <LegalParagraph>
          E-Mail:{" "}
          <LegalExternalLink href="mailto:info@influexaicreator.com">
            info@influexaicreator.com
          </LegalExternalLink>
        </LegalParagraph>
        <LegalParagraph>
          Website:{" "}
          <LegalExternalLink href="https://influexaicreator.com">
            https://influexaicreator.com
          </LegalExternalLink>
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
        <LegalParagraph>Georgios Paschalidis</LegalParagraph>
        <LegalParagraph>
          Bozenerstrasse 31
          <br />
          72379 Hechingen
          <br />
          Deutschland
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Hinweis zur Haftung">
        <LegalParagraph>
          Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für
          die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir
          jedoch keine Gewähr übernehmen.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Hinweis zu KI-generierten Inhalten">
        <LegalParagraph>
          INFLUEXAI ist eine KI-gestützte Plattform. Alle generierten Inhalte
          sind maschinell erstellt und ersetzen keine professionelle Rechts-,
          Steuer- oder Finanzberatung.
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  );
}

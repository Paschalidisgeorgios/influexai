import type { Metadata } from "next";
import {
  LegalExternalLink,
  LegalLink,
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Datenschutz | INFLUEXAI",
  description:
    "Datenschutzerklärung der INFLUEXAI KI-Creator-Plattform gemäß DSGVO.",
};

export default function DatenschutzPage() {
  return (
    <LegalPageLayout title="DATENSCHUTZ">
      <LegalSection title="1. Verantwortlicher">
        <LegalParagraph>INFLUEXAI — Georgios Paschalidis</LegalParagraph>
        <LegalParagraph>
          Bozenerstrasse 31, 72379 Hechingen
          <br />
          E-Mail:{" "}
          <LegalExternalLink href="mailto:info@influexaicreator.com">
            info@influexaicreator.com
          </LegalExternalLink>
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. Erhobene Daten">
        <LegalList
          items={[
            "Registrierungsdaten (E-Mail, Name)",
            "Nutzungsdaten (generierte Inhalte, Credits, Tool-Nutzung)",
            "Zahlungsdaten (über Stripe — wir speichern keine Kartendaten)",
            "Technische Daten (IP-Adresse, Browser, Gerät)",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Zweck der Verarbeitung">
        <LegalList
          items={[
            "Bereitstellung der Plattform und aller KI-Tools",
            "Abrechnung, Credits und Abo-Verwaltung",
            "Sicherheit und Missbrauchsschutz",
            "Verbesserung der KI-Tools und User Experience",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. KI-generierte Inhalte & externe Dienste">
        <LegalParagraph>
          INFLUEXAI nutzt folgende externe KI-Dienste:
        </LegalParagraph>
        <LegalList
          items={[
            "Anthropic Claude (Textgenerierung) — InfluexAI Brain",
            "fal.ai (Bildgenerierung) — InfluexAI Image Engine",
            "ElevenLabs (Sprachsynthese) — InfluexAI Voice",
            "Akool (Avatar & Live Creator) — InfluexAI LiveSwap™",
          ]}
        />
        <LegalParagraph>
          Deine Eingaben werden zur Generierung an diese Dienste übermittelt. Wir
          nutzen deine Uploads nicht für KI-Training ohne deine ausdrückliche
          Einwilligung.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="5. Face Swap, Voice Cloning & KI-Avatar">
        <LegalParagraph>
          Diese Funktionen verarbeiten biometrische Daten (Gesichtserkennung,
          Stimmmuster). Die Nutzung erfordert deine ausdrückliche Einwilligung.
          Du darfst ausschließlich eigenes oder lizenziertes Bild- und
          Audiomaterial verwenden.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="6. Speicherdauer">
        <LegalParagraph>
          Daten werden gelöscht sobald sie für den jeweiligen Zweck nicht mehr
          benötigt werden oder du dein Konto löschst.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="7. Deine Rechte (DSGVO Art. 15–21)">
        <LegalParagraph>Du hast das Recht auf:</LegalParagraph>
        <LegalList
          items={[
            "Auskunft über gespeicherte Daten",
            "Berichtigung unrichtiger Daten",
            "Löschung deiner Daten",
            "Einschränkung der Verarbeitung",
            "Datenübertragbarkeit",
            "Widerspruch gegen die Verarbeitung",
          ]}
        />
        <LegalParagraph>
          Anfragen:{" "}
          <LegalExternalLink href="mailto:info@influexaicreator.com">
            info@influexaicreator.com
          </LegalExternalLink>
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. Hosting & Infrastruktur">
        <LegalList
          items={[
            "Vercel (Hosting, EU-Region)",
            "Supabase (Datenbank, eu-central-1 Frankfurt)",
            "Stripe (Zahlungsabwicklung)",
          ]}
        />
        <LegalParagraph>Alle Anbieter sind DSGVO-konform.</LegalParagraph>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <LegalParagraph>
          Siehe Cookie-Richtlinie unter{" "}
          <LegalLink href="/cookies">/cookies</LegalLink>.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. Beschwerderecht">
        <LegalParagraph>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
          beschweren. Zuständig: Der Landesbeauftragte für den Datenschutz und
          die Informationsfreiheit Baden-Württemberg.
        </LegalParagraph>
      </LegalSection>

      <LegalParagraph muted>Stand: Juni 2026</LegalParagraph>
    </LegalPageLayout>
  );
}

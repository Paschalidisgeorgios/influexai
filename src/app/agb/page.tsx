import type { Metadata } from "next";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "AGB | INFLUEXAI",
  description: "Allgemeine Geschäftsbedingungen für die Nutzung von INFLUEXAI.",
};

export default function AgbPage() {
  return (
    <LegalPageLayout title="AGB">
      <LegalSection title="§ 1 Geltungsbereich">
        <LegalParagraph>
          Diese AGB gelten für die Nutzung der INFLUEXAI-Plattform
          (influexaicreator.com) von Georgios Paschalidis, Bozenerstrasse 31,
          72379 Hechingen.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="§ 2 Leistungsbeschreibung">
        <LegalParagraph>
          INFLUEXAI ist eine KI-gestützte Creator-Plattform. Die Plattform stellt
          KI-Tools für die Content-Erstellung zur Verfügung (Scripts, Hooks,
          Bilder, Avatare, Kalender, Voiceover und mehr). Alle generierten
          Inhalte sind KI-generiert und müssen vom Nutzer vor Verwendung geprüft
          werden.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="§ 3 Nutzungsbedingungen">
        <LegalList
          items={[
            "Mindestalter: 18 Jahre",
            "Keine automatisierten Angriffe oder Plattform-Missbrauch",
            "Keine Erstellung illegaler, diskriminierender oder irreführender Inhalte",
            "Keine Verletzung von Urheberrechten Dritter",
            "Bei Face Swap und Voice Cloning: ausschließlich eigenes oder lizenziertes Material verwenden",
            "Keine Nutzung für Spam, Phishing oder Desinformation",
          ]}
        />
      </LegalSection>

      <LegalSection title="§ 4 Credits und Zahlung">
        <LegalList
          items={[
            "Credits sind das Nutzungsguthaben auf der Plattform",
            "Abonnements werden monatlich oder jährlich abgerechnet",
            "Monatliche Abos sind monatlich kündbar",
            "Jährliche Abos laufen bis Ende des Abrechnungszeitraums",
            "Credits verfallen nicht innerhalb der Abo-Laufzeit",
            "Keine Rückerstattung bereits verbrauchter Credits",
          ]}
        />
      </LegalSection>

      <LegalSection title="§ 5 Haftungsausschluss">
        <LegalParagraph>
          KI-generierte Inhalte können Fehler enthalten. INFLUEXAI übernimmt
          keine Haftung für:
        </LegalParagraph>
        <LegalList
          items={[
            "Inhaltliche Fehler in generierten Texten oder Bildern",
            "Rechtliche Konsequenzen aus der Nutzung generierter Inhalte",
            "Finanz-, Steuer- oder Gesundheitsberatung durch KI-Outputs",
            "Schäden durch Nutzung nicht lizenzierter Inhalte bei Face Swap oder Voice Cloning",
          ]}
        />
        <LegalParagraph>
          Der Nutzer ist vollständig verantwortlich für die Prüfung und
          Verwendung aller generierten Inhalte.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="§ 6 Geistiges Eigentum">
        <LegalParagraph>
          Generierte Inhalte gehören dem Nutzer, sofern keine Rechte Dritter
          verletzt werden. INFLUEXAI-Marke, Logo und Plattform-Code sind
          urheberrechtlich geschützt und dürfen nicht ohne Genehmigung verwendet
          werden.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="§ 7 Kündigung">
        <LegalParagraph>
          Nutzer können ihr Konto jederzeit unter den Account-Einstellungen
          löschen. Bei Verstößen gegen diese AGB behalten wir uns vor, Konten
          ohne Vorankündigung zu sperren oder zu löschen.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="§ 8 Anwendbares Recht">
        <LegalParagraph>
          Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist
          Hechingen, Deutschland.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="§ 9 Änderungen der AGB">
        <LegalParagraph>
          Wir behalten uns vor, diese AGB anzupassen. Nutzer werden über
          wesentliche Änderungen per E-Mail oder Plattform-Benachrichtigung
          informiert.
        </LegalParagraph>
        <LegalParagraph muted>Stand: Juni 2026</LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  );
}

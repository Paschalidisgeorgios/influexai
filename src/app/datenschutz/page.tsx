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

const DPA_NOTICE =
  "Wir wählen unsere Anbieter sorgfältig aus und schließen, soweit erforderlich, Auftragsverarbeitungsverträge oder vergleichbare Datenschutzvereinbarungen ab.";

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
            "Registrierungsdaten (z. B. E-Mail, Name)",
            "Nutzungsdaten (generierte Inhalte, Credits, Tool-Nutzung)",
            "Zahlungsdaten (über Stripe — wir speichern keine vollständigen Kartendaten)",
            "Hochgeladene Medien (Bilder, Audio, Video) bei Nutzung entsprechender Tools",
            "Technische Daten (z. B. IP-Adresse, Browser, Gerät, Fehlerprotokolle)",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Zweck der Verarbeitung">
        <LegalList
          items={[
            "Bereitstellung der Plattform und der gebuchten KI-Funktionen",
            "Abrechnung, Credits und Abo-Verwaltung",
            "E-Mail-Kommunikation (z. B. Bestätigungen, Service-Hinweise, Newsletter sofern angemeldet)",
            "Sicherheit, Stabilität und Missbrauchsschutz",
            "Verbesserung der Plattform und Fehleranalyse",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. KI-Dienste & externe Verarbeitung">
        <LegalParagraph>
          Zur Bereitstellung der KI-Funktionen übermitteln wir Inhalte und
          Eingaben an folgende Dienstleister, soweit du die jeweiligen Tools
          nutzt:
        </LegalParagraph>
        <LegalList
          items={[
            "Anthropic (Claude) — Textgenerierung und Analyse",
            "fal.ai — KI-Inferenz (u. a. Bild- und Videogenerierung, Medienverarbeitung, LoRA-Training)",
            "ElevenLabs — Sprachsynthese und Stimmfunktionen",
            "Akool — Avatar-, Face-Swap- und Live-Avatar-Funktionen",
          ]}
        />
        <LegalParagraph>
          Die Verarbeitung erfolgt zur Ausführung der von dir ausgelösten
          Funktion. Externe Anbieter können Daten in Ländern außerhalb der EU
          verarbeiten. Maßgeblich sind deren Datenschutzhinweise; wir haben
          keinen vollständigen Einfluss auf deren interne Systeme.
        </LegalParagraph>
        <LegalParagraph>{DPA_NOTICE}</LegalParagraph>
      </LegalSection>

      <LegalSection title="5. E-Mail-Versand">
        <LegalParagraph>
          Für transaktionale und optionale E-Mails (z. B. Newsletter-Bestätigung,
          Beta-Zugang, Trainings-Benachrichtigungen) nutzen wir:
        </LegalParagraph>
        <LegalList items={["Resend — E-Mail-Zustellung"]} />
        <LegalParagraph>
          Dabei werden u. a. E-Mail-Adresse und Inhalt der Nachricht verarbeitet.
        </LegalParagraph>
        <LegalParagraph>{DPA_NOTICE}</LegalParagraph>
      </LegalSection>

      <LegalSection title="6. Face Swap, Voice Cloning & KI-Avatar">
        <LegalParagraph>
          Diese Funktionen können besonders schützenswerte Daten betreffen (z. B.
          Gesichts- oder Stimmmerkmale). Du darfst dafür nur Material verwenden,
          an dem du die erforderlichen Rechte hast — in der Regel dein eigenes
          Material oder Inhalte, für die die betroffene Person ausdrücklich
          eingewilligt hat.
        </LegalParagraph>
        <LegalParagraph>
          Die Nutzung dieser Tools setzt voraus, dass du diese Voraussetzungen
          erfüllst und keine Rechte Dritter verletzt. Verstöße können zur
          Sperrung des Kontos führen.
        </LegalParagraph>
        <LegalParagraph>
          Wir prüfen hochgeladene Inhalte nicht vollständig im Voraus. Eine
          fehlerfreie Erkennung unzulässiger Nutzung können wir nicht
          garantieren.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="7. Speicherdauer">
        <LegalParagraph>
          Personenbezogene Daten speichern wir grundsätzlich nur so lange, wie
          es für die genannten Zwecke erforderlich ist, gesetzliche
          Aufbewahrungspflichten bestehen oder du dein Konto noch nutzt.
        </LegalParagraph>
        <LegalParagraph>
          Nach Kontolöschung oder auf berechtigte Anfrage hin löschen oder
          anonymisieren wir Daten, soweit dem keine gesetzlichen Pflichten
          entgegenstehen. Bei externen Dienstleistern können abweichende
          Löschfristen gelten.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. Deine Rechte (DSGVO Art. 15–21)">
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

      <LegalSection title="9. Hosting & Infrastruktur">
        <LegalParagraph>
          Für Betrieb, Speicherung und Abrechnung setzen wir u. a. folgende
          Dienste ein:
        </LegalParagraph>
        <LegalList
          items={[
            "Vercel — Hosting und Auslieferung der Anwendung",
            "Supabase — Authentifizierung, Datenbank (Region eu-central-1, Frankfurt)",
            "Stripe — Zahlungsabwicklung",
            "Sentry — Fehler- und Stabilitätsmonitoring",
          ]}
        />
        <LegalParagraph>{DPA_NOTICE}</LegalParagraph>
        <LegalParagraph>
          Konkrete Server- oder Verarbeitungsstandorte können sich je nach
          Anbieter und Konfiguration unterscheiden. Details entnimmst du den
          Datenschutzhinweisen der jeweiligen Anbieter.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. Cookies & Analyse">
        <LegalParagraph>
          Informationen zu Cookies, Session-Daten und optionaler Analyse (z. B.
          Google Analytics) findest du in unserer{" "}
          <LegalLink href="/cookies">Cookie-Richtlinie</LegalLink>.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="11. Beschwerderecht">
        <LegalParagraph>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
          beschweren. Zuständig: Der Landesbeauftragte für den Datenschutz und
          die Informationsfreiheit Baden-Württemberg.
        </LegalParagraph>
      </LegalSection>

      <LegalParagraph muted>
        Stand: Juni 2026. Diese Datenschutzerklärung dient der transparenten
        Information und ersetzt keine individuelle Rechtsberatung.
      </LegalParagraph>
    </LegalPageLayout>
  );
}

import type { Metadata } from "next";
import {
  LegalExternalLink,
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Cookies | INFLUEXAI",
  description: "Cookie-Richtlinie der INFLUEXAI Plattform.",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout title="COOKIES">
      <LegalParagraph>
        Wir verwenden Cookies und ähnliche Technologien um die Plattform
        bereitzustellen und zu verbessern.
      </LegalParagraph>

      <LegalSection title="Notwendige Cookies (keine Zustimmung erforderlich)">
        <LegalList
          items={[
            "Session-Cookies für Authentifizierung und Login",
            "Sicherheits-Cookies (CSRF-Schutz)",
            "Präferenz-Cookies (Spracheinstellungen, Dark Mode)",
          ]}
        />
        <LegalParagraph>
          Diese Cookies sind für die Funktion der Plattform zwingend erforderlich
          und können nicht deaktiviert werden.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Funktionale Cookies">
        <LegalList
          items={[
            "Merken von Login-Status und Einstellungen",
            "Credits-Anzeige und Abo-Status",
          ]}
        />
      </LegalSection>

      <LegalSection title="Analyse-Cookies (nur mit Zustimmung)">
        <LegalParagraph>
          Anonyme Nutzungsstatistiken zur Verbesserung der Plattform und der
          KI-Tools.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Drittanbieter-Cookies">
        <LegalList
          items={[
            "Stripe (Zahlungsabwicklung und Betrugsschutz)",
            "Supabase (Datenbankverbindung und Auth)",
            "Vercel (Performance und Hosting)",
            "Google Analytics (Nutzungsstatistiken — nur nach Zustimmung)",
          ]}
        />
      </LegalSection>

      <LegalSection title="Cookie-Verwaltung">
        <LegalParagraph>
          Du kannst Cookies in deinen Browser-Einstellungen jederzeit einsehen und
          deaktivieren. Notwendige Cookies können nicht ohne Einschränkung der
          Plattform-Funktion deaktiviert werden.
        </LegalParagraph>
      </LegalSection>

      <LegalParagraph>
        Kontakt bei Fragen:{" "}
        <LegalExternalLink href="mailto:info@influexaicreator.com">
          info@influexaicreator.com
        </LegalExternalLink>
      </LegalParagraph>
      <LegalParagraph muted>Stand: Juni 2026</LegalParagraph>
    </LegalPageLayout>
  );
}

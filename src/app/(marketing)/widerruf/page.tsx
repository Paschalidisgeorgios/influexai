import type { Metadata } from "next";
import {
  LegalExternalLink,
  LegalFooterLinks,
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Widerruf | INFLUEXAI",
  description:
    "Widerrufsbelehrung für INFLUEXAI — digitale Inhalte, Abonnements und SaaS.",
};

const WITHDRAWAL_EMAIL = "paschalidisgeorgios38@gmail.com";

export default function WiderrufPage() {
  return (
    <LegalPageLayout title="WIDERRUF">
      <LegalSection title="Widerrufsrecht für Verbraucher">
        <LegalParagraph>
          Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
          diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn
          Tage ab dem Tag des Vertragsabschlusses (z. B. Abschluss eines
          Abonnements oder Kauf eines Credit-Pakets).
        </LegalParagraph>
        <LegalParagraph>
          Um dein Widerrufsrecht auszuüben, musst du uns mittels einer
          eindeutigen Erklärung (z. B. per E-Mail) über deinen Entschluss,
          diesen Vertrag zu widerrufen, informieren:
        </LegalParagraph>
        <LegalParagraph>
          Georgios Paschalidis / INFLUEXAI
          <br />
          Bozenerstrasse 31, 72379 Hechingen, Deutschland
          <br />
          E-Mail:{" "}
          <LegalExternalLink href={`mailto:${WITHDRAWAL_EMAIL}`}>
            {WITHDRAWAL_EMAIL}
          </LegalExternalLink>
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Abonnements ohne Nutzung">
        <LegalParagraph>
          Für kostenpflichtige Abonnements, die du noch nicht genutzt hast
          (keine KI-Generierung gestartet, keine Credits verbraucht), gilt das
          volle 14-tägige Widerrufsrecht. Nach wirksamem Widerruf erstatten wir
          bereits gezahlte Beträge unverzüglich, spätestens binnen 14 Tagen ab
          Eingang deiner Widerrufserklärung, über dasselbe Zahlungsmittel, das
          du bei der ursprünglichen Transaktion eingesetzt hast.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Digitale Inhalte & KI-Generierungen">
        <LegalParagraph>
          INFLUEXAI stellt digitale Dienstleistungen und digitale Inhalte bereit
          (z. B. KI-generierte Texte, Bilder, Audio oder Video). Wenn du ausdrücklich
          zustimmst, dass wir mit der Ausführung des Vertrags vor Ablauf der
          Widerrufsfrist beginnen, und du deine Kenntnis davon bestätigst, dass
          du dein Widerrufsrecht bei vollständiger Vertragserfüllung verlierst,
          entfällt das Widerrufsrecht nach vollständiger Erbringung der Leistung.
        </LegalParagraph>
        <LegalParagraph>
          <strong>
            Sobald eine KI-Generierung gestartet wurde, schließt dies den
            Widerruf für den verbrauchten Anteil aus
          </strong>{" "}
          (§ 356 Abs. 5 BGB): Bei Verträgen über die Lieferung von digitalen
          Inhalten, die nicht auf einem körperlichen Datenträger geliefert
          werden, erlischt das Widerrufsrecht, wenn der Unternehmer mit der
          Ausführung des Vertrags begonnen hat, nachdem der Verbraucher
          ausdrücklich zugestimmt hat und seine Kenntnis davon bestätigt hat,
          dass er sein Widerrufsrecht verliert.
        </LegalParagraph>
        <LegalList
          items={[
            "Verbrauchte Credits oder abgeschlossene Generierungen sind vom Widerruf ausgenommen.",
            "Bereits erbrachte digitale Leistungen werden bei einer Erstattung anteilig berücksichtigt.",
            "Nicht genutzte Abo-Zeiträume oder unverbrauchte Guthaben können im Rahmen des Widerrufs erstattet werden.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Muster-Widerrufsformular">
        <LegalParagraph muted>
          (Wenn du den Vertrag widerrufen willst, kannst du dieses Formular
          ausfüllen und per E-Mail senden — die Nutzung ist nicht verpflichtend.)
        </LegalParagraph>
        <LegalParagraph>
          An: Georgios Paschalidis / INFLUEXAI, Bozenerstrasse 31, 72379
          Hechingen, {WITHDRAWAL_EMAIL}
        </LegalParagraph>
        <LegalParagraph>
          Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die
          Erbringung der folgenden Dienstleistung / den Kauf der folgenden
          digitalen Inhalte:
        </LegalParagraph>
        <LegalParagraph>Bestellt am: _______________</LegalParagraph>
        <LegalParagraph>Name des Verbrauchers: _______________</LegalParagraph>
        <LegalParagraph>
          E-Mail-Adresse des Verbrauchers: _______________
        </LegalParagraph>
        <LegalParagraph>Datum: _______________</LegalParagraph>
        <LegalParagraph>Unterschrift (nur bei Mitteilung auf Papier): _______________</LegalParagraph>
      </LegalSection>

      <LegalSection title="Kontakt">
        <LegalParagraph>
          Fragen zum Widerruf:{" "}
          <LegalExternalLink href={`mailto:${WITHDRAWAL_EMAIL}`}>
            {WITHDRAWAL_EMAIL}
          </LegalExternalLink>
        </LegalParagraph>
      </LegalSection>

      <LegalFooterLinks />
    </LegalPageLayout>
  );
}

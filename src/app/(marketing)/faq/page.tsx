import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  LegalFooterLinks,
  LegalLink,
  LegalPageLayout,
  LegalParagraph,
} from "@/components/legal/LegalPageLayout";
import { LANDING_FAQ_ITEMS } from "@/lib/landing-faq-items";

export const metadata: Metadata = {
  title: "FAQ | INFLUEXAI",
  description:
    "Häufige Fragen zu INFLUEXAI — Abo, Credits, Datenschutz, Plattformen und KI-Agent.",
};

function FaqAnswer({ answerKey, text }: { answerKey: string; text: string }) {
  if (answerKey === "a3") {
    const body = text.replace(/\s*Details:\s*\/?datenschutz\s*$/i, "").trim();
    return (
      <LegalParagraph>
        {body} Details: <LegalLink href="/datenschutz">Datenschutz</LegalLink>
      </LegalParagraph>
    );
  }

  return <LegalParagraph>{text}</LegalParagraph>;
}

export default async function FaqPage() {
  const t = await getTranslations("landingPage.faq");

  return (
    <LegalPageLayout title={t("headline")}>
      <p
        style={{
          marginBottom: 24,
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {t("kicker")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LANDING_FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
              padding: "12px 16px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "#F0EFE8",
                listStyle: "none",
              }}
            >
              {t(item.q)}
            </summary>
            <div style={{ marginTop: 12 }}>
              <FaqAnswer answerKey={item.a} text={t(item.a)} />
            </div>
          </details>
        ))}
      </div>

      <LegalFooterLinks />
    </LegalPageLayout>
  );
}

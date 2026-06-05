import { getTranslations } from "next-intl/server";

export async function CommunityPreview() {
  const t = await getTranslations("landingPage.achieve");

  const cards = [
    { title: t("p1_title"), text: t("p1_text") },
    { title: t("p2_title"), text: t("p2_text") },
    { title: t("p3_title"), text: t("p3_text") },
  ];

  return (
    <section
      style={{
        padding: "64px 24px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2
          className="landing-heading"
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            marginBottom: 10,
          }}
        >
          {t("headline")}
        </h2>
        <p className="achieve-section-subline">{t("subline")}</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {cards.map((card) => (
          <article
            key={card.title}
            style={{
              padding: 24,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(180,255,0,0.12)",
            }}
          >
            <h3 className="achieve-card-title">
              <span className="achieve-card-title-accent" aria-hidden />
              {card.title}
            </h3>
            <p className="achieve-card-text">{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

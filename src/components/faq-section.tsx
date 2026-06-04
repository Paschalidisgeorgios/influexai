export type FAQ = {
  question: string;
  answer: string;
};

export function FAQSection({
  faqs,
  title = "Häufige Fragen",
  className = "",
}: {
  faqs: FAQ[];
  title?: string;
  className?: string;
}) {
  if (!faqs.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className={`mt-12 ${className}`}>
        <h2 className="mb-6 text-xl font-semibold text-white">{title}</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 open:border-[#B4FF00]/30"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {faq.question}
                  <span className="text-[#B4FF00] transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

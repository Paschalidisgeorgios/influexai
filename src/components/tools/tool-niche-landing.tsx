import Link from "next/link";
import { FAQSection } from "@/components/faq-section";
import { formatStarterFromPrice } from "@/lib/pricing";
import { getToolFaqs } from "@/lib/guides/tool-faqs";
import {
  FEATURES,
  NICHES,
  generatePageMetadata,
  getBenefitsForCombo,
  getRelatedFeatures,
  toolPagePath,
  type FeatureKey,
  type NicheKey,
} from "@/lib/programmatic-seo";

type Props = {
  feature: FeatureKey;
  niche: NicheKey;
};

export function ToolNicheLanding({ feature, niche }: Props) {
  const f = FEATURES[feature];
  const n = NICHES[niche];
  const meta = generatePageMetadata(feature, niche)!;
  const benefits = getBenefitsForCombo(feature, niche);
  const related = getRelatedFeatures(feature, niche);
  const signupHref = `/auth/sign-up?source=tools-${feature}-${niche}`;
  const starterPrice = formatStarterFromPrice("de");

  return (
    <main className="min-h-screen bg-[#060608] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-[#B4FF00]">
            InfluexAI
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-white/80 hover:text-[#B4FF00]">
              Alle Tools
            </Link>
            <Link
              href={signupHref}
              className="rounded-lg bg-[#B4FF00] px-4 py-2 font-semibold text-black hover:bg-[#c8ff33]"
            >
              Starten
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <section className="mb-16 text-center md:text-left">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#B4FF00]">
            {n.emoji} {n.nameDe} · {f.creditCost} Credits
          </p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
            {meta.h1}
          </h1>
          <p className="mt-4 text-lg text-white/80">{meta.heroText}</p>
          <p className="mt-3 text-sm text-white/70">{meta.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link
              href={signupHref}
              className="rounded-xl bg-[#B4FF00] px-8 py-3.5 text-sm font-semibold text-black hover:bg-[#c8ff33] active:scale-[0.98]"
            >
              Jetzt starten — Starter-Plan ab €{starterPrice}
            </Link>
            <Link
              href={f.route}
              className="rounded-xl border border-white/15 px-8 py-3.5 text-sm font-medium text-white/80 hover:border-[#B4FF00]/40"
            >
              Direkt zum Tool →
            </Link>
          </div>
        </section>

        <section className="mb-14 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-xl font-semibold text-white">
            Was ist der {f.nameDe}?
          </h2>
          <p className="mt-4 leading-relaxed text-white/70">
            Der InfluexAI {f.nameDe} hilft {n.nameDe}-Creatorn dabei, schneller
            bessere Inhalte zu erstellen. {f.description}. Perfekt für Shorts,
            Reels und TikTok im {n.nameDe}-Bereich — ohne stundenlanges
            Brainstorming.
          </p>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold">
            {f.nameDe} für {n.nameDe} — Beispiele
          </h2>
          <ul className="space-y-4">
            {n.examples.map((example) => (
              <li
                key={example}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <strong className="text-[#B4FF00]">{example}</strong>
                <p className="mt-2 text-sm text-white/80">
                  Mit dem {f.nameDe} erstellst du in Sekunden ein fertiges
                  Konzept für „{example}“ — inklusive Hook, Struktur und CTA,
                  angepasst an {n.nameDe}-Zielgruppen.
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold">So funktioniert es</h2>
          <ol className="space-y-4 text-white/70">
            <li className="flex gap-4 rounded-xl border border-white/10 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B4FF00]/20 text-sm font-bold text-[#B4FF00]">
                1
              </span>
              <span>
                Thema eingeben — z. B. „{n.examples[0]}“ für deinen {n.nameDe}
                -Kanal
              </span>
            </li>
            <li className="flex gap-4 rounded-xl border border-white/10 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B4FF00]/20 text-sm font-bold text-[#B4FF00]">
                2
              </span>
              <span>KI generiert in Sekunden — {f.creditCost} Credits</span>
            </li>
            <li className="flex gap-4 rounded-xl border border-white/10 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B4FF00]/20 text-sm font-bold text-[#B4FF00]">
                3
              </span>
              <span>Ergebnis kopieren, filmen und veröffentlichen</span>
            </li>
          </ol>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold">
            Vorteile für {n.nameDe} Creator
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {benefits.map((b) => (
              <li
                key={b}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70"
              >
                ✓ {b}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14 rounded-2xl border border-[#B4FF00]/30 bg-[#B4FF00]/5 p-8 text-center">
          <h2 className="text-xl font-semibold">
            Jetzt {f.nameDe} für {n.nameDe} ausprobieren
          </h2>
          <p className="mt-3 text-white/80">
            Starter-Plan ab €{starterPrice}. Credits flexibel nutzen. Sofort im
            Dashboard starten.
          </p>
          <Link
            href={signupHref}
            className="mt-6 inline-flex rounded-xl bg-[#B4FF00] px-8 py-3.5 text-sm font-semibold text-black hover:bg-[#c8ff33]"
          >
            {f.cta} →
          </Link>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-semibold">
            Weitere Tools für {n.nameDe} Creator
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.feature}
                href={r.href}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#B4FF00]/40"
              >
                <p className="font-medium text-white">{r.label}</p>
                <p className="mt-1 text-xs text-white/70">
                  {NICHES[niche].emoji} {n.nameDe}
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-white/70">
            <Link href="/tools" className="text-[#B4FF00] hover:underline">
              Alle Tool × Nische Kombinationen →
            </Link>
          </p>
        </section>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-12">
        <FAQSection faqs={getToolFaqs(feature, niche)} />
      </div>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/65">
        <Link
          href={toolPagePath("niche-analyzer", niche)}
          className="hover:text-white/80"
        >
          Niche Analyzer für {n.nameDe}
        </Link>
        {" · "}
        <Link
          href={toolPagePath("script-generator", niche)}
          className="hover:text-white/80"
        >
          Script Generator für {n.nameDe}
        </Link>
      </footer>
    </main>
  );
}

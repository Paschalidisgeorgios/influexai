"use client";

import { useState } from "react";

/* ── TICKER ── */
const TICKER_ITEMS = [
  "InfluexAI LiveSwap™",
  "InfluexAI Vision",
  "InfluexAI Avatar Engine",
  "InfluexAI Voice",
  "InfluexAI Music",
  "InfluexAI Brain",
  "InfluexAI Video Engine",
  "InfluexAI Image Engine",
  "Made in Germany",
  "DSGVO-konform",
  "Face Consistency™",
  "Multi-Platform Export",
];

export function TickerStrip() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-wrap py-4">
      <div className="ticker-inner">
        {doubled.map((item, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-dot" aria-hidden />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FOR BRANDS ── */
const BRAND_FEATS = [
  { n: "01", title: "Konsistente Markenidentität", desc: "Dein KI-Botschafter sieht auf TikTok, Instagram und YouTube identisch aus. Face Consistency über alle Plattformen." },
  { n: "02", title: "Produktvideos in 90 Sekunden", desc: "URL oder Produktfoto eingeben → KI erstellt Script, Stimme und Video. A/B-Varianten automatisch." },
  { n: "03", title: "Multi-Plattform auf Knopfdruck", desc: "TikTok, Instagram, YouTube, LinkedIn — alle Formate in einem Schritt inklusive KI-Hashtags." },
];

const BRAND_EXAMPLES = [
  { src: "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&q=80&fit=crop", cat: "Beauty Brand", title: "Produkt-Kampagne", sub: "URL → 5 TikTok-Ads · 3 Min." },
  { src: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500&q=80&fit=crop", cat: "E-Commerce", title: "Produktfoto KI", sub: "InfluexAI Image Engine" },
  { src: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80&fit=crop", cat: "Tech Company", title: "KI-Sprecher Video", sub: "InfluexAI Avatar Engine" },
];

export function ForBrandsSection() {
  return (
    <section id="brands" className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]" style={{ background: "var(--bg-1)" }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-14">
          <div>
            <span className="kicker mb-2.5">Für Unternehmen & Marken</span>
            <span className="block" style={{ width: 32, height: 2, background: "var(--acid)", borderRadius: 2, margin: "14px 0 20px" }} />
            <h2 style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem,5vw,5rem)", letterSpacing: "0.02em", lineHeight: 0.95 }}>
              Dein KI-<br />Markenbotschafter.<br /><span style={{ color: "var(--acid)" }}>Immer konsistent.</span>
            </h2>
          </div>
          <div>
            <p className="mb-6" style={{ fontSize: "clamp(0.9rem,1.6vw,1rem)", color: "var(--wd)", lineHeight: 1.75, maxWidth: 420 }}>
              Schluss mit teuren Shootings. InfluexAI gibt deiner Marke einen unverwechselbaren KI-Sprecher der überall gleich aussieht.
            </p>
            <div className="flex flex-col gap-3">
              {BRAND_FEATS.map((f) => (
                <div key={f.n} className="flex items-start gap-3.5 rounded-[10px]" style={{ padding: "14px 16px", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="flex-shrink-0" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "var(--acid)", lineHeight: 1, width: 28 }}>{f.n}</div>
                  <div>
                    <div className="font-bold text-sm mb-1" style={{ color: "var(--white)" }}>{f.title}</div>
                    <div className="text-[0.8rem] leading-[1.6]" style={{ color: "var(--wd)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRAND_EXAMPLES.map((ex) => (
            <div key={ex.cat} className="img-card" style={{ aspectRatio: "3/4", borderRadius: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ex.src} alt={ex.title} style={{ filter: "brightness(0.75) saturate(1.2)", width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,6,8,0.92) 0%, transparent 55%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.06em] mb-1" style={{ color: "var(--acid)" }}>{ex.cat}</div>
                <div className="font-bold text-[0.82rem] leading-[1.3]" style={{ letterSpacing: "-0.02em" }}>{ex.title}</div>
                <div className="text-[0.68rem] text-white/45 mt-0.5">{ex.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FEATURES ── */
const FEATURES = [
  { n: "01", icon: "🎭", title: "Live Creator", desc: "Live streamen ohne dein Gesicht. Echtzeit-Face-Swap auf TikTok, YouTube und Instagram Live.", apis: ["Echtzeit", "Face Consistent", "Multi-Platform"] },
  { n: "02", icon: "📸", title: "Mein KI-Ich", desc: "InfluexAI Vision setzt dich in jede Szene der Welt. Face Consistency über alle generierten Inhalte.", apis: ["4K Output", "Face Consistent", "Sofort"] },
  { n: "03", icon: "🛍️", title: "Produkt-Werbung", desc: "URL oder Produktfoto → InfluexAI Brain analysiert → Video-Ad in TikTok, Reel und YouTube. A/B-Varianten automatisch.", apis: ["URL-to-Video", "A/B Varianten", "Multi-Format"] },
  { n: "04", icon: "🎵", title: "Stimme & Musik", desc: "Stimme klonen in 60 Sekunden. Lizenzfreie Hintergrundmusik und Soundeffekte für jeden Content-Typ.", apis: ["30+ Sprachen", "Lizenzfrei", "60 Sek. Klonung"] },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="flex items-end justify-between gap-8 mb-12 flex-wrap">
          <div>
            <span className="kicker mb-2.5">Alle Module</span>
            <h2 style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem,5vw,5rem)", letterSpacing: "0.02em", lineHeight: 0.95 }}>
              Vier Flows.<br />Ein Studio.
            </h2>
          </div>
          <p className="max-w-[280px] text-right text-sm leading-[1.7]" style={{ color: "var(--wd)" }}>
            Kein Tool-Chaos. Alles für KI-Content in einer Plattform.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "var(--border)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {FEATURES.map((f) => (
            <div key={f.n} className="feat-card" style={{ padding: "clamp(20px,3vw,32px) clamp(16px,2.5vw,26px)" }}>
              <div className="mb-6" style={{ fontFamily: "var(--font-dm), monospace", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.12)", letterSpacing: "0.12em" }}>{f.n}</div>
              <span className="text-[1.6rem] block mb-3">{f.icon}</span>
              <div className="font-bold mb-2" style={{ fontSize: "1.05rem", letterSpacing: "-0.02em" }}>{f.title}</div>
              <p className="text-sm leading-[1.7]" style={{ color: "var(--wd)" }}>{f.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {f.apis.map((api) => <span key={api} className="tag-api">{api}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PRICING ── */
const PLANS = [
  {
    name: "Free", monthly: 0, yearly: 0, credits: "50 Credits/Monat",
    desc: "Zum Ausprobieren. Keine Kreditkarte.",
    cta: "Kostenlos starten", hot: false,
    features: ["Live Creator (5 Min)", "KI-Ich: 10 Bilder", "3 Produkt-Ads"],
    missing: ["Stimmen-Klonung", "Brand-Tools"],
  },
  {
    name: "Creator", monthly: 39, yearly: 29, credits: "500 Credits/Monat",
    desc: "Für Creator und Freelancer.",
    cta: "Creator werden", hot: true,
    features: ["Live Creator (unlimitiert)", "KI-Ich: 100 Bilder + Videos", "50 Produkt-Ads", "Stimmen-Klonung", "Musik-Studio"],
    missing: [],
  },
  {
    name: "Business", monthly: 99, yearly: 74, credits: "2.500 Credits/Monat",
    desc: "Für Marken, KMUs und Agenturen.",
    cta: "Business starten", hot: false,
    features: ["Alles aus Creator", "10 Team-Charaktere", "Brand-Konsistenz-Tools", "White-Label Export", "API + Priority Support"],
    missing: [],
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]" style={{ background: "var(--bg-1)" }}>
      <div className="max-w-[960px] mx-auto text-center">
        <span className="kicker mb-2.5">Preise</span>
        <h2 style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem,5vw,4.5rem)", letterSpacing: "0.02em", lineHeight: 0.95 }}>
          Transparent. Skalierbar.
        </h2>
        <div className="inline-flex p-1 rounded-[10px] mt-5 mb-9 mx-auto" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          {(["Monatlich", "Jährlich"] as const).map((label) => {
            const isY = label === "Jährlich";
            const active = yearly === isY;
            return (
              <button key={label} onClick={() => setYearly(isY)}
                className="px-5 py-2 rounded-[7px] text-sm font-semibold cursor-pointer border-none transition-all duration-200"
                style={{ background: active ? "var(--white)" : "transparent", color: active ? "var(--bg)" : "var(--grey)", fontFamily: "var(--font-dm), sans-serif" }}>
                {label}
                {isY && <span className="ml-1.5 text-[0.65rem] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--acid-d)", color: "var(--acid)" }}>−25%</span>}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`flex flex-col rounded-[18px] p-[clamp(20px,3vw,28px)] transition-all duration-200 hover:-translate-y-0.5 relative ${plan.hot ? "pc-hot" : ""}`}
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", marginTop: plan.hot ? "14px" : 0 }}>
              {plan.hot && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[#060608] font-bold text-[0.7rem] px-4 py-1 rounded-full whitespace-nowrap"
                  style={{ background: "var(--acid)", fontFamily: "var(--font-dm), sans-serif" }}>
                  ★ Beliebtester Plan
                </div>
              )}
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.1em] mb-2.5" style={{ color: "var(--grey)" }}>{plan.name}</div>
              <div style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: "0.02em", lineHeight: 1 }}>
                <sup className="text-[1.2rem] align-top mt-[0.3rem]">€</sup>
                {yearly ? plan.yearly : plan.monthly}
                {plan.monthly > 0 && <span className="text-[0.85rem] ml-0.5" style={{ color: "var(--grey)", fontFamily: "var(--font-dm), sans-serif", fontWeight: 400 }}>/Monat</span>}
              </div>
              <div className="text-[0.75rem] mt-1.5 mb-1" style={{ color: "var(--wd)" }}>{plan.credits}</div>
              <div className="text-[0.82rem] mb-4 leading-[1.55]" style={{ color: "var(--grey)" }}>{plan.desc}</div>
              <a href="/auth"
                className="block text-center py-2.5 rounded-[9px] font-bold text-[0.88rem] no-underline transition-all duration-200 mb-5 cursor-pointer"
                style={plan.hot ? { background: "var(--acid)", color: "#060608", fontFamily: "var(--font-dm), sans-serif" } : { background: "transparent", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(240,239,232,0.6)", fontFamily: "var(--font-dm), sans-serif" }}>
                {plan.cta}
              </a>
              <ul className="list-none flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[0.84rem]" style={{ color: "var(--wd)" }}>
                    <span className="font-bold flex-shrink-0" style={{ color: "var(--acid)" }}>✓</span>{f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[0.84rem]" style={{ color: "var(--grey)" }}>
                    <span className="flex-shrink-0" style={{ color: "var(--grey)" }}>—</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[0.83rem]" style={{ color: "var(--grey)" }}>
          Credits verfallen nicht. <a href="#" style={{ color: "var(--acid)", textDecoration: "none" }}>Extra-Credits</a> ab 9€/100 Credits.
        </p>
      </div>
    </section>
  );
}

/* ── CTA ── */
export function CtaSection() {
  return (
    <section id="cta" className="py-[clamp(60px,8vw,120px)] px-[clamp(20px,6vw,64px)] relative overflow-hidden text-center" style={{ background: "var(--bg)" }}>
      <div className="absolute pointer-events-none" style={{ top: -150, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(180,255,0,0.06), transparent 70%)" }} />
      <div className="max-w-[700px] mx-auto relative z-10">
        <span className="kicker mb-4">Jetzt starten</span>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "clamp(3rem,7vw,6rem)", letterSpacing: "0.02em", lineHeight: 0.92 }}>
          Kein Gesicht.<br />Kein Limit.<br /><span style={{ color: "var(--acid)" }}>Kein Warten.</span>
        </h2>
        <p className="mb-8 leading-[1.75]" style={{ fontSize: "clamp(0.9rem,2vw,1.05rem)", color: "var(--wd)" }}>
          Für Creator die viral gehen wollen.<br />Für Marken die skalieren möchten.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 justify-center">
          <a href="/auth" className="btn-acid justify-center">→ Kostenlos starten</a>
          <a href="#brands" className="btn-ghost justify-center">Für Marken →</a>
        </div>
        <p className="mt-4 text-[0.78rem]" style={{ color: "var(--grey)" }}>50 gratis Credits · Keine Kreditkarte · DSGVO-konform</p>
      </div>
    </section>
  );
}

/* ── FOOTER ── */
const FOOTER_LINKS = {
  Produkt: ["Features", "Preise", "Changelog", "API"],
  Unternehmen: ["Über uns", "Blog", "Karriere", "Presse"],
  Rechtliches: ["Impressum", "Datenschutz", "AGB", "Cookies"],
};

export function LandingFooter() {
  return (
    <footer className="px-[clamp(20px,6vw,64px)] pt-[clamp(40px,6vw,56px)] pb-7" style={{ background: "var(--bg-1)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1160px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9 mb-10">
        <div>
          <a href="/" className="flex items-center gap-2 no-underline mb-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-[#B4FF00] flex items-center justify-center text-[#060608] font-[family-name:var(--font-bebas)] text-sm leading-none">I</div>
            <span className="text-[0.9rem]" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: "var(--white)" }}>
              Influex<span style={{ color: "var(--acid)" }}>AI</span>
            </span>
          </a>
          <p className="text-[0.83rem] leading-[1.7] max-w-[210px]" style={{ color: "var(--grey)" }}>
            KI-Studio für Creator & Marken. Made in Germany. DSGVO-konform. 2026.
          </p>
        </div>
        {Object.entries(FOOTER_LINKS).map(([col, links]) => (
          <div key={col}>
            <h5 className="text-[0.72rem] font-bold uppercase tracking-[0.1em] mb-3.5" style={{ color: "rgba(255,255,255,0.25)" }}>{col}</h5>
            <div className="flex flex-col gap-2.5">
              {links.map((link) => (
                <a key={link} href="#" className="text-[0.84rem] no-underline transition-colors duration-150 hover:text-[var(--white)]" style={{ color: "var(--grey)" }}>{link}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-[1160px] mx-auto pt-5 flex flex-col sm:flex-row items-center justify-between gap-2.5" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-[0.78rem]" style={{ color: "var(--grey)" }}>© 2026 InfluexAI GmbH. Alle Rechte vorbehalten.</p>
        <div className="flex gap-2">
          {["𝕏", "in", "▶"].map((icon) => (
            <a key={icon} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-[0.8rem] no-underline transition-all duration-150 hover:text-[var(--acid)]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--grey)" }}>{icon}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

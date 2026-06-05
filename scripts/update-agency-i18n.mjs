/**
 * Agency landing page + teaser i18n for 8 locales.
 * Run: node scripts/update-agency-i18n.mjs
 */

import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "messages");

const agencyPage = {
  de: {
    hero: {
      kicker: "White Label · Agentur",
      headline: "VERKAUFE KI-TOOLS\nUNTER DEINER\nEIGENEN MARKE.",
      subline:
        "Starte deine eigene KI-Agentur —\npowered by InfluexAI Technologie.",
      cta_primary: "Pläne ansehen",
      cta_secondary: "Demo ansehen",
    },
    features: {
      f1_title: "Dein Logo. Deine Farben.",
      f1_text:
        "Eigene Subdomain, eigenes Logo,\neigene Primärfarbe. Deine Kunden sehen\nnur deine Marke.",
      f2_title: "Bis zu 500 Clients verwalten",
      f2_text:
        "Credits verteilen, Kunden einladen,\nNutzung überwachen — alles in einem\nAgency Dashboard.",
      f3_title: "Alle InfluexAI Features",
      f3_text:
        "Script Generator, KI Avatar, Face Swap,\nLive Creator — alles unter deiner Marke.",
    },
    how: {
      kicker: "So funktioniert's",
      headline: "In 4 Schritten live",
      s1_title: "Plan wählen",
      s1_text: "Starter, Pro oder Enterprise — monatlich oder jährlich.",
      s2_title: "Branding einrichten",
      s2_text: "Logo, Primärfarbe und Subdomain in Minuten.",
      s3_title: "Clients einladen",
      s3_text: "Per E-Mail einladen — sie sehen deine Marke.",
      s4_title: "Credits & Nutzung",
      s4_text: "Pool verwalten und Aktivität im Dashboard überwachen.",
    },
    demo: {
      kicker: "Vorschau",
      headline: "So sehen deine Clients das Studio",
      agency_name: "Deine Agentur",
      powered_by: "Powered by Deine Agentur",
      workspace: "Creator Workspace",
      placeholder: "Generierter Content erscheint hier",
    },
    pricing: {
      kicker: "Agentur-Preise",
      headline: "Skaliere deine KI-Agentur",
      setup_hint: "Optional: Name & Subdomain vor Checkout — kannst du auch später einrichten.",
      agency_name_label: "Agentur-Name",
      agency_name_placeholder: "Studio Neon",
      slug_label: "Subdomain",
      slug_placeholder: "neon",
      monthly: "Monatlich",
      yearly: "Jährlich",
      per_month: "/Monat",
      popular: "★ Beliebtester Plan",
      cta: "Jetzt starten",
      starter_name: "Starter Agency",
      starter_f1: "10 Client Seats",
      starter_f2: "500 Credits Pool/Monat",
      starter_f3: "Eigene Subdomain",
      starter_f4: '"Powered by InfluexAI" sichtbar',
      pro_name: "Pro Agency",
      pro_f1: "50 Client Seats",
      pro_f2: "2.000 Credits Pool/Monat",
      pro_f3: "Eigene Subdomain",
      pro_f4: 'Kein "Powered by" Branding',
      pro_f5: "Priority Support",
      ent_name: "Enterprise",
      ent_f1: "Unlimited Client Seats",
      ent_f2: "10.000 Credits Pool/Monat",
      ent_f3: "Custom Domain (ki.deineagentur.de)",
      ent_f4: "Komplett White Label",
      ent_f5: "Dedizierter Support",
      ent_f6: "API Zugang",
    },
    faq: {
      headline: "Häufige Fragen",
      q1: "Sehen meine Kunden InfluexAI?",
      a1: "Nein — außer im Starter Plan, dort erscheint ein dezentes Powered-by.",
      q2: "Kann ich eigene Preise setzen?",
      a2: "Ja, du bestimmst was du deinen Kunden berechnest.",
      q3: "Was passiert wenn Credits aufgebraucht sind?",
      a3: "Du kannst jederzeit Extra-Credits nachkaufen.",
      q4: "Brauche ich technisches Wissen?",
      a4: "Nein — Setup dauert 5 Minuten.",
      q5: "Kann ich upgraden?",
      a5: "Ja, jederzeit ohne Datenverlust.",
    },
    cta: {
      headline: "Bereit deine eigene KI-Agentur zu starten?",
      button: "Kostenlos testen — 14 Tage",
    },
  },
  en: {
    hero: {
      kicker: "White Label · Agency",
      headline: "SELL AI TOOLS\nUNDER YOUR\nOWN BRAND.",
      subline: "Launch your own AI agency —\npowered by InfluexAI technology.",
      cta_primary: "View plans",
      cta_secondary: "See demo",
    },
    features: {
      f1_title: "Your logo. Your colors.",
      f1_text:
        "Custom subdomain, logo,\nand primary color. Clients only\nsee your brand.",
      f2_title: "Manage up to 500 clients",
      f2_text:
        "Allocate credits, invite clients,\nmonitor usage — all in one\nagency dashboard.",
      f3_title: "Full InfluexAI power",
      f3_text:
        "Script Generator, AI Avatar, Face Swap,\nLive Creator — all under your brand.",
    },
    how: {
      kicker: "How it works",
      headline: "Live in 4 steps",
      s1_title: "Choose a plan",
      s1_text: "Starter, Pro or Enterprise — monthly or yearly.",
      s2_title: "Set up branding",
      s2_text: "Logo, color and subdomain in minutes.",
      s3_title: "Invite clients",
      s3_text: "Invite by email — they see your brand.",
      s4_title: "Credits & usage",
      s4_text: "Manage pool and monitor activity in the dashboard.",
    },
    demo: {
      kicker: "Preview",
      headline: "What your clients see",
      agency_name: "Your Agency",
      powered_by: "Powered by Your Agency",
      workspace: "Creator Workspace",
      placeholder: "Generated content appears here",
    },
    pricing: {
      kicker: "Agency pricing",
      headline: "Scale your AI agency",
      setup_hint: "Optional: name & subdomain before checkout — can set up later too.",
      agency_name_label: "Agency name",
      agency_name_placeholder: "Studio Neon",
      slug_label: "Subdomain",
      slug_placeholder: "neon",
      monthly: "Monthly",
      yearly: "Yearly",
      per_month: "/month",
      popular: "★ Most popular",
      cta: "Get started",
      starter_name: "Starter Agency",
      starter_f1: "10 client seats",
      starter_f2: "500 credits pool/month",
      starter_f3: "Custom subdomain",
      starter_f4: '"Powered by InfluexAI" visible',
      pro_name: "Pro Agency",
      pro_f1: "50 client seats",
      pro_f2: "2,000 credits pool/month",
      pro_f3: "Custom subdomain",
      pro_f4: 'No "Powered by" branding',
      pro_f5: "Priority support",
      ent_name: "Enterprise",
      ent_f1: "Unlimited client seats",
      ent_f2: "10,000 credits pool/month",
      ent_f3: "Custom domain",
      ent_f4: "Full white label",
      ent_f5: "Dedicated support",
      ent_f6: "API access",
    },
    faq: {
      headline: "FAQ",
      q1: "Will clients see InfluexAI?",
      a1: "No — except on Starter, where a subtle powered-by appears.",
      q2: "Can I set my own prices?",
      a2: "Yes, you decide what to charge your clients.",
      q3: "What if credits run out?",
      a3: "Buy extra credits anytime.",
      q4: "Do I need technical skills?",
      a4: "No — setup takes 5 minutes.",
      q5: "Can I upgrade?",
      a5: "Yes, anytime without losing data.",
    },
    cta: {
      headline: "Ready to launch your AI agency?",
      button: "Try free — 14 days",
    },
  },
};

const landingExtras = {
  de: {
    nav_agency: "Für Agenturen",
    nav_home: "Startseite",
    agencyTeaser: {
      headline: "Bist du eine Agentur oder Freelancer?",
      subline: "Verkaufe KI-Tools unter deiner Marke →",
      cta: "Mehr erfahren",
    },
  },
  en: {
    nav_agency: "For agencies",
    nav_home: "Home",
    agencyTeaser: {
      headline: "Are you an agency or freelancer?",
      subline: "Sell AI tools under your brand →",
      cta: "Learn more",
    },
  },
};

function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    if (
      source[k] &&
      typeof source[k] === "object" &&
      !Array.isArray(source[k])
    ) {
      if (!target[k]) target[k] = {};
      deepMerge(target[k], source[k]);
    } else {
      target[k] = source[k];
    }
  }
}

const locales = ["de", "en", "el", "es", "fr", "pt", "tr", "ar"];

for (const locale of locales) {
  const file = path.join(ROOT, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  const page = agencyPage[locale] ?? agencyPage.en;
  data.agencyPage = page;

  const extras = landingExtras[locale] ?? landingExtras.en;
  data.landing.nav_agency = extras.nav_agency;
  data.landing.nav_home = extras.nav_home;
  if (!data.landingPage) data.landingPage = {};
  data.landingPage.agencyTeaser = extras.agencyTeaser;

  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${locale}.json`);
}

/**
 * Adds blog + guides i18n keys to all locale JSON files (English fallback for non-de).
 * Run: node scripts/add-blog-guides-i18n.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const LOCALES = ["de", "en", "el", "tr", "es", "fr", "ar", "pt"];

const EN = {
  blog: {
    title: "InfluexAI Blog",
    subtitle: "Everything you need to go viral",
    search_placeholder: "Search articles…",
    search_button: "Search",
    no_posts: "No articles published yet. Check back soon.",
    no_results: "No articles found for this search.",
    read_more: "Read more →",
    min_read: "{minutes} min",
    all_categories: "All",
    newsletter_title: "Creator Newsletter",
    newsletter_subtitle: "Weekly tips for viral YouTube Shorts — no spam.",
    newsletter_cta: "Subscribe",
    related_title: "You might also like",
    breadcrumb_blog: "Blog",
  },
  guides: {
    title: "Guides & Tutorials",
    subtitle: "Step-by-step guides for every InfluexAI feature",
    pillars_title: "Pillar Guides",
    pillars_subtitle: "In-depth guides for YouTube creators.",
    tutorials_title: "Feature Tutorials",
    tutorials_subtitle: "How to use Script Generator, LoRA Training, and more.",
    read_guide: "Read guide",
    open_tool: "Open tool →",
    words: "{count} words",
    min_read: "~{minutes} min read",
  },
  landing_nav_blog: "Blog",
  landing_nav_guides: "Guides",
  footer_blog: "Blog",
  footer_guides: "Guides",
  company_guides: "Guides",
};

const DE = {
  blog: {
    title: "InfluexAI Blog",
    subtitle: "Alles was du brauchst um viral zu gehen",
    search_placeholder: "Artikel suchen…",
    search_button: "Suchen",
    no_posts: "Noch keine Artikel veröffentlicht. Schau bald wieder vorbei.",
    no_results: "Keine Artikel für diese Suche gefunden.",
    read_more: "Weiterlesen →",
    min_read: "{minutes} Min",
    all_categories: "Alle",
    newsletter_title: "Creator Newsletter",
    newsletter_subtitle: "Wöchentliche Tipps für virale YouTube Shorts — kein Spam.",
    newsletter_cta: "Abonnieren",
    related_title: "Das könnte dich auch interessieren",
    breadcrumb_blog: "Blog",
  },
  guides: {
    title: "Guides & Tutorials",
    subtitle: "Schritt-für-Schritt Anleitungen für jedes InfluexAI Feature",
    pillars_title: "Pillar Guides",
    pillars_subtitle: "Tiefe Leitfäden für YouTube Creator — KI, Shorts, Wachstum.",
    tutorials_title: "Feature Tutorials",
    tutorials_subtitle: "So nutzt du Script Generator, LoRA Training und mehr.",
    read_guide: "Guide lesen",
    open_tool: "Tool öffnen →",
    words: "{count} Wörter",
    min_read: "ca. {minutes} Min Lesezeit",
  },
  landing_nav_blog: "Blog",
  landing_nav_guides: "Guides",
  footer_blog: "Blog",
  footer_guides: "Guides",
  company_guides: "Guides",
};

for (const locale of LOCALES) {
  const path = `messages/${locale}.json`;
  const data = JSON.parse(readFileSync(path, "utf8"));
  const pack = locale === "de" ? DE : EN;

  data.blog = pack.blog;
  data.guides = pack.guides;

  if (!data.footer) data.footer = {};
  data.footer.blog = pack.footer_blog;
  data.footer.guides = pack.footer_guides;

  if (!data.landing) data.landing = {};
  data.landing.nav_blog = pack.landing_nav_blog;
  data.landing.nav_guides = pack.landing_nav_guides;

  if (!data.landingPage) data.landingPage = {};
  if (!data.landingPage.footer_cols) data.landingPage.footer_cols = {};
  data.landingPage.footer_cols.company_guides = pack.company_guides;
  if (!data.landingPage.footer_cols.company_blog) {
    data.landingPage.footer_cols.company_blog = pack.footer_blog;
  }

  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("Updated", path);
}

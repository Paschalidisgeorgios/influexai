/**
 * Fill missing / German placeholder strings. English is the merge fallback (see i18n.ts).
 * Run: node scripts/i18n-apply-translations.mjs
 */
import fs from "fs";
import path from "path";

const messagesDir = path.join(process.cwd(), "messages");
const locales = ["en", "el", "tr", "es", "fr", "pt", "ar"];

const trSupplementPath = path.join(messagesDir, "patches", "tr-supplement.json");
const TR_SUPPLEMENT = fs.existsSync(trSupplementPath)
  ? JSON.parse(fs.readFileSync(trSupplementPath, "utf-8"))
  : {};

/** Flat key → translated string */
const PATCHES = {
  en: {
    "landingPage.features.f1_desc":
      "Viral short scripts in seconds — hook, story, CTA and hashtags for TikTok & YouTube.",
    "landingPage.features.f2_api2": "Scenes",
    "landingPage.features.f2_desc":
      "Your AI avatar in every scene. Consistent face across all generated images and videos.",
    "landingPage.features.f2_title": "AI Avatar",
    "landingPage.features.f3_api0": "Real-time",
    "landingPage.features.f3_desc":
      "Face swap for clips and live — your face, every scene, without expensive shoots.",
    "landingPage.features.f4_api1": "Concepts",
    "landingPage.features.f4_desc":
      "High-contrast thumbnail concepts — click-worthy and on-brand.",
    "landingPage.features.f5_api0": "Real-time",
    "landingPage.features.f5_desc":
      "Go live without showing your real face — AI character on TikTok, YouTube & Instagram.",
    "landingPage.features.f6_api1": "Analysis",
    "landingPage.features.f6_api2": "Optimization",
    "landingPage.features.f6_desc":
      "Viral Score for scripts and ideas — data-driven recommendations before you upload.",
    "landingPage.features.headline1": "Six Flows.",
    "landingPage.features.headline2": "One Studio.",
    "landingPage.features.kicker": "All Modules",
    "landingPage.features.sidebar":
      "No tool chaos. Everything for AI content in one platform.",
  },
  el: {
    "landingPage.features.f1_desc":
      "Viral short scripts σε δευτερόλεπτα — hook, story, CTA και hashtags για TikTok & YouTube.",
    "landingPage.features.f2_api2": "Σκηνές",
    "landingPage.features.f2_desc":
      "Το AI avatar σου σε κάθε σκηνή. Σταθερό πρόσωπο σε όλες τις εικόνες και βίντεο.",
    "landingPage.features.f2_title": "AI Avatar",
    "landingPage.features.f3_api0": "Real-time",
    "landingPage.features.f3_desc":
      "Face swap για clips και live — το πρόσωπό σου, κάθε σκηνή, χωρίς ακριβά γυρίσματα.",
    "landingPage.features.f4_api1": "Concepts",
    "landingPage.features.f4_desc":
      "Thumbnail concepts υψηλής αντίθεσης — κλικ και on-brand.",
    "landingPage.features.f5_api0": "Real-time",
    "landingPage.features.f5_desc":
      "Live streaming χωρίς να δείχνεις το πρόσωπό σου — AI χαρακτήρας σε TikTok, YouTube & Instagram.",
    "landingPage.features.f6_api1": "Ανάλυση",
    "landingPage.features.f6_api2": "Βελτιστοποίηση",
    "landingPage.features.f6_desc":
      "Viral Score για scripts και ιδέες — data-driven συστάσεις πριν το upload.",
    "landingPage.features.headline1": "Έξι Flows.",
    "landingPage.features.headline2": "Ένα Studio.",
    "landingPage.features.kicker": "Όλα τα Modules",
    "landingPage.features.sidebar":
      "Χωρίς chaos εργαλείων. Όλα για AI content σε μία πλατφόρμα.",
    "dashboard.nav_ki_ich": "Το AI Μου",
    "gallery.filters.outlier": "Outliers",
    "nav.agent": "AI Agent",
    "imageGenerator.cat_avatar": "AI Avatar",
  },
  tr: {
    ...TR_SUPPLEMENT,
    "landingPage.features.f1_desc":
      "Saniyeler içinde viral kısa scriptler — hook, story, CTA ve TikTok & YouTube hashtag'leri.",
    "landingPage.features.f2_api2": "Sahneler",
    "landingPage.features.f2_desc":
      "Her sahnede AI avatarın. Tüm üretilen görseller ve videolarda tutarlı yüz.",
    "landingPage.features.f2_title": "AI Avatar",
    "landingPage.features.f3_api0": "Gerçek zamanlı",
    "landingPage.features.f3_desc":
      "Klip ve canlı yayın için face swap — yüzün, her sahne, pahalı çekimler olmadan.",
    "landingPage.features.f4_api1": "Konseptler",
    "landingPage.features.f4_desc":
      "Yüksek kontrastlı thumbnail konseptleri — tıklanabilir ve marka uyumlu.",
    "landingPage.features.f5_api0": "Gerçek zamanlı",
    "landingPage.features.f5_desc":
      "Gerçek yüzünü göstermeden canlı yayın — TikTok, YouTube & Instagram'da AI karakter.",
    "landingPage.features.f6_api1": "Analiz",
    "landingPage.features.f6_api2": "Optimizasyon",
    "landingPage.features.f6_desc":
      "Scriptler ve fikirler için Viral Score — yüklemeden önce veri tabanlı öneriler.",
    "landingPage.features.headline1": "Altı Flow.",
    "landingPage.features.headline2": "Tek Stüdyo.",
    "landingPage.features.kicker": "Tüm Modüller",
    "landingPage.features.sidebar":
      "Araç kaosu yok. AI içerik için her şey tek platformda.",
    "gallery.filters.outlier": "Aykırılar",
    "flows.image_generator.title": "Görsel Oluşturucu",
    "landingPage.features.f2_title": "AI Avatar",
    "nav.agent": "AI Agent",
    "nav.image_generator": "Görsel Oluşturucu",
    "imageGenerator.title": "Görsel Oluşturucu",
    "imageGenerator.info_model": "Model: {model}",
    "imageGenerator.cat_avatar": "AI Avatar",
  },
  es: {
    "landingPage.features.f1_desc":
      "Scripts virales para shorts en segundos — hook, story, CTA y hashtags para TikTok y YouTube.",
    "landingPage.features.f2_api2": "Escenas",
    "landingPage.features.f2_desc":
      "Tu avatar IA en cada escena. Rostro consistente en todas las imágenes y videos generados.",
    "landingPage.features.f2_title": "Avatar IA",
    "landingPage.features.f3_api0": "Tiempo real",
    "landingPage.features.f3_desc":
      "Face swap para clips y live — tu rostro, cada escena, sin rodajes caros.",
    "landingPage.features.f4_api1": "Conceptos",
    "landingPage.features.f4_desc":
      "Conceptos de thumbnail de alto contraste — clicables y alineados con la marca.",
    "landingPage.features.f5_api0": "Tiempo real",
    "landingPage.features.f5_desc":
      "Transmite en vivo sin mostrar tu rostro real — personaje IA en TikTok, YouTube e Instagram.",
    "landingPage.features.f6_api1": "Análisis",
    "landingPage.features.f6_api2": "Optimización",
    "landingPage.features.f6_desc":
      "Viral Score para scripts e ideas — recomendaciones basadas en datos antes de subir.",
    "landingPage.features.headline1": "Seis Flows.",
    "landingPage.features.headline2": "Un Estudio.",
    "landingPage.features.kicker": "Todos los Módulos",
    "landingPage.features.sidebar":
      "Sin caos de herramientas. Todo para contenido IA en una plataforma.",
    "flows.competitor.top_videos": "Top 5 videos",
    "gallery.filters.outlier": "Outliers",
  },
  fr: {
    "landingPage.features.f1_desc":
      "Scripts viraux pour shorts en secondes — hook, story, CTA et hashtags pour TikTok & YouTube.",
    "landingPage.features.f2_api2": "Scènes",
    "landingPage.features.f2_desc":
      "Ton avatar IA dans chaque scène. Visage cohérent sur toutes les images et vidéos générées.",
    "landingPage.features.f2_title": "Avatar IA",
    "landingPage.features.f3_api0": "Temps réel",
    "landingPage.features.f3_desc":
      "Face swap pour clips et live — ton visage, chaque scène, sans tournages coûteux.",
    "landingPage.features.f4_api1": "Concepts",
    "landingPage.features.f4_desc":
      "Concepts de miniatures à fort contraste — cliquables et conformes à la marque.",
    "landingPage.features.f5_api0": "Temps réel",
    "landingPage.features.f5_desc":
      "Stream en live sans montrer ton vrai visage — personnage IA sur TikTok, YouTube & Instagram.",
    "landingPage.features.f6_api1": "Analyse",
    "landingPage.features.f6_api2": "Optimisation",
    "landingPage.features.f6_desc":
      "Viral Score pour scripts et idées — recommandations data-driven avant publication.",
    "landingPage.features.headline1": "Six Flows.",
    "landingPage.features.headline2": "Un Studio.",
    "landingPage.features.kicker": "Tous les Modules",
    "landingPage.features.sidebar":
      "Pas de chaos d'outils. Tout pour le contenu IA sur une plateforme.",
    "landingPage.footer_cols.company_press": "Presse",
    "gallery.filters.outlier": "Outliers",
  },
  pt: {
    "landingPage.features.f1_desc":
      "Scripts virais para shorts em segundos — hook, story, CTA e hashtags para TikTok e YouTube.",
    "landingPage.features.f2_api2": "Cenas",
    "landingPage.features.f2_desc":
      "Seu avatar IA em cada cena. Rosto consistente em todas as imagens e vídeos gerados.",
    "landingPage.features.f2_title": "Avatar IA",
    "landingPage.features.f3_api0": "Tempo real",
    "landingPage.features.f3_desc":
      "Face swap para clips e live — seu rosto, cada cena, sem filmagens caras.",
    "landingPage.features.f4_api1": "Conceitos",
    "landingPage.features.f4_desc":
      "Conceitos de thumbnail de alto contraste — clicáveis e alinhados à marca.",
    "landingPage.features.f5_api0": "Tempo real",
    "landingPage.features.f5_desc":
      "Faça live sem mostrar seu rosto real — personagem IA no TikTok, YouTube e Instagram.",
    "landingPage.features.f6_api1": "Análise",
    "landingPage.features.f6_api2": "Otimização",
    "landingPage.features.f6_desc":
      "Viral Score para scripts e ideias — recomendações baseadas em dados antes do upload.",
    "landingPage.features.headline1": "Seis Flows.",
    "landingPage.features.headline2": "Um Estúdio.",
    "landingPage.features.kicker": "Todos os Módulos",
    "landingPage.features.sidebar":
      "Sem caos de ferramentas. Tudo para conteúdo IA em uma plataforma.",
    "gallery.filters.outlier": "Outliers",
  },
  ar: {
    "landingPage.features.f1_desc":
      "سكربتات shorts فيروسية في ثوانٍ — hook وstory وCTA وهاشتags لـ TikTok وYouTube.",
    "landingPage.features.f2_api2": "مشاهد",
    "landingPage.features.f2_desc":
      "أفاتار AI الخاص بك في كل مشهد. وجه متسق عبر جميع الصور والفيديوهات المُنشأة.",
    "landingPage.features.f2_title": "أفاتار AI",
    "landingPage.features.f3_api0": "في الوقت الفعلي",
    "landingPage.features.f3_desc":
      "Face swap للمقاطع والبث المباشر — وجهك، كل مشهد، بدون تصوير مكلف.",
    "landingPage.features.f4_api1": "مفاهيم",
    "landingPage.features.f4_desc":
      "مفاهيم صور مصغرة عالية التباين — جذابة للنقر ومتسقة مع العلامة.",
    "landingPage.features.f5_api0": "في الوقت الفعلي",
    "landingPage.features.f5_desc":
      "بث مباشر دون إظهار وجهك الحقيقي — شخصية AI على TikTok وYouTube وInstagram.",
    "landingPage.features.f6_api1": "تحليل",
    "landingPage.features.f6_api2": "تحسين",
    "landingPage.features.f6_desc":
      "Viral Score للسكربتات والأفكار — توصيات مبنية على البيانات قبل الرفع.",
    "landingPage.features.headline1": "ستة Flows.",
    "landingPage.features.headline2": "استوديو واحد.",
    "landingPage.features.kicker": "جميع الوحدات",
    "landingPage.features.sidebar":
      "بدون فوضى أدوات. كل شيء لمحتوى AI في منصة واحدة.",
  },
};

function setByPath(obj, pathKey, value) {
  const parts = pathKey.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, pathKey));
    } else if (typeof value === "string") {
      out[pathKey] = value;
    }
  }
  return out;
}

function deepMerge(base, override) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof out[key] === "object" &&
      out[key] !== null &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

const deTree = JSON.parse(fs.readFileSync(path.join(messagesDir, "de.json"), "utf-8"));
const enTree = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf-8"));

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  let messages = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Ensure full key tree: de structure → English fallback → locale overrides
  messages = deepMerge(deTree, deepMerge(enTree, messages));

  const patch = PATCHES[locale] ?? {};
  let count = 0;

  for (const [pathKey, value] of Object.entries(patch)) {
    setByPath(messages, pathKey, value);
    count++;
  }

  const de = flatten(deTree);
  const en = flatten(enTree);
  const flat = flatten(messages);

  // Keys still identical to German (but English differs) → use English fallback
  for (const [pathKey, deVal] of Object.entries(de)) {
    const enVal = en[pathKey];
    const locVal = flat[pathKey];
    if (!enVal || enVal === deVal) continue;
    if (locVal === deVal && !patch[pathKey]) {
      setByPath(messages, pathKey, enVal);
      count++;
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`, "utf-8");
  console.log(`✓ ${locale}.json — ${count} patch/fallback updates`);
}

console.log("\nDone. Run: npm run i18n:check && npm run i18n:audit");

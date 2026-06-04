import fs from "fs";

const langs = ["es", "fr", "pt", "tr", "ar", "el"];

const navAgent = {
  es: "Agente IA",
  fr: "Agent IA",
  pt: "Agente IA",
  tr: "Yapay Zeka Ajanı",
  ar: "وكيل الذكاء",
  el: "AI Agent",
};

const agent = {
  es: {
    page_title: "InfluexAI Master Agent",
    page_subtitle: "Tu estratega personal de YouTube.",
    welcome_title: "¿Qué quieres crear?",
    welcome_subtitle: "Describe tu objetivo. El agente planifica y ejecuta las herramientas.",
    input_placeholder: "ej. Quiero un video sobre impuestos cripto…",
    send: "Enviar",
    thinking: "El agente trabaja…",
    cost_estimate: "Este run cuesta {label}",
    credits_left: "{count} créditos restantes",
    chip_niche_video: "Idea de video para un nicho",
    chip_plan_three: "Planificar mis próximos 3 videos",
    chip_competitor: "Analizar competencia",
    chip_viral_score: "Viral score de mi script",
  },
  fr: {
    page_title: "InfluexAI Master Agent",
    page_subtitle: "Ton stratège YouTube personnel.",
    welcome_title: "Que veux-tu créer ?",
    welcome_subtitle: "Décris ton objectif. L'agent planifie et exécute les outils.",
    input_placeholder: "ex. Je veux une vidéo sur les impôts crypto…",
    send: "Envoyer",
    thinking: "L'agent travaille…",
    cost_estimate: "Ce run coûte {label}",
    credits_left: "{count} crédits restants",
    chip_niche_video: "Idée vidéo pour une niche",
    chip_plan_three: "Planifier mes 3 prochaines vidéos",
    chip_competitor: "Analyser la concurrence",
    chip_viral_score: "Viral score de mon script",
  },
  pt: {
    page_title: "InfluexAI Master Agent",
    page_subtitle: "O teu estratega pessoal de YouTube.",
    welcome_title: "O que queres criar?",
    welcome_subtitle: "Descreve o objetivo. O agente planifica e executa as ferramentas.",
    input_placeholder: "ex. Quero um vídeo sobre impostos cripto…",
    send: "Enviar",
    thinking: "O agente está a trabalhar…",
    cost_estimate: "Este run custa {label}",
    credits_left: "{count} créditos restantes",
    chip_niche_video: "Ideia de vídeo para um nicho",
    chip_plan_three: "Planear os próximos 3 vídeos",
    chip_competitor: "Analisar concorrência",
    chip_viral_score: "Viral score do meu script",
  },
  tr: {
    page_title: "InfluexAI Master Agent",
    page_subtitle: "Kişisel YouTube stratejistin.",
    welcome_title: "Ne oluşturmak istiyorsun?",
    welcome_subtitle: "Hedefini anlat. Ajan araçları planlar ve çalıştırır.",
    input_placeholder: "örn. Kripto vergileri hakkında video…",
    send: "Gönder",
    thinking: "Ajan çalışıyor…",
    cost_estimate: "Bu run {label}",
    credits_left: "{count} kredi kaldı",
    chip_niche_video: "Niş için video fikri",
    chip_plan_three: "Sonraki 3 videoyu planla",
    chip_competitor: "Rakipleri analiz et",
    chip_viral_score: "Script viral skoru",
  },
  ar: {
    page_title: "InfluexAI Master Agent",
    page_subtitle: "استراتيجي YouTube الشخصي.",
    welcome_title: "ماذا تريد إنشاءه؟",
    welcome_subtitle: "صف هدفك. الوكيل يخطط وينفذ الأدوات.",
    input_placeholder: "مثال: فيديو عن ضرائب الكريبتو…",
    send: "إرسال",
    thinking: "الوكيل يعمل…",
    cost_estimate: "التكلفة {label}",
    credits_left: "{count} رصيد متبقي",
    chip_niche_video: "فكرة فيديو لنيش",
    chip_plan_three: "خطط لـ 3 فيديوهات",
    chip_competitor: "تحليل المنافسين",
    chip_viral_score: "Viral score للسكربت",
  },
  el: {
    page_title: "InfluexAI Master Agent",
    page_subtitle: "Ο προσωπικός σου YouTube στρατηγός.",
    welcome_title: "Τι θέλεις να δημιουργήσεις;",
    welcome_subtitle: "Περίγραψε τον στόχο. Ο agent σχεδιάζει και εκτελεί εργαλεία.",
    input_placeholder: "π.χ. Θέλω βίντεο για φόρους crypto…",
    send: "Αποστολή",
    thinking: "Ο agent δουλεύει…",
    cost_estimate: "Κόστος {label}",
    credits_left: "{count} credits απομένουν",
    chip_niche_video: "Ιδέα βίντεο για niche",
    chip_plan_three: "Σχεδίασε τα επόμενα 3 βίντεο",
    chip_competitor: "Ανάλυση ανταγωνισμού",
    chip_viral_score: "Viral score script",
  },
};

for (const lang of langs) {
  const p = `messages/${lang}.json`;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.nav = { agent: navAgent[lang], ...j.nav };
  j.agent = agent[lang];
  j.dashboard = {
    ...j.dashboard,
    quick_agent: lang === "es" ? "Agente" : lang === "fr" ? "Agent" : lang === "pt" ? "Agente" : lang === "tr" ? "Ajan" : lang === "ar" ? "وكيل" : "Agent",
  };
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log("ok", lang);
}

export type GreetingLocale =
  | "de"
  | "en"
  | "el"
  | "tr"
  | "es"
  | "fr"
  | "ar"
  | "pt";

const greetingSets: Record<
  GreetingLocale,
  {
    night: string;
    morning: string;
    midday: string;
    afternoon: string;
    evening: string;
  }
> = {
  de: {
    night: "Gute Nacht",
    morning: "Guten Morgen",
    midday: "Guten Mittag",
    afternoon: "Guten Tag",
    evening: "Guten Abend",
  },
  en: {
    night: "Good night",
    morning: "Good morning",
    midday: "Good afternoon",
    afternoon: "Good afternoon",
    evening: "Good evening",
  },
  el: {
    night: "Καλή νύχτα",
    morning: "Καλημέρα",
    midday: "Καλημέρα",
    afternoon: "Καλησπέρα",
    evening: "Καλησπέρα",
  },
  tr: {
    night: "İyi geceler",
    morning: "Günaydın",
    midday: "İyi günler",
    afternoon: "İyi günler",
    evening: "İyi akşamlar",
  },
  es: {
    night: "Buenas noches",
    morning: "Buenos días",
    midday: "Buenas tardes",
    afternoon: "Buenas tardes",
    evening: "Buenas noches",
  },
  fr: {
    night: "Bonne nuit",
    morning: "Bonjour",
    midday: "Bon après-midi",
    afternoon: "Bon après-midi",
    evening: "Bonsoir",
  },
  ar: {
    night: "تصبح على خير",
    morning: "صباح الخير",
    midday: "مساء الخير",
    afternoon: "مساء الخير",
    evening: "مساء الخير",
  },
  pt: {
    night: "Boa noite",
    morning: "Bom dia",
    midday: "Boa tarde",
    afternoon: "Boa tarde",
    evening: "Boa noite",
  },
};

const subtextSets: Record<
  GreetingLocale,
  {
    morning: string;
    midday: string;
    afternoon: string;
    evening: string;
    night: string;
  }
> = {
  de: {
    morning: "Was erstellst du heute?",
    midday: "Zeit für neuen Content.",
    afternoon: "Deine nächste Creation wartet.",
    evening: "Noch schnell einen Short erstellen?",
    night: "Noch spät am Werk? Lass die KI helfen.",
  },
  en: {
    morning: "What are you creating today?",
    midday: "Time for new content.",
    afternoon: "Your next creation is waiting.",
    evening: "Quick — create one more short?",
    night: "Working late? Let the AI help.",
  },
  el: {
    morning: "Τι δημιουργείς σήμερα;",
    midday: "Ώρα για νέο περιεχόμενο.",
    afternoon: "Η επόμενη creation σε περιμένει.",
    evening: "Ένα ακόμα short πριν κοιμηθείς;",
    night: "Αργά το βράδυ; Άσε το AI να βοηθήσει.",
  },
  tr: {
    morning: "Bugün ne üreteceksin?",
    midday: "Yeni içerik zamanı.",
    afternoon: "Sıradaki creation seni bekliyor.",
    evening: "Bir short daha?",
    night: "Geç mi kaldın? AI yardım etsin.",
  },
  es: {
    morning: "¿Qué crearás hoy?",
    midday: "Hora de nuevo contenido.",
    afternoon: "Tu próxima creation te espera.",
    evening: "¿Un short más antes de dormir?",
    night: "¿Trabajando tarde? Deja que la IA ayude.",
  },
  fr: {
    morning: "Que vas-tu créer aujourd'hui ?",
    midday: "C'est l'heure du nouveau contenu.",
    afternoon: "Ta prochaine creation t'attend.",
    evening: "Encore un short rapidement ?",
    night: "Encore au travail ? Laisse l'IA aider.",
  },
  ar: {
    morning: "ماذا ستنشئ اليوم؟",
    midday: "وقت محتوى جديد.",
    afternoon: "إبداعك التالي بانتظارك.",
    evening: "short آخر قبل النوم؟",
    night: "تعمل متأخراً؟ دع الذكاء الاصطناعي يساعد.",
  },
  pt: {
    morning: "O que vais criar hoje?",
    midday: "Hora de conteúdo novo.",
    afternoon: "A tua próxima creation espera.",
    evening: "Mais um short rapidamente?",
    night: "Ainda acordado? Deixa a IA ajudar.",
  },
};

function resolveLocale(locale: string): GreetingLocale {
  if (locale in greetingSets) return locale as GreetingLocale;
  return "de";
}

/** 6–11 Morgen · 12–17 Tag · 18–21 Abend · 22–5 Nacht */
function timeBucket(hour: number): "night" | "morning" | "afternoon" | "evening" {
  if (hour >= 22 || hour < 6) return "night";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

export function getGreeting(locale: string = "de"): string {
  const set = greetingSets[resolveLocale(locale)];
  return set[timeBucket(new Date().getHours())];
}

export function getGreetingEmoji(): string {
  const bucket = timeBucket(new Date().getHours());
  if (bucket === "night") return "🌙";
  if (bucket === "morning") return "☀️";
  if (bucket === "afternoon") return "⚡";
  return "🌆";
}

export function getGreetingSubtext(locale: string = "de"): string {
  const set = subtextSets[resolveLocale(locale)];
  const bucket = timeBucket(new Date().getHours());
  if (bucket === "night") return set.night;
  if (bucket === "morning") return set.morning;
  if (bucket === "afternoon") return set.afternoon;
  if (bucket === "evening") return set.evening;
  return set.afternoon;
}

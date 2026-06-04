import fs from "fs";
import path from "path";

const dir = "messages";

const catKeys = [
  "portrait",
  "creator",
  "cinematic",
  "product",
  "thumbnail",
  "avatar",
  "background",
  "lifestyle",
  "viral",
  "darknoir",
];

const base = {
  title: "Bild Generator",
  subtitle:
    "Acid Noir Text-to-Image — Standard mit FLUX Dev, High-Res mit FLUX Pro. Wasserzeichen bis Download freigeschaltet.",
  prompt_label: "Beschreibe dein Bild…",
  prompt_placeholder:
    "z.B. Female content creator am dunklen Desk, grünes Neonlicht, MacBook…",
  category_label: "Kategorie",
  format_label: "Format",
  format_1_1: "1:1",
  format_16_9: "16:9",
  format_9_16: "9:16",
  format_4_3: "4:3",
  generate_standard: "Generieren — 1 Credit",
  generate_highres: "High-Res — 3 Credits",
  upscale_button: "Upscalen 2x — 2 Credits",
  download_button: "Herunterladen — 1 Credit",
  download_ready: "Download freigeschaltet",
  download_file: "Datei speichern",
  variation_button: "Variation erstellen — 1 Credit",
  regenerate: "Nochmal generieren",
  loading_standard: "Generiere Bild…",
  loading_highres: "High-Res wird erstellt…",
  loading_upscale: "Upscale läuft…",
  loading_download: "Freischalten…",
  loading_variation: "Variation…",
  preview_empty: "Dein Bild erscheint hier",
  result_alt: "Generiertes Bild",
  compare_before: "Original",
  compare_after: "Upscaled 2x",
  variation_a: "Version A",
  variation_b: "Version B",
  history_title: "Letzte Generierungen",
  info_resolution: "{w}×{h}px",
  info_model: "Modell: {model}",
  info_time: "{sec}s",
  error_missing_prompt: "Bitte gib eine Beschreibung ein.",
  error_generic: "Generierung fehlgeschlagen.",
  error_upscale: "Upscale fehlgeschlagen.",
  error_download: "Download-Freischaltung fehlgeschlagen.",
  cat_portrait: "Portrait",
  cat_creator: "Content Creator",
  cat_cinematic: "Cinematic",
  cat_product: "Produkt",
  cat_thumbnail: "Thumbnail",
  cat_avatar: "KI Avatar",
  cat_background: "Hintergrund",
  cat_lifestyle: "Lifestyle",
  cat_viral: "Viral Content",
  cat_darknoir: "Dark Noir",
};

const locales = {
  en: {
    ...base,
    title: "Image Generator",
    subtitle:
      "Acid Noir text-to-image — Standard with FLUX Dev, High-Res with FLUX Pro. Watermark until download unlocked.",
    prompt_label: "Describe your image…",
    prompt_placeholder:
      "e.g. Female content creator at a dark desk, green neon light, MacBook…",
    category_label: "Category",
    format_label: "Format",
    generate_standard: "Generate — 1 Credit",
    generate_highres: "High-Res — 3 Credits",
    upscale_button: "Upscale 2x — 2 Credits",
    download_button: "Download — 1 Credit",
    download_ready: "Download unlocked",
    download_file: "Save file",
    variation_button: "Create variation — 1 Credit",
    regenerate: "Generate again",
    loading_standard: "Generating…",
    loading_highres: "Creating high-res…",
    preview_empty: "Your image appears here",
    history_title: "Recent generations",
    cat_product: "Product",
    cat_darknoir: "Dark Noir",
  },
  el: {
    title: "Γεννήτρια Εικόνων",
    subtitle: "Text-to-image — Standard 1 Credit, High-Res 3 Credits.",
    prompt_label: "Περιγραφή…",
    generate_standard: "Δημιουργία — 1 Credit",
    generate_highres: "High-Res — 3 Credits",
    cat_darknoir: "Dark Noir",
  },
  es: {
    title: "Generador de Imágenes",
    subtitle: "Texto a imagen — estándar 1 crédito, alta resolución 3.",
    prompt_label: "Describe tu imagen…",
    generate_standard: "Generar — 1 crédito",
    generate_highres: "Alta res — 3 créditos",
    cat_product: "Producto",
  },
  fr: {
    title: "Générateur d'Images",
    subtitle: "Texte vers image — standard 1 crédit, HD 3 crédits.",
    prompt_label: "Décris ton image…",
    generate_standard: "Générer — 1 crédit",
    generate_highres: "HD — 3 crédits",
    cat_product: "Produit",
  },
  pt: {
    title: "Gerador de Imagens",
    subtitle: "Texto para imagem — padrão 1 crédito, HD 3 créditos.",
    generate_standard: "Gerar — 1 crédito",
    generate_highres: "HD — 3 créditos",
  },
  tr: {
    title: "Görsel Oluşturucu",
    subtitle: "Metinden görsele — standart 1 kredi, HD 3 kredi.",
    generate_standard: "Oluştur — 1 kredi",
    generate_highres: "HD — 3 kredi",
  },
  ar: {
    title: "مولّد الصور",
    subtitle: "نص إلى صورة — عادي رصيد واحد، عالي الدقة 3.",
    generate_standard: "إنشاء — رصيد واحد",
    generate_highres: "عالي الدقة — 3 رصيد",
  },
};

function merge(baseObj, patch) {
  return { ...baseObj, ...patch };
}

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const lang = file.replace(".json", "");
  const p = path.join(dir, file);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const patch = lang === "de" ? base : locales[lang] ?? locales.en;
  j.imageGenerator = merge(base, patch);
  for (const k of catKeys) {
    if (!j.imageGenerator[`cat_${k}`]) {
      j.imageGenerator[`cat_${k}`] = base[`cat_${k}`] ?? k;
    }
  }
  j.flows = j.flows ?? {};
  j.flows.image_generator = {
    title: j.imageGenerator.title,
    description:
      lang === "de"
        ? "10 Kategorien · FLUX Dev & Pro · Upscaler"
        : "10 categories · FLUX Dev & Pro · Upscaler",
  };
  j.nav = j.nav ?? {};
  j.nav.image_generator =
    lang === "de"
      ? "Bild Generator"
      : lang === "en"
        ? "Image Generator"
        : j.imageGenerator.title;
  fs.writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`);
  console.log("updated", lang);
}

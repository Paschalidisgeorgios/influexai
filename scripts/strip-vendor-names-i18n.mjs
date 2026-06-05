/**
 * Remove vendor names from message JSON files.
 * Run: node scripts/strip-vendor-names-i18n.mjs
 */
import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "messages");

const fluxDesc = {
  el: "10 κατηγορίες · Standard & High-Res · Upscaler",
  tr: "10 kategori · Standart & Yüksek Çözünürlük · Upscaler",
  es: "10 Categorías · Estándar y Alta resolución · Upscaler",
  fr: "10 catégories · Standard et HD · Upscaler",
  pt: "10 Categorias · Padrão e Alta resolução · Upscaler",
  ar: "10 فئات · قياسي وعالي الدقة · محسّن الدقة",
};

const trNoAvatars =
  "Avatar bulunamadı. Bir preset seç veya kendi görselini yükle.";

for (const loc of ["el", "tr", "es", "fr", "pt", "ar"]) {
  const file = path.join(dir, `${loc}.json`);
  let s = fs.readFileSync(file, "utf8");

  if (fluxDesc[loc]) {
    s = s.replace(/10 [^\n"]*FLUX Dev & Pro[^\n"]*/g, fluxDesc[loc]);
  }

  s = s.replace(
    /Acid Noir metinden görsele — Standart FLUX Dev, yüksek çözünürlük FLUX Pro\. İndirme açılana kadar filigran\./,
    "Acid Noir metinden görsele — standart ve yüksek çözünürlük modları. İndirme açılana kadar filigran."
  );

  s = s.replace(/Live Portrait/g, "KI-Technologie");

  if (loc === "tr") {
    s = s.replace(
      /No avatars found\. Create one in Akool or set AKOOL_DEFAULT_AVATAR_ID\./g,
      trNoAvatars
    );
  }

  fs.writeFileSync(file, s);
  console.log(`✓ ${loc}.json`);
}

/**
 * promptOptimizer.ts — InfluexAI Prompt Enhancement Engine
 *
 * Zwei Kern-Funktionen:
 *  - optimizeUserPrompt()    → Deutsch-Erkennung, Übersetzung, Modell-spezifisches
 *                              Cinematic-Enhancement, Aspect-Ratio-Injection
 *  - calculateExactCredits() → Exakte Credit-Kosten pro Tool + Modell
 *
 * Für vollständige Übersetzungsqualität in Production: DeepL/Google Translate API
 * einbinden und den `applyGermanDictionary`-Aufruf ersetzen.
 */

import type { ToolId } from "@/components/dashboard/core/DashboardLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OptimizedPromptResult {
  original:        string;
  optimized:       string;
  wasGerman:       boolean;
  creditsRequired: number;
  enhancements:    string[];
}

// ─── German Detection ─────────────────────────────────────────────────────────

const GERMAN_CHARS_RE  = /[äöüÄÖÜß]/;
const GERMAN_STOPWORDS = new Set([
  "und","oder","mit","für","ein","eine","einer","eines","dem","den","des",
  "der","die","das","ist","sind","war","wird","nicht","bitte","erstelle",
  "generiere","zeige","schreibe","mache","von","zu","auf","an","im","am",
  "um","aber","auch","noch","sehr","wenn","dann","über","unter","nach",
  "vor","durch","beim","zum","zur","etwas","mehr","viele","alle","eine",
  "bild","foto","video","szene","person","mann","frau","hintergrund",
  "kamera","licht","schatten","farbe","stil","qualität","auflösung",
  "bei","nacht","morgen","abend","tag","regen","sonne","himmel","welt",
  "ein","einer","eine","eines","sich","hat","haben","kann","wird","soll",
]);

function isGerman(text: string): boolean {
  if (GERMAN_CHARS_RE.test(text)) return true;
  const words = text.toLowerCase().split(/\s+/);
  const germanWordCount = words.filter((w) => GERMAN_STOPWORDS.has(w)).length;
  return germanWordCount >= 2 || (words.length <= 5 && germanWordCount >= 1);
}

// ─── Umlaut normalizer ────────────────────────────────────────────────────────

const UMLAUT_MAP: Record<string, string> = {
  "ä":"ae","ö":"oe","ü":"ue","ß":"ss",
  "Ä":"Ae","Ö":"Oe","Ü":"Ue",
};

function normalizeUmlauts(text: string): string {
  return text.replace(/[äöüÄÖÜß]/g, (c) => UMLAUT_MAP[c] ?? c);
}

// ─── German → English dictionary (massiv erweitert) ──────────────────────────
//
// Reihenfolge wichtig: längere Phrasen vor einzelnen Wörtern
//

const GERMAN_PHOTO_DICT: [RegExp, string][] = [
  // ── Phrasen (immer zuerst) ──────────────────────────────────────────────────
  [/\bein bild von\b/gi,          "a photo of"],
  [/\bein foto von\b/gi,          "a photo of"],
  [/\bein video von\b/gi,         "a video of"],
  [/\bein portrait von\b/gi,      "a portrait of"],
  [/\beine szene mit\b/gi,        "a scene with"],
  [/\bein mann der\b/gi,          "a man who is"],
  [/\beine frau die\b/gi,         "a woman who is"],
  [/\bbei sonnenuntergang\b/gi,   "at sunset"],
  [/\bbei sonnenaufgang\b/gi,     "at sunrise"],
  [/\bbei nacht\b/gi,             "at night"],
  [/\bim regen\b/gi,              "in the rain"],
  [/\bim nebel\b/gi,              "in the fog"],
  [/\bim schnee\b/gi,             "in the snow"],
  [/\bim wald\b/gi,               "in the forest"],
  [/\bim all\b/gi,                "in outer space"],
  [/\bim weltall\b/gi,            "in outer space"],
  [/\bin der wüste\b/gi,          "in the desert"],
  [/\bauf dem meer\b/gi,          "on the ocean"],
  [/\bauf dem wasser\b/gi,        "on the water"],
  [/\bauf einer straße\b/gi,      "on a street"],
  [/\bhohe qualität\b/gi,         "high quality"],
  [/\bhohe auflösung\b/gi,        "high resolution"],
  [/\bumgeben von\b/gi,           "surrounded by"],
  [/\bvon oben\b/gi,              "aerial view"],
  [/\bvon unten\b/gi,             "low angle view"],
  [/\bvon vorne\b/gi,             "front view"],
  [/\bvon der seite\b/gi,         "side view"],
  [/\bschwarze und weiße\b/gi,    "black and white"],
  [/\bschwarz-weiß\b/gi,         "black and white"],
  [/\bnahaufnahme von\b/gi,       "close-up of"],
  [/\bweitwinkel\b/gi,            "wide-angle shot"],
  [/\bvogelperspektive\b/gi,      "bird's-eye view"],
  [/\bfroschperspektive\b/gi,     "worm's-eye view"],
  [/\bgoldene stunde\b/gi,        "golden hour"],
  [/\bblaue stunde\b/gi,          "blue hour"],
  [/\bneon licht\b/gi,            "neon light"],
  [/\bneon-licht\b/gi,            "neon light"],
  [/\bneonlichter\b/gi,           "neon lights"],
  [/\bholographisch\b/gi,         "holographic"],
  [/\bdoppelbelichtung\b/gi,      "double exposure"],
  [/\btilt-shift\b/gi,            "tilt-shift photography"],
  [/\blangzeitbelichtung\b/gi,    "long exposure photography"],
  [/\btiefenschärfe\b/gi,         "shallow depth of field"],
  [/\bstudio beleuchtung\b/gi,    "professional studio lighting"],
  [/\bstudio-beleuchtung\b/gi,    "professional studio lighting"],
  [/\bnatürliches licht\b/gi,     "natural lighting"],
  [/\bdramatische beleuchtung\b/gi,"dramatic lighting"],
  [/\bweiches licht\b/gi,         "soft diffused light"],
  [/\bhartes licht\b/gi,          "hard rim light"],
  [/\bin bewegung\b/gi,           "in motion"],
  [/\bkamerafahrt nach rechts\b/gi,"camera panning right"],
  [/\bkamerafahrt nach links\b/gi, "camera panning left"],
  [/\bsanfter zoom\b/gi,          "slow cinematic zoom"],
  [/\bheranzoomen\b/gi,           "zooming in"],
  [/\bherauszoomen\b/gi,          "zooming out"],

  // ── Einzelne Nomen (Orte & Umgebungen) ──────────────────────────────────────
  [/\bsonnenuntergang\b/gi,       "sunset"],
  [/\bsonnenaufgang\b/gi,         "sunrise"],
  [/\bsonnenstrahl(en)?\b/gi,     "sun rays"],
  [/\bwolkenkratzer\b/gi,         "skyscraper"],
  [/\bdachterrasse\b/gi,          "rooftop terrace"],
  [/\bmetropolis\b/gi,            "futuristic metropolis"],
  [/\bgroßstadt\b/gi,             "big city"],
  [/\bvorstadt\b/gi,              "suburb"],
  [/\blandschaft\b/gi,            "landscape"],
  [/\bwüste\b/gi,                 "desert"],
  [/\bdschungel\b/gi,             "jungle"],
  [/\bwaldlichtung\b/gi,          "forest clearing"],
  [/\bwaterfälle?\b/gi,           "waterfall"],
  [/\bwasserfall\b/gi,            "waterfall"],
  [/\bgletscher\b/gi,             "glacier"],
  [/\bvulkan\b/gi,                "volcano"],
  [/\bhöhle\b/gi,                 "cave"],
  [/\bburgruine\b/gi,             "castle ruins"],
  [/\btempel\b/gi,                "ancient temple"],
  [/\bkathedrale\b/gi,            "cathedral"],
  [/\bbrücke\b/gi,                "bridge"],
  [/\btunnel\b/gi,                "tunnel"],
  [/\bhafen\b/gi,                 "harbor"],
  [/\bstrand\b/gi,                "beach"],
  [/\bozean\b/gi,                 "ocean"],
  [/\bmeer\b/gi,                  "sea"],
  [/\bwellen\b/gi,                "waves"],
  [/\bkorallen\b/gi,              "coral reef"],
  [/\bunter wasser\b/gi,          "underwater"],
  [/\bweltraum\b/gi,              "outer space"],
  [/\bplanet\b/gi,                "planet"],
  [/\bgalaxie\b/gi,               "galaxy"],
  [/\bnebula\b/gi,                "nebula"],
  [/\bastronauten?\b/gi,          "astronaut"],
  [/\braumschiff\b/gi,            "spaceship"],
  [/\bkokpit\b/gi,                "cockpit"],
  [/\bfuturistisch(e|er|em|en|es)?\b/gi, "futuristic"],
  [/\bzukunftsstadt\b/gi,         "futuristic city"],
  [/\bcyberpunk\b/gi,             "cyberpunk"],
  [/\bsteampunk\b/gi,             "steampunk"],
  [/\bbiopunk\b/gi,               "biopunk"],
  [/\bapokalyptisch\b/gi,         "post-apocalyptic"],

  // ── Einzelne Nomen (Personen & Charaktere) ──────────────────────────────────
  [/\bporträt\b/gi,               "portrait"],
  [/\bselbstporträt\b/gi,         "self-portrait"],
  [/\bsportwagen\b/gi,            "sports car"],
  [/\bmotorrad\b/gi,              "motorcycle"],
  [/\bsoldat\b/gi,                "soldier"],
  [/\bkrieger\b/gi,               "warrior"],
  [/\bheld\b/gi,                  "hero"],
  [/\bheldin\b/gi,                "heroine"],
  [/\bprinzessin\b/gi,            "princess"],
  [/\bprinz\b/gi,                 "prince"],
  [/\bkönig\b/gi,                 "king"],
  [/\bkönigin\b/gi,               "queen"],
  [/\bzauberer\b/gi,              "wizard"],
  [/\bhexe\b/gi,                  "witch"],
  [/\bdrache\b/gi,                "dragon"],
  [/\bphönix\b/gi,                "phoenix"],
  [/\bwolf\b/gi,                  "wolf"],
  [/\bwölfe\b/gi,                 "wolves"],
  [/\badler\b/gi,                 "eagle"],
  [/\blöwe\b/gi,                  "lion"],
  [/\btiger\b/gi,                 "tiger"],
  [/\bpanther\b/gi,               "panther"],
  [/\bhai\b/gi,                   "shark"],
  [/\bpferd\b/gi,                 "horse"],
  [/\bschmetterling\b/gi,         "butterfly"],
  [/\bschmetterlingen\b/gi,       "butterflies"],
  [/\broboter\b/gi,               "robot"],
  [/\bki-agent\b/gi,              "AI agent"],
  [/\bcyborg\b/gi,                "cyborg"],
  [/\belf\b/gi,                   "elf"],
  [/\bzwerg\b/gi,                 "dwarf"],

  // ── Einzelne Nomen (Materialien & Texturen) ──────────────────────────────────
  [/\bkristall\b/gi,              "crystal"],
  [/\bedelstein\b/gi,             "gemstone"],
  [/\bdiamant\b/gi,               "diamond"],
  [/\brubin\b/gi,                 "ruby"],
  [/\bsaphir\b/gi,                "sapphire"],
  [/\bsmaragd\b/gi,               "emerald"],
  [/\bmarmorwand\b/gi,            "marble wall"],
  [/\bmarmor\b/gi,                "marble"],
  [/\bholz\b/gi,                  "wood"],
  [/\bmetall\b/gi,                "metal"],
  [/\bstahl\b/gi,                 "steel"],
  [/\bchrom\b/gi,                 "chrome"],
  [/\bcarbon\b/gi,                "carbon fiber"],
  [/\bbambus\b/gi,                "bamboo"],
  [/\bkirschblüten\b/gi,          "cherry blossoms"],
  [/\beis\b/gi,                   "ice"],
  [/\bkristalleis\b/gi,           "crystal ice"],
  [/\bsand\b/gi,                  "sand"],
  [/\bfelsen\b/gi,                "rocks"],
  [/\blavafluß\b/gi,              "lava flow"],
  [/\blava\b/gi,                  "lava"],

  // ── Adjektive & Style ─────────────────────────────────────────────────────────
  [/\bschwebend\b/gi,             "levitating"],
  [/\bfliegend\b/gi,              "flying"],
  [/\bspringend\b/gi,             "leaping"],
  [/\bglänzend\b/gi,              "gleaming"],
  [/\bstrahlend\b/gi,             "radiant"],
  [/\bneblig\b/gi,                "misty"],
  [/\bverwittert\b/gi,            "weathered"],
  [/\bverlassen\b/gi,             "abandoned"],
  [/\bmystisch\b/gi,              "mystical"],
  [/\bmagisch\b/gi,               "magical"],
  [/\bsurreal\b/gi,               "surreal"],
  [/\babstrakt\b/gi,              "abstract"],
  [/\bgeometrisch\b/gi,           "geometric"],
  [/\borganisch\b/gi,             "organic"],
  [/\bindustriell\b/gi,           "industrial"],
  [/\burban\b/gi,                 "urban"],
  [/\bländlich\b/gi,              "rural"],
  [/\bexotisch\b/gi,              "exotic"],
  [/\btropisch\b/gi,              "tropical"],
  [/\barktisch\b/gi,              "arctic"],
  [/\bepisch\b/gi,                "epic"],
  [/\bsymmetrisch\b/gi,           "symmetrical"],
  [/\bmakro\b/gi,                 "macro photography"],
  [/\bkunstvoll\b/gi,             "intricate"],
  [/\bverspielt\b/gi,             "playful"],
  [/\bglamorös\b/gi,              "glamorous"],
  [/\bmyseriös\b/gi,              "mysterious"],
  [/\bbedrohlich\b/gi,            "menacing"],
  [/\bruhig\b/gi,                 "serene"],
  [/\bdynamisch\b/gi,             "dynamic"],
  [/\bexplosiv\b/gi,              "explosive"],
  [/\bleuchtend\b/gi,             "glowing"],
  [/\btransparent\b/gi,           "transparent"],
  [/\bdurchsichtig\b/gi,          "translucent"],
  [/\bgeisterhaft\b/gi,           "ghostly"],
  [/\bdüster\b/gi,                "dark and moody"],
  [/\bheiter\b/gi,                "cheerful"],
  [/\belegant\b/gi,               "elegant"],
  [/\bmodern\b/gi,                "modern"],
  [/\bvintage\b/gi,               "vintage"],
  [/\bretro\b/gi,                 "retro"],
  [/\bklassisch\b/gi,             "classic"],
  [/\bminimalistisch\b/gi,        "minimalist"],
  [/\bdramatisch\b/gi,            "dramatic"],

  // ── Farben ────────────────────────────────────────────────────────────────────
  [/\bschwarzweiß\b/gi,           "black and white"],
  [/\bschwarz\b/gi,               "black"],
  [/\bweiß\b/gi,                  "white"],
  [/\brot\b/gi,                   "red"],
  [/\bblau\b/gi,                  "blue"],
  [/\bgrün\b/gi,                  "green"],
  [/\bgelb\b/gi,                  "yellow"],
  [/\borange\b/gi,                "orange"],
  [/\blila\b/gi,                  "purple"],
  [/\bviolett\b/gi,               "violet"],
  [/\brosa\b/gi,                  "pink"],
  [/\bgrau\b/gi,                  "gray"],
  [/\bbraun\b/gi,                 "brown"],
  [/\bgold\b/gi,                  "gold"],
  [/\bsilber\b/gi,                "silver"],
  [/\bkupfer\b/gi,                "copper"],
  [/\btürkis\b/gi,                "teal"],
  [/\bkoralle\b/gi,               "coral"],
  [/\bcyan\b/gi,                  "cyan"],
  [/\bmagenta\b/gi,               "magenta"],
  [/\bkobaltblau\b/gi,            "cobalt blue"],
  [/\bernsteinfarben\b/gi,        "amber"],
  [/\belfenbein\b/gi,             "ivory"],
  [/\bscharlachrot\b/gi,          "scarlet"],

  // ── Licht & Wetter ────────────────────────────────────────────────────────────
  [/\bnacht\b/gi,                 "night"],
  [/\btag\b/gi,                   "day"],
  [/\bmorgen\b/gi,                "morning"],
  [/\babend\b/gi,                 "evening"],
  [/\bsonne\b/gi,                 "sun"],
  [/\bmond\b/gi,                  "moon"],
  [/\bsterne\b/gi,                "stars"],
  [/\bhimmel\b/gi,                "sky"],
  [/\bwolken\b/gi,                "clouds"],
  [/\bregen\b/gi,                 "rain"],
  [/\bgewitter\b/gi,              "thunderstorm"],
  [/\bblitz\b/gi,                 "lightning"],
  [/\bschnee\b/gi,                "snow"],
  [/\bnebel\b/gi,                 "fog"],
  [/\bwind\b/gi,                  "wind"],
  [/\bsturm\b/gi,                 "storm"],
  [/\bsonnenlicht\b/gi,           "sunlight"],
  [/\bmondlicht\b/gi,             "moonlight"],
  [/\bregenbogen\b/gi,            "rainbow"],
  [/\baurora\b/gi,                "aurora borealis"],
  [/\bsonnenflare\b/gi,           "lens flare"],

  // ── Feuer, Wasser, Elemente ───────────────────────────────────────────────────
  [/\bflammen\b/gi,               "flames"],
  [/\bfeuer\b/gi,                 "fire"],
  [/\brauch\b/gi,                 "smoke"],
  [/\basche\b/gi,                 "ash"],
  [/\bexplosion\b/gi,             "explosion"],
  [/\bwasser\b/gi,                "water"],
  [/\beis\b/gi,                   "ice"],
  [/\bdampf\b/gi,                 "steam"],
  [/\bnebel\b/gi,                 "mist"],
  [/\bstrom\b/gi,                 "stream"],
  [/\bblut\b/gi,                  "blood"],
  [/\benenergie\b/gi,             "energy"],
  [/\bmagie\b/gi,                 "magic"],
  [/\baura\b/gi,                  "aura"],
  [/\bplasma\b/gi,                "plasma"],
  [/\belektrizität\b/gi,          "electricity"],
  [/\blaser\b/gi,                 "laser beam"],
  [/\bstrahlen\b/gi,              "rays of light"],
  [/\bpartikel\b/gi,              "particles"],
  [/\bstaub\b/gi,                 "dust"],
  [/\bpollen\b/gi,                "pollen"],
  [/\bblüten\b/gi,                "flower petals"],
  [/\bbäume\b/gi,                 "trees"],
  [/\bblumen\b/gi,                "flowers"],
  [/\bgras\b/gi,                  "grass"],
  [/\bmoos\b/gi,                  "moss"],

  // ── Fotografie- & Video-Terminologie ─────────────────────────────────────────
  [/\bfoto\b/gi,                  "photo"],
  [/\bbild\b/gi,                  "image"],
  [/\bporträt\b/gi,               "portrait"],
  [/\bhintergrund\b/gi,           "background"],
  [/\bkamera\b/gi,                "camera"],
  [/\blicht\b/gi,                 "light"],
  [/\bschatten\b/gi,              "shadow"],
  [/\bbeleuchtung\b/gi,           "lighting"],
  [/\bstudio\b/gi,                "studio"],
  [/\bprodukt\b/gi,               "product"],
  [/\bmode\b/gi,                  "fashion"],
  [/\bscharf\b/gi,                "sharp"],
  [/\bdetailliert\b/gi,           "detailed"],
  [/\brealistisch\b/gi,           "realistic"],
  [/\bprofessionell\b/gi,         "professional"],
  [/\bkino\b/gi,                  "cinematic"],
  [/\bfilm\b/gi,                  "film"],
  [/\bbewegung\b/gi,              "motion"],
  [/\bzoom\b/gi,                  "zoom"],
  [/\bkamerafahrt\b/gi,           "camera pan"],
  [/\bperson\b/gi,                "person"],
  [/\bmann\b/gi,                  "man"],
  [/\bfrau\b/gi,                  "woman"],
  [/\bkind\b/gi,                  "child"],
  [/\bgesicht\b/gi,               "face"],
  [/\bstadt\b/gi,                 "city"],
  [/\bstraße\b/gi,                "street"],
  [/\bgebäude\b/gi,               "building"],
  [/\bnatur\b/gi,                 "nature"],
  [/\bwald\b/gi,                  "forest"],

  // ── Filler-Verben entfernen ───────────────────────────────────────────────────
  [/\bbitte\b/gi,                 ""],
  [/\bestelle\b/gi,               ""],
  [/\bgeneriere\b/gi,             ""],
  [/\berstelle\b/gi,              ""],
  [/\bschreibe\b/gi,              ""],
  [/\bmache\b/gi,                 ""],
  [/\bzeige\b/gi,                 "show"],
];

function applyGermanDictionary(text: string): string {
  let result = text;
  for (const [pattern, replacement] of GERMAN_PHOTO_DICT) {
    result = result.replace(pattern, replacement);
  }
  result = normalizeUmlauts(result);
  return result.replace(/\s{2,}/g, " ").trim();
}

// ─── Cinematic Suffix Strings ─────────────────────────────────────────────────

/**
 * Hochwertiger Cinematic-Suffix für Nano Banana Pro und Flux 2 Pro.
 * Das [aspect_ratio] wird dynamisch aus den Settings ersetzt.
 */
function buildImageCinematicSuffix(aspectRatio: string): string {
  return (
    ", award-winning cinematography, photorealistic, hyper-detailed skin textures, " +
    "volumetric moody lighting, shot on 35mm lens, masterfully color graded, " +
    "intricate details, 8k resolution, flawless composition, " +
    `professional studio lighting --ar ${aspectRatio}`
  );
}

/** Kürzerer Premium-Suffix für Nano Banana 2 */
const IMAGE_QUALITY_SUFFIX =
  ", high quality, ultra-sharp focus, professional photography, clean composition, " +
  "well-lit, high resolution, cinematic color grading";

/** Cinematic Video Suffix für Kling v3 4K */
const VIDEO_CINEMATIC_SUFFIX_KLING_V3 =
  ", ultra-high-fidelity video, cinematic fluid physics, natural motion blur, " +
  "volumetric light rays, stunning visual effects, 4k render, hyper-realistic details, " +
  "steady camera movement, masterfully directed short-film quality";

/** Basis Video Suffix für andere Kling-Modelle */
const VIDEO_QUALITY_SUFFIX_KLING =
  ", fluid motion, stable camera, natural movement, cinematic quality, clean transitions";

// ─── Model base keywords (vor dem Suffix, modell-spezifisch) ─────────────────

const MODEL_BASE_KWS: Record<string, string[]> = {
  "nano-banana-pro": [
    "RAW photo", "sharp crisp typography", "physically accurate rendering",
    "typographically precise",
  ],
  "nano-banana-2": [
    "high quality", "sharp focus", "clean composition",
  ],
  "flux-2-pro": [
    "DSLR photography", "shallow bokeh background", "high dynamic range",
    "professional color grading",
  ],
  "kling-v3-4k": [
    "temporal consistency", "smooth 60fps motion", "photorealistic characters",
    "no flicker",
  ],
  "kling-v2.5-turbo": [
    "fluid motion", "stable camera",
  ],
  "kling-v2-master": [
    "consistent character motion", "smooth physics",
  ],
};

// ─── Tool-specific Claude prefixes (text tools) ───────────────────────────────

const CLAUDE_SYSTEM_PREFIXES: Partial<Record<ToolId, string>> = {
  "viral-hook":
    "OUTPUT RULES: No preamble, no meta-commentary, no intros or outros. " +
    "Start immediately with Hook 1. Each hook max 2 sentences, numbered. " +
    "TASK: ",
  "content-calendar":
    "OUTPUT RULES: No preamble or commentary. Start with Monday directly. " +
    "Format: [Day]: [Format] | [Hook idea] | [Best posting time]. " +
    "TASK: ",
  "trend-script":
    "OUTPUT RULES: No introduction, no meta-text, start with the script. " +
    "Use [PAUSE] and [SCHNITT] markers. " +
    "TASK: ",
};

// ─── Main: optimizeUserPrompt ─────────────────────────────────────────────────

export async function optimizeUserPrompt(
  userPrompt: string,
  toolId: ToolId,
  settings?: Record<string, unknown> | null
): Promise<OptimizedPromptResult> {

  const enhancements: string[] = [];
  let working   = userPrompt.trim();
  const wasGerman = isGerman(working);

  // ── SCHRITT A: German Detection & Translation ─────────────────────────────
  if (wasGerman) {
    enhancements.push("🇩🇪 → 🇬🇧 Deutsch erkannt · Terminologie übersetzt");
    working = applyGermanDictionary(working);

    // Production: Replace with DeepL / Google Translate API:
    // const { translatedText } = await fetch("https://api-free.deepl.com/v2/translate", {
    //   method: "POST",
    //   body: new URLSearchParams({ auth_key: DEEPL_KEY, text: working, target_lang: "EN" }),
    // }).then(r => r.json());
    // working = translatedText;
  }

  // ── SCHRITT B: Text-Tools — Claude prefix ────────────────────────────────
  const isTextTool = ["viral-hook", "content-calendar", "trend-script"].includes(toolId);
  if (isTextTool) {
    const prefix = CLAUDE_SYSTEM_PREFIXES[toolId];
    if (prefix) {
      working = prefix + working;
      enhancements.push("Claude: Kein Intro/Outro-Modus aktiviert");
    }
    // Keine weiteren Bild/Video-Enhancements für Text-Tools
    return {
      original:        userPrompt,
      optimized:       working.replace(/\s{2,}/g, " ").replace(/,\s*,/g, ",").trim(),
      wasGerman,
      creditsRequired: calculateExactCredits(toolId, settings),
      enhancements,
    };
  }

  // ── SCHRITT C: Medien-Tools — Modell lesen ────────────────────────────────
  const modelId     = (settings?.model as string | undefined) ?? "";
  const aspectRatio = (settings?.aspectRatio as string | undefined) ?? "1:1";

  // ── IMAGE TOOLS (image-gen, img-to-img) ──────────────────────────────────
  const isImageTool = toolId === "image-gen" || toolId === "img-to-img";
  if (isImageTool) {

    // 1. Modell-Base-Keywords voranstellen
    const baseKws = MODEL_BASE_KWS[modelId];
    if (baseKws?.length) {
      working = `${working}, ${baseKws.join(", ")}`;
      enhancements.push(`🎨 ${modelId}: ${baseKws.length} Base-Keywords ergänzt`);
    }

    // 2. Cinematic-Suffix je nach Modell
    if (modelId === "nano-banana-pro" || modelId === "flux-2-pro") {
      const suffix = buildImageCinematicSuffix(aspectRatio);
      working += suffix;
      enhancements.push(
        `🎬 Cinematic-Suffix (${modelId}) + Aspect Ratio ${aspectRatio} injiziert`
      );
    } else if (modelId === "nano-banana-2" || modelId === "") {
      working += IMAGE_QUALITY_SUFFIX;
      enhancements.push("✨ Quality-Suffix für schnelle Generierung ergänzt");
    }

    return {
      original:        userPrompt,
      optimized:       working.replace(/\s{2,}/g, " ").replace(/,\s*,/g, ",").trim(),
      wasGerman,
      creditsRequired: calculateExactCredits(toolId, settings),
      enhancements,
    };
  }

  // ── VIDEO TOOLS (img-to-video, text-to-video) ────────────────────────────
  const isVideoTool = toolId === "img-to-video" || toolId === "text-to-video";
  if (isVideoTool) {

    // 1. Modell-Base-Keywords voranstellen
    const baseKws = MODEL_BASE_KWS[modelId];
    if (baseKws?.length) {
      working = `${working}, ${baseKws.join(", ")}`;
      enhancements.push(`🎥 ${modelId}: ${baseKws.length} Motion-Keywords ergänzt`);
    }

    // 2. Cinematic Video Suffix
    if (modelId === "kling-v3-4k") {
      working += VIDEO_CINEMATIC_SUFFIX_KLING_V3;
      enhancements.push("🎬 Kling v3 4K Cinematic-Video-Suffix injiziert");
    } else {
      // Alle anderen Kling-Modelle + Default
      working += VIDEO_QUALITY_SUFFIX_KLING;
      enhancements.push("🎥 Video-Qualitäts-Keywords ergänzt");
    }

    return {
      original:        userPrompt,
      optimized:       working.replace(/\s{2,}/g, " ").replace(/,\s*,/g, ",").trim(),
      wasGerman,
      creditsRequired: calculateExactCredits(toolId, settings),
      enhancements,
    };
  }

  // ── ANDERE MEDIEN-TOOLS (Akool, etc.) ────────────────────────────────────
  // Nur saubere Basis-Übersetzung, keine aggressiven Keywords
  return {
    original:        userPrompt,
    optimized:       working.replace(/\s{2,}/g, " ").replace(/,\s*,/g, ",").trim(),
    wasGerman,
    creditsRequired: calculateExactCredits(toolId, settings),
    enhancements,
  };
}

// ─── calculateExactCredits ────────────────────────────────────────────────────

const AKOOL_TOOLS = new Set<ToolId>([
  "face-swap-video", "character-swap", "char-studio-video", "avatar-video",
  "video-translation", "talking-avatar", "talking-photo", "ai-video-editor",
  "face-swap-image", "char-studio-image", "live-camera", "streaming-avatar",
  "live-face-swap", "akool-production", "holographic-avatar", "akool-edge",
  "ai-support-agent",
]);

const TEXT_TOOLS = new Set<ToolId>(["viral-hook"]);

export function calculateExactCredits(
  toolId: ToolId,
  settings?: Record<string, unknown> | null
): number {
  if (toolId === "gallery" || toolId === "settings") return 0;
  if (toolId === "content-calendar") return 2; // CONTENT_KALENDER_TOOL_CREDIT_COST
  if (toolId === "trend-script")     return 3; // TREND_SCRIPT_TOOL_CREDIT_COST
  if (TEXT_TOOLS.has(toolId)) return 1;

  if (toolId === "image-gen" || toolId === "img-to-img") {
    const model = (settings?.model as string) ?? "";
    if (model === "nano-banana-pro") return 5;
    if (model === "flux-2-pro")      return 5;
    return 3; // nano-banana-2 + defaults
  }

  if (toolId === "img-to-video" || toolId === "text-to-video") {
    const duration = (settings?.durationSeconds as number) ?? 5;
    return duration >= 10 ? 30 : 15;
  }

  if (toolId === "video-to-video" || toolId === "ref-to-video") return 15;
  if (AKOOL_TOOLS.has(toolId))                                   return 10;
  if (toolId === "ecommerce-ads")                                return 8;
  if (toolId === "tts" || toolId === "voice-clone" || toolId === "voice-changer") return 2;
  if (toolId === "jarvis-moderator")                             return 1;

  return 5;
}

// ─── Helper: format credit label for UI ──────────────────────────────────────

export function formatCreditCost(credits: number): string {
  if (credits === 0) return "Kostenlos";
  if (credits === 1) return "1 Credit";
  return `${credits} Credits`;
}

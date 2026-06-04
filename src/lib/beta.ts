export const BETA_MAX_SPOTS = 100;
export const SITE_URL = "https://influexaicreator.com";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBetaCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `BETA-${suffix}`;
}

export function firstNameOnly(name: string | null | undefined): string {
  if (!name?.trim()) return "Creator";
  return name.trim().split(/\s+/)[0];
}

export function relativeTimeDe(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

export const BETA_NICHES = [
  "Fitness & Gesundheit",
  "Tech & AI",
  "Kochen & Food",
  "Business & Finanzen",
  "Gaming",
  "Lifestyle & Vlogs",
  "Bildung & How-To",
  "Beauty & Mode",
  "Reisen",
  "Sonstiges",
];

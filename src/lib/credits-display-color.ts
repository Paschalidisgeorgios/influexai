export function creditsDisplayColor(credits: number): string {
  if (credits < 20) return "#ff6b7a";
  if (credits <= 50) return "#fbbf24";
  return "#F0EFE8";
}

export function creditsBadgeStyle(credits: number): {
  background: string;
  border: string;
} {
  if (credits < 20) {
    return {
      background: "rgba(255,107,122,0.12)",
      border: "1px solid rgba(255,107,122,0.35)",
    };
  }
  if (credits <= 50) {
    return {
      background: "rgba(251,191,36,0.1)",
      border: "1px solid rgba(251,191,36,0.35)",
    };
  }
  return {
    background: "rgba(180,255,0,0.1)",
    border: "1px solid rgba(180,255,0,0.28)",
  };
}

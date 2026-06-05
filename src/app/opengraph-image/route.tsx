import { ImageResponse } from "next/og";
import { OG_HEADLINES, SEO_BASE_URL } from "@/lib/seo";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/locale";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("lang") ?? defaultLocale;
  const lang: Locale = isValidLocale(raw) ? raw : defaultLocale;
  const headline = OG_HEADLINES[lang] ?? OG_HEADLINES.de;

  return new ImageResponse(
    <div
      style={{
        background: "#060608",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          color: "#B4FF00",
          fontSize: 56,
          fontWeight: 700,
          letterSpacing: "0.04em",
        }}
      >
        InfluexAI
      </div>
      <div
        style={{
          color: "#F0EFE8",
          fontSize: 38,
          fontWeight: 600,
          textAlign: "center",
          maxWidth: 820,
          lineHeight: 1.25,
          padding: "0 48px",
        }}
      >
        {headline}
      </div>
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 22, marginTop: 8 }}>
        {SEO_BASE_URL.replace("https://", "")}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}

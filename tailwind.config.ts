import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ["var(--font-bebas)", "Bebas Neue", "sans-serif"],
        inter: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        dm: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-dm)", "DM Mono", "monospace"],
      },
      colors: {
        acid: "#B4FF00",
        black: { DEFAULT: "#060608", 1: "#0f0f12", 2: "#18181d", 3: "#222228" },
        grey: "rgba(255,255,255,0.65)",
        readable: "rgba(255,255,255,0.85)",
        "readable-muted": "rgba(255,255,255,0.65)",
      },
      boxShadow: {
        "glow-acid": "0 0 32px rgba(180,255,0,0.18)",
        "glow-acid-sm": "0 6px 24px rgba(180,255,0,0.22)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        blink: "blink 2s infinite",
        ticker: "ticker-scroll 22s linear infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        scan: "scan-line 2.5s linear infinite",
        "fade-in-up": "fade-in-up 0.6s ease both",
        "spin-custom": "spin 0.8s linear infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "scan-line": {
          "0%": { top: "-2px" },
          "100%": { top: "calc(100% + 2px)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [
    function ({
      addVariant,
    }: {
      addVariant: (name: string, definition: string) => void;
    }) {
      addVariant("rtl", '[dir="rtl"] &');
      addVariant("ltr", '[dir="ltr"] &');
    },
  ],
};

export default config;

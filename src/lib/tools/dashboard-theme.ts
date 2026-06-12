import type { DashboardThemeKey } from "@/lib/tools/types";

export type DashboardThemeColors = {
  key: DashboardThemeKey;
  r: number;
  g: number;
  b: number;
  accent: string;
  onAccent: string;
};

export const DASHBOARD_THEME_COLORS: Record<DashboardThemeKey, DashboardThemeColors> = {
  green: {
    key: "green",
    r: 180,
    g: 255,
    b: 0,
    accent: "#B4FF00",
    onAccent: "#08080a",
  },
  blue: {
    key: "blue",
    r: 40,
    g: 160,
    b: 255,
    accent: "#28A0FF",
    onAccent: "#ffffff",
  },
  violet: {
    key: "violet",
    r: 160,
    g: 64,
    b: 255,
    accent: "#A040FF",
    onAccent: "#ffffff",
  },
};

export function getDashboardTheme(key: DashboardThemeKey): DashboardThemeColors {
  return DASHBOARD_THEME_COLORS[key] ?? DASHBOARD_THEME_COLORS.green;
}

export function applyDashboardThemeToRoot(theme: DashboardThemeColors): void {
  const root = document.documentElement;
  root.style.setProperty("--dash-theme-r", String(theme.r));
  root.style.setProperty("--dash-theme-g", String(theme.g));
  root.style.setProperty("--dash-theme-b", String(theme.b));
  root.style.setProperty("--dash-theme-accent", theme.accent);
  root.style.setProperty("--dash-theme-on-accent", theme.onAccent);
  root.style.setProperty(
    "--dash-theme-accent-08",
    `rgba(${theme.r},${theme.g},${theme.b},0.08)`
  );
  root.style.setProperty(
    "--dash-theme-accent-15",
    `rgba(${theme.r},${theme.g},${theme.b},0.15)`
  );
  root.style.setProperty(
    "--dash-theme-accent-25",
    `rgba(${theme.r},${theme.g},${theme.b},0.25)`
  );
  root.style.setProperty(
    "--dash-theme-accent-30",
    `rgba(${theme.r},${theme.g},${theme.b},0.3)`
  );
  root.style.setProperty(
    "--dash-theme-glow",
    `0 0 60px rgba(${theme.r},${theme.g},${theme.b},0.25), 0 0 120px rgba(${theme.r},${theme.g},${theme.b},0.08)`
  );
  root.style.setProperty(
    "--dash-theme-spotlight",
    `radial-gradient(ellipse at 50% 30%, rgba(${theme.r},${theme.g},${theme.b},0.14) 0%, transparent 65%)`
  );
}

export function dashboardThemeCssVars(
  theme: DashboardThemeColors
): Record<string, string> {
  return {
    ["--dash-theme-r" as string]: String(theme.r),
    ["--dash-theme-g" as string]: String(theme.g),
    ["--dash-theme-b" as string]: String(theme.b),
    ["--dash-theme-accent" as string]: theme.accent,
    ["--dash-theme-on-accent" as string]: theme.onAccent,
  };
}

const VISIT_KEY = "influex-visit-count";
const INSTALL_DISMISS_KEY = "influex-install-dismissed";

export function incrementVisitCount(): number {
  if (typeof window === "undefined") return 0;
  const prev = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10);
  const next = prev + 1;
  localStorage.setItem(VISIT_KEY, String(next));
  return next;
}

export function getVisitCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10);
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(INSTALL_DISMISS_KEY, "1");
}

export function isInstallDismissed(): boolean {
  return localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** True when the user is typing in a form field — canvas shortcuts should be suppressed. */
export function isEditableTarget(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return !!el.closest("input, textarea, select, [contenteditable='true']");
}

import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

/** Ensure once-based reveals complete if the trigger line was already crossed */
export function flushMissedScrollReveal(
  trigger: ScrollTrigger | null | undefined,
  targets: gsap.TweenTarget,
  endState: gsap.TweenVars
) {
  if (!trigger) return;

  const apply = () => {
    if (trigger.progress > 0) return;

    const triggerEl = trigger.trigger as Element | undefined;
    if (!triggerEl || !(triggerEl instanceof Element)) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportThreshold = window.innerHeight * 0.82;
    const passed = rect.top <= viewportThreshold;

    if (passed) {
      gsap.set(targets, endState);
    }
  };

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    apply();
  });

  window.setTimeout(() => {
    ScrollTrigger.refresh();
    apply();
  }, 360);
}

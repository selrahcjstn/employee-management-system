import { useEffect, useRef, useState } from 'react';

/** True when the person asked for less motion. Where `matchMedia` does not exist there is nothing to animate for. */
function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Counts from the number last shown to `target` over `durationMs`, easing out. The first time it
 * starts from 0; after that a changed target moves from where the number was. With reduced
 * motion it returns `target` at once. Returns a whole number: round money in centavos, not pesos.
 */
export function useCountUp(target: number, durationMs = 800): number {
  const reduced = prefersReducedMotion();
  const [animated, setAnimated] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const from = shown.current;
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
      const eased = 1 - (1 - progress) ** 3;
      shown.current = from + (target - from) * eased;
      setAnimated(Math.round(shown.current));
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  return reduced ? target : animated;
}

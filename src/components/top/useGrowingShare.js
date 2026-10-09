import { useEffect, useRef, useState } from 'react';

// Long enough to see, after the box's own opening zoom has finished.
const GROW_MS = 900;
const WAIT_MS = 150;

// The share a meter shows: with grow set it rises from 0 when the meter first
// appears (a box opening) and eases to each new reading after, settling at
// once for viewers who prefer reduced motion.
export function useGrowingShare(share, grow = true) {
  const target = Math.min(1, Math.max(0, Number(share) || 0));
  const [shown, setShown] = useState(grow ? 0 : target);
  const current = useRef(shown);
  useEffect(() => {
    if (!grow || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setShown(target);
      return undefined;
    }
    const from = current.current;
    const start = performance.now() + WAIT_MS;
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, Math.max(0, (now - start) / GROW_MS));
      // Ease in and out, so the start of the rise shows too.
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const value = from + (target - from) * eased;
      current.current = value;
      setShown(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, grow]);
  return shown;
}

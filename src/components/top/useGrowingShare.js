import { useEffect, useRef, useState } from 'react';

// Long enough to see, after the box's own opening zoom has finished.
const GROW_MS = 900;
const WAIT_MS = 150;

// The share a meter shows: with grow set it rises from 0 when the meter first
// appears (a box opening) and eases to each new reading after, settling at
// once for viewers who prefer reduced motion.
export function useGrowingShare(share, grow = true) {
  return useEasedValue(Math.min(1, Math.max(0, Number(share) || 0)), grow);
}

// The same for any number, such as a count or watts: up from 0 when it first
// appears, then easing to each new value.
export function useEasedValue(value, grow = true) {
  const target = Number(value) || 0;
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
      const next = from + (target - from) * eased;
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, grow]);
  return shown;
}

// A chart's series (numbers, with null for gaps) as drawn: it rises from the
// baseline when it first appears, and each time the values change (another
// view, new readings) every point glides from where it was to its new value.
// Gaps stay gaps. Viewers who prefer reduced motion get the values at once.
export function useMorphedSeries(values, duration = 650) {
  const [shown, setShown] = useState(() => values.map((value) => (value == null ? null : 0)));
  const current = useRef(shown);
  const target = useRef(values);
  target.current = values;
  const key = values.map((value) => (value == null ? '' : value.toFixed(4))).join(',');
  useEffect(() => {
    const goal = target.current;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      current.current = goal;
      setShown(goal);
      return undefined;
    }
    const from =
      current.current.length === goal.length ? current.current : goal.map((value) => (value == null ? null : 0));
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const next = goal.map((value, index) =>
        value == null ? null : (from[index] ?? 0) + (value - (from[index] ?? 0)) * eased,
      );
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [key, duration]);
  return shown;
}

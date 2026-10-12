import { useEffect, useState } from 'react';

// The bolt of a GPU's power icon (and the power key), and the three sparkles
// that twinkle round it once it is full, shared with the overview's power
// icon. Drawn on a 24 unit grid in currentColor.
export const BOLT_WITH_SPARKLES = 'M13 2 3 14h9l-1 8 10-12h-9l1-8z';
export const KEY_SPARKLES = [
  [20.8, 3.2, 3.6],
  [3.4, 20.6, 2.6],
  [21.2, 19.6, 1.9],
];

// A four-point sparkle centred on (x, y), drawn like the croissant's.
export function sparklePath(x, y, r) {
  const k = r * 0.12;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}

// Each sparkle waits a random while, BLINK_WAIT_MS, before every blink, so no
// two keep step. A new key restarts the blink's animation.
const BLINK_WAIT_MS = [1500, 6000];

export function Sparkle({ sparkle: [x, y, r], index }) {
  const [blinks, setBlinks] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timer;
    const wait = () => {
      timer = setTimeout(
        () => {
          setBlinks((count) => count + 1);
          wait();
        },
        BLINK_WAIT_MS[0] + Math.random() * (BLINK_WAIT_MS[1] - BLINK_WAIT_MS[0]),
      );
    };
    wait();
    return () => clearTimeout(timer);
  }, []);
  const box = { transformBox: 'fill-box', transformOrigin: 'center' };
  return (
    <g className="motion-safe:animate-sparkle-in" style={{ ...box, animationDelay: `${0.9 + index * 0.14}s` }}>
      <path
        key={blinks}
        d={sparklePath(x, y, r)}
        fill="currentColor"
        stroke="none"
        className={blinks ? 'motion-safe:animate-sparkle-blink' : undefined}
        style={box}
      />
    </g>
  );
}

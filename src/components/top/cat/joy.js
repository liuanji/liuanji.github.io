import { useEffect, useState } from 'react';

// Mochi's spirits for the day ("Mood" on her card), kept in this browser only:
// 0 to 100, starting each day afresh at JOY_START. Playing with her lifts
// them; left alone while she roams they slowly sink (JOY_FADE a minute), and a
// fright or a fall knocks them a little. Low, she mopes and may cry; high, she
// is playful (see BEHAVIOUR.md).
const KEY = 'gpu-status-cat-joy';
const EVENT = 'bakery-cat-joy';
export const JOY_START = 55;
export const JOY_FADE = 0.5;

// Today, in this browser's time zone: a new day starts her afresh.
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function readJoy() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
    if (saved && saved.day === today() && Number.isFinite(saved.value)) return saved.value;
  } catch {
    // Storage blocked or garbled: a fresh day.
  }
  return JOY_START;
}

export function changeJoy(delta) {
  const value = Math.max(0, Math.min(100, readJoy() + delta));
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ day: today(), value }));
  } catch {
    // Storage blocked: it lasts as long as the page.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  return value;
}

// How she is in herself, from her spirits.
export function joyLevel(value) {
  if (value < 20) return 'sad';
  if (value < 40) return 'glum';
  if (value < 75) return 'fine';
  return 'happy';
}

export function useJoy() {
  const [value, setValue] = useState(readJoy);
  useEffect(() => {
    const onChange = (event) => setValue(event.detail);
    window.addEventListener(EVENT, onChange);
    // A new day while the page is open starts her afresh.
    const timer = setInterval(() => setValue(readJoy()), 60 * 1000);
    return () => {
      window.removeEventListener(EVENT, onChange);
      clearInterval(timer);
    };
  }, []);
  return value;
}

export const JOY_EVENT = EVENT;

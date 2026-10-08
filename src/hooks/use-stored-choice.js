import { useCallback, useState } from 'react';

// A text preference kept in this browser, like useStoredFlag. Storage can be
// blocked or cleared, so it falls back to null and the choice lasts for the visit.
export function useStoredChoice(key) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  });

  const update = useCallback(
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // Not remembered; still applies until the page is closed.
      }
    },
    [key],
  );

  return [value, update];
}

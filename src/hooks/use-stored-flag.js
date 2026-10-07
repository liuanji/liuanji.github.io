import { useCallback, useState } from 'react';

// A true/false preference kept in this browser. Storage can be blocked or
// cleared, so it falls back to the default and the choice lasts for the visit.
export function useStoredFlag(key, defaultValue = false) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored == null ? defaultValue : stored === '1';
    } catch {
      return defaultValue;
    }
  });

  const update = useCallback(
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(key, next ? '1' : '0');
      } catch {
        // Not remembered; still applies until the page is closed.
      }
    },
    [key],
  );

  return [value, update];
}

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { gpuStatusUrl } from '../../data/servers';

// One JSON file published by servermonitor (see servermonitor/servermonitor/publish.py).
// While a new host or range loads, the previous file stays on screen as placeholder data.
export function useStatusFile(name, refetchInterval) {
  return useQuery({
    queryKey: ['gpu-status', name],
    queryFn: async ({ signal }) => {
      const response = await fetch(`${gpuStatusUrl}/files/${name}`, { signal });
      if (!response.ok) throw new Error(`${name} returned ${response.status}`);
      return response.json();
    },
    enabled: Boolean(gpuStatusUrl),
    refetchInterval,
    placeholderData: keepPreviousData,
  });
}

// Wall-clock seconds, refreshed so "updated 40 s ago" keeps counting between fetches.
export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() / 1000), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { gpuStatusUrl } from '../../data/servers';

// One JSON file published by servermonitor (see servermonitor/servermonitor/publish.py).
// While a new host or range loads, the previous file stays on screen as placeholder data.
// A rejected session fails with error.status 401 and is not retried.
export function useStatusFile(name, refetchInterval, token) {
  return useQuery({
    queryKey: ['gpu-status', name],
    queryFn: async ({ signal }) => {
      const response = await fetch(`${gpuStatusUrl}/files/${name}`, {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw Object.assign(new Error(`${name} returned ${response.status}`), { status: response.status });
      }
      return response.json();
    },
    enabled: Boolean(gpuStatusUrl && token),
    retry: (failures, error) => error.status !== 401 && failures < 3,
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

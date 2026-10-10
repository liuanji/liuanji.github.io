import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { gpuStatusUrl } from '../../../data/servers';

// A request still waiting after this long is dropped, so a connection that hung
// (after sleep or a network change) cannot hold up the refreshes after it.
const REQUEST_TIMEOUT_MS = 15_000;

function withTimeout(signal) {
  const timeout = AbortSignal.timeout?.(REQUEST_TIMEOUT_MS);
  if (!timeout) return signal;
  return AbortSignal.any ? AbortSignal.any([signal, timeout]) : timeout;
}

// The Worker lets the browser reuse a file for 15 s. Right after this page
// changes a reservation, refetches skip that cache, so the change cannot be
// undone on screen by an older copy of the overview.
let reloadUntil = 0;
export function skipCacheBriefly() {
  reloadUntil = Date.now() + 20_000;
}

// One JSON file published by servermonitor (see servermonitor/servermonitor/publish.py).
// While a new host or range loads, the previous file stays on screen as placeholder data.
// A rejected session fails with error.status 401 and is not retried. Polling pauses
// in a hidden tab, so the file is fetched again as soon as the tab is visible or
// the network is back, unlike the rest of the site.
export function useStatusFile(name, refetchInterval, token) {
  return useQuery({
    queryKey: ['gpu-status', name],
    queryFn: async ({ signal }) => {
      const response = await fetch(`${gpuStatusUrl}/files/${name}`, {
        signal: withTimeout(signal),
        headers: { Authorization: `Bearer ${token}` },
        cache: Date.now() < reloadUntil ? 'reload' : 'default',
      });
      if (!response.ok) {
        throw Object.assign(new Error(`${name} returned ${response.status}`), { status: response.status });
      }
      return response.json();
    },
    enabled: Boolean(gpuStatusUrl && token),
    retry: (failures, error) => error.status !== 401 && failures < 3,
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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

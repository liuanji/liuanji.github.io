import { useEffect, useRef, useState } from 'react';
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

// Wall-clock seconds, refreshed so "updated 40 s ago" keeps counting between
// fetches. While the tab is hidden the clock stops, since the files are not
// fetched then; back in view, it waits for the next fresh file (freshAt, when
// it last came, changing) before moving on, or RESUME_WAIT_MS at most. Else,
// in the moment before that fetch lands, everything would read as late.
const RESUME_WAIT_MS = 8_000;
export function useNow(intervalMs = 10_000, freshAt = 0) {
  const [now, setNow] = useState(() => Date.now() / 1000);
  // Since when (ms) it has waited for a fresh file, and the file it had then.
  const waiting = useRef(null);
  const freshAtRef = useRef(freshAt);
  freshAtRef.current = freshAt;
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      if (waiting.current && Date.now() - waiting.current.since < RESUME_WAIT_MS) return;
      waiting.current = null;
      setNow(Date.now() / 1000);
    };
    const onVisible = () => {
      if (document.hidden) return;
      waiting.current = { since: Date.now(), freshAt: freshAtRef.current };
    };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  // A fresh file after coming back: the clock catches up at once.
  useEffect(() => {
    if (waiting.current && freshAt !== waiting.current.freshAt) {
      waiting.current = null;
      setNow(Date.now() / 1000);
    }
  }, [freshAt]);
  return now;
}

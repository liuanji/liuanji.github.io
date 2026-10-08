import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gpuStatusUrl } from '../../data/servers';
import { skipCacheBriefly } from './useStatusFile';

// What the Worker's refusals mean for the person clicking.
const ERRORS = {
  'already reserved': 'Someone has just reserved this GPU.',
  'reservation limit reached': 'You already hold the most GPUs allowed. Release one first.',
  'no account on this server': 'You have no account on this server.',
  'too many attempts': 'Too many tries. Wait a minute and try again.',
};

// Reserving and releasing GPUs. Each call answers with the current reservations,
// which replace the overview's copy at once instead of waiting for the next poll.
export function useReservations(token, onRejected) {
  const queryClient = useQueryClient();

  const send = useCallback(
    async (method, path, body) => {
      let response;
      try {
        response = await fetch(`${gpuStatusUrl}${path}`, {
          method,
          headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw new Error('The status server could not be reached.');
      }
      if (response.status === 401) {
        onRejected();
        throw new Error('Your session has ended. Sign in again.');
      }
      const data = await response.json().catch(() => ({}));
      if (Array.isArray(data.reservations)) {
        skipCacheBriefly();
        queryClient.setQueryData(['gpu-status', 'overview'], (old) => old && { ...old, reservations: data.reservations });
      }
      if (!response.ok) throw new Error(ERRORS[data.error] ?? 'That did not work. Try again in a moment.');
    },
    [token, onRejected, queryClient],
  );

  const reserve = useCallback(
    (host, gpu, minutes) => send('POST', '/reservations', { host, gpu, minutes }),
    [send],
  );
  const release = useCallback(
    (host, gpu) => send('DELETE', `/reservations/${encodeURIComponent(host)}/${gpu}`),
    [send],
  );
  return { reserve, release };
}

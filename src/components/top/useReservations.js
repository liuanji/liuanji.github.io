import { useCallback, useRef } from 'react';
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
// Calls go out one after another, so their answers cannot arrive out of order
// and put back an older list, and an overview fetch already under way is
// cancelled before an answer is applied, so its older copy cannot either.
export function useReservations(token, onRejected) {
  const queryClient = useQueryClient();
  const queue = useRef(Promise.resolve());

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
        await queryClient.cancelQueries({ queryKey: ['gpu-status', 'overview'] });
        queryClient.setQueryData(['gpu-status', 'overview'], (old) => old && { ...old, reservations: data.reservations });
      }
      if (!response.ok) throw new Error(ERRORS[data.error] ?? 'That did not work. Try again in a moment.');
    },
    [token, onRejected, queryClient],
  );

  // Runs after every earlier call has settled, whether it worked or not.
  const enqueue = useCallback((call) => {
    const result = queue.current.then(call);
    queue.current = result.catch(() => {});
    return result;
  }, []);

  const reserve = useCallback(
    (host, gpu, minutes) => enqueue(() => send('POST', '/reservations', { host, gpu, minutes })),
    [enqueue, send],
  );
  const release = useCallback(
    (host, gpu) => enqueue(() => send('DELETE', `/reservations/${encodeURIComponent(host)}/${gpu}`)),
    [enqueue, send],
  );
  return { reserve, release };
}

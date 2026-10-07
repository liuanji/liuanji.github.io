import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gpuStatusUrl } from '../../data/servers';

// The gpu-status Worker serves files only to a signed-in session: POST /login
// trades the shared password for a token valid 30 days, kept in this browser.
const STORAGE_KEY = 'gpu-status-session';

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (session?.token && session.expires_at > Date.now() / 1000) return session;
  } catch {
    // Storage blocked or unreadable: sign in again.
  }
  return null;
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The session still lasts until the tab closes.
  }
}

async function requestSession(password) {
  let response;
  try {
    response = await fetch(`${gpuStatusUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new Error('The status server could not be reached.');
  }
  if (response.status === 401) throw new Error('Incorrect password.');
  if (response.status === 429) throw new Error('Too many attempts. Try again in a minute.');
  if (!response.ok) throw new Error('Sign-in is unavailable right now.');
  return response.json();
}

export function useSession() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(readSession);

  const signIn = useCallback(async (password) => {
    const next = await requestSession(password);
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
    queryClient.removeQueries({ queryKey: ['gpu-status'] });
  }, [queryClient]);

  return { token: session?.token ?? null, signIn, signOut };
}

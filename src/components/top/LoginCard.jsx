import { useState } from 'react';
import { HOST_STATUS } from './config';

export default function LoginCard({ onSignIn }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);
    try {
      // On success the page replaces this card, so pending is never reset.
      await onSignIn(password);
    } catch (failure) {
      setError(failure.message);
      setPending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border-light px-7 py-10">
      <form onSubmit={submit} className="mx-auto max-w-sm text-center">
        <h3 className="font-tight font-semibold text-lg text-inkwell">Sign in to view server status</h3>
        <p className="text-sm text-data-grey mt-2 leading-relaxed">
          Lab members can sign in with the shared password.
        </p>
        <div className="mt-6 flex gap-2">
          <label htmlFor="top-password" className="sr-only">
            Password
          </label>
          <input
            id="top-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border-light bg-paper px-3.5 py-2 text-sm text-inkwell outline-none focus:border-inkwell"
          />
          <button
            type="submit"
            disabled={!password || pending}
            className="rounded-lg bg-inkwell px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm" style={{ color: HOST_STATUS.error.color }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

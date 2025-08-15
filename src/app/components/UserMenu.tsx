// src/app/components/UserMenu.tsx
'use client';

import React from 'react';

type SessionResp =
  | { user: { email: string; name?: string | null; isAdmin?: boolean } }
  | { user: null };

export default function UserMenu() {
  const [session, setSession] = React.useState<SessionResp | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const json = (await res.json()) as SessionResp;
        if (alive) setSession(json);
      } catch {
        if (alive) setSession({ user: null });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Hard-refresh to force middleware + server components to re-evaluate auth
    window.location.href = '/signin';
  }

  if (loading) {
    return (
      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
        checking…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <a
        href="/signin"
        className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
      >
        Sign in
      </a>
    );
  }

  const email = session.user.email;
  const initials =
    email?.slice(0, 2).toUpperCase() || (session.user.name || 'U?').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-gray-600 sm:inline">
        {email} {session.user.isAdmin ? '(admin)' : ''}
      </span>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs text-white">
        {initials}
      </div>
      <button
        onClick={handleLogout}
        className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
      >
        Sign out
      </button>
    </div>
  );
}

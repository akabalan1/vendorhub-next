'use client';

import React from 'react';

export default function SignOutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/signin';
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
    >
      Sign out
    </button>
  );
}

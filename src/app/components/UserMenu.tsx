'use client';
import { useSession } from 'next-auth/react';
import { signIn, signOut } from 'next-auth/react';

export default function UserMenu() {
  const { data } = useSession();
  const user = data?.user;

  if (!user) {
    return (
      <button onClick={() => signIn()} className="text-sm text-gray-600 hover:text-gray-900">
        Sign in
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600">{user.email}</span>
      {(user as any).isAdmin ? (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">Admin</span>
      ) : null}
      <button onClick={() => signOut()} className="text-gray-600 hover:text-gray-900">
        Sign out
      </button>
    </div>
  );
}

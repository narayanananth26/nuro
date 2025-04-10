'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          {session.user?.email}
        </span>
        <Link
          href="/dashboard"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Dashboard
        </Link>
        <button
          onClick={() => signOut()}
          className="text-sm text-red-600 hover:text-red-500"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/auth/login"
        className="text-sm text-indigo-600 hover:text-indigo-500"
      >
        Sign in
      </Link>
      <Link
        href="/auth/register"
        className="text-sm text-indigo-600 hover:text-indigo-500"
      >
        Register
      </Link>
    </div>
  );
}

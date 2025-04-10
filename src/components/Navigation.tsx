"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link 
              href="/"
              className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900"
            >
              <span className="text-xl font-bold">Nuro</span>
            </Link>
          </div>

          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
                <span className="text-sm text-gray-500">
                  {session.user?.email}
                </span>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/auth/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

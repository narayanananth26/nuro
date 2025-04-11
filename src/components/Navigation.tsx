"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import AnimatedLogo from "./AnimatedLogo";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-[#1E1E1E] shadow-md fixed top-0 left-0 right-0 z-50 border-b border-[#333333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 pt-3">
        <div className="flex justify-between h-16">
          <div className="flex gap-4">
            <AnimatedLogo />
            <Link 
              href="/"
              className="flex items-center px-2 py-2 text-white hover:text-[#E3CF20]"
            >
              <span className="text-6xl font-bold text-[#E3CF20] uppercase font-[Bytesized]">Nuro</span>
            </Link>
          </div>

          <div className="flex items-center">
            {session ? (
              <div className="flex items-center gap-2">
                <span className="text-md tracking-wider text-gray-400">
                  {session.user?.email}
                </span>
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm tracking-wider font-medium text-white hover:text-[#E3CF20] hover:bg-[#2D2D2D] uppercase"
                >
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  className="px-3 py-2 rounded-md text-sm tracking-wider font-medium text-white hover:text-[#E3CF20] hover:bg-[#2D2D2D] uppercase"
                >
                  History
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-2 rounded-md text-sm tracking-wider font-medium text-[#121212] bg-[#E3CF20] hover:bg-[#d4c01c] uppercase"
                >
                  Logout
                </button>
                
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/auth/login"
                  className="px-3 py-2 rounded-md text-sm tracking-wider font-medium text-white hover:text-[#E3CF20] hover:bg-[#2D2D2D]"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3 py-2 rounded-md text-sm tracking-wider font-medium text-[#121212] bg-[#E3CF20] hover:bg-[#d4c01c]"
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

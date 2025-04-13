"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import AnimatedLogo from "./AnimatedLogo";
import { User, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Spinner from "./ui/Spinner";

export default function Navigation() {
  const { data: session, status } = useSession();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center">
            {status === "loading" ? (
              <div className="flex items-center justify-center px-4">
                <Spinner size="md" color="#E3CF20" />
                <span className="ml-2 text-gray-400">Loading...</span>
              </div>
            ) : session ? (
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

          {/* Mobile Menu Icon */}
          <div className="flex md:hidden items-center">
            {status === "loading" ? (
              <div className="flex items-center px-2">
                <Spinner size="sm" color="#E3CF20" />
              </div>
            ) : session ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-full text-white hover:bg-[#2D2D2D]"
                  aria-label="User menu"
                >
                  <User size={24} />
                </button>
                
                {/* Mobile dropdown menu */}
                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] border border-[#333333] rounded-md shadow-lg z-50">
                    <div className="p-3 border-b border-[#333333]">
                      <p className="text-sm text-gray-400 truncate">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-white hover:bg-[#2D2D2D]"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/history"
                      className="block px-4 py-2 text-sm text-white hover:bg-[#2D2D2D]"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      History
                    </Link>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2D2D] border-t border-[#333333]"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-x-2">
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

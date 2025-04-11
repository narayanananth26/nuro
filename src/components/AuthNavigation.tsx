"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import AnimatedLogo from "./AnimatedLogo";

export default function AuthNavigation() {

  return (
    <nav className="bg-[#1E1E1E] shadow-md fixed top-0 left-0 right-0 z-50 border-b border-[#333333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 pt-3">
        <div className="flex justify-between h-16">
          <div className="flex gap-2">
            <AnimatedLogo />
            <Link 
              href="/"
              className="flex items-center px-2 py-2 text-white hover:text-[#E3CF20]"
            >
              <span className="text-xl font-bold text-[#E3CF20] uppercase">Nuro</span>
            </Link>
          </div>

         
        </div>
      </div>
    </nav>
  );
}

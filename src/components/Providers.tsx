"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { PaginationProvider } from "@/contexts/PaginationContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PaginationProvider>
        {children}
        <Toaster />
      </PaginationProvider>
    </SessionProvider>
  );
}

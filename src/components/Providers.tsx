"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { PaginationProvider } from "@/contexts/PaginationContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PaginationProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1E1E1E',
              color: '#FFFFFF',
              border: '1px solid #333333',
            },
            success: {
              iconTheme: {
                primary: '#E3CF20',
                secondary: '#121212',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff4b4b',
                secondary: '#121212',
              },
            },
            loading: {
              iconTheme: {
                primary: '#E3CF20',
                secondary: '#121212',
              },
            },
            duration: 4000,
          }}
        />
      </PaginationProvider>
    </SessionProvider>
  );
}

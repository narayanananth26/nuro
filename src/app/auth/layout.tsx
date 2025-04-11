import type { Metadata } from "next";
import "./auth.css";

export const metadata: Metadata = {
  title: "Nuro - Authentication",
  description: "Sign in or register for Nuro URL Health Monitor",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen overflow-hidden">
      <div className="fixed inset-0 pt-16 pb-8 overflow-hidden flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

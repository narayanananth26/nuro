import type { Metadata } from "next";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Nuro - Dashboard",
  description: "Monitor your websites with Nuro URL Health Monitor",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}

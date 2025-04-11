import type { Metadata } from "next";
import Providers from "@/components/Providers";
import ConditionalNavigation from "@/components/ConditionalNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuro - URL Health Monitor",
  description: "Monitor website uptime and response times with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#121212] text-white min-h-screen font-[Fira_Sans]">
        <Providers>
          <ConditionalNavigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}

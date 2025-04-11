import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import ConditionalNavigation from "@/components/ConditionalNavigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-[#121212] text-white min-h-screen`}>
        <Providers>
          <ConditionalNavigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "OlympLab - Elite EdTech",
  description: "Elite training platform bridging abstract mathematical analysis and high-performance competitive programming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased dark"
    >
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans h-screen flex flex-col bg-[#09090b] text-zinc-50`}>
        <Navbar />
        {/* overflow-hidden + min-h-0 lets the IDE page manage its own scroll/fill */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">{children}</main>
      </body>
    </html>
  );
}

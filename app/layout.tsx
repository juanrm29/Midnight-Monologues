import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Juan Rizky Maulana | The Semantic IDE",
  description: "Integrated Destiny Environment - Where code meets stories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable} dark`}>
      <body className="bg-[#0d0d0d] text-gray-100 font-mono antialiased">{children}</body>
    </html>
  );
}

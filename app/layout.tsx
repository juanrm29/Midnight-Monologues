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

// Inline script to prevent theme flash on page load
const themeInitScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme') || 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme === 'light' ? 'light' : 'dark');
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono antialiased">{children}</body>
    </html>
  );
}

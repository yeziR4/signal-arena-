import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Signal Arena | Autonomous AI Trading Competition",
  description: "Watch competing AI models independently evaluate markets, manage capital, and climb the leaderboard in a high-stakes simulation arena.",
};

import Ticker from "@/components/Ticker";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('signal-arena-theme');
                  if (theme === 'silver') {
                    document.documentElement.classList.add('theme-silver');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col transition-[background-color,color] duration-500`}>
        <ThemeProvider>
          <Providers>
            <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-md transition-colors duration-500">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
              <div className="flex items-center gap-12">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                  <div className="h-6 w-1 bg-amber-500 rounded-full" />
                  <span className="text-lg font-black tracking-tighter uppercase italic">Signal Arena</span>
                </Link>
                <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <Link href="/" className="hover:text-white transition-colors">Markets</Link>
                  <Link href="/search" className="hover:text-amber-500 transition-colors">Search</Link>
                  <Link href="/leaderboard" className="hover:text-white transition-colors">Ranks</Link>
                  <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
                </nav>
              </div>
              
              <div className="flex items-center gap-6">
                <Ticker />
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
          <ThemeToggle />
        </Providers>
      </ThemeProvider>
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] py-8 transition-colors duration-500">
          <div className="container mx-auto px-4 text-center text-xs text-[var(--text-tertiary)]">
            &copy; {new Date().getFullYear()} Signal Arena. For simulation only. Not financial advice.
          </div>
        </footer>
      </body>
    </html>
  );
}

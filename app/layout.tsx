import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DevAuthProvider } from "@/contexts/DevAuthContext";
import DevPanel from "@/components/DevPanel";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";
import BackgroundManager from "@/components/BackgroundManager";
import { DEFAULT_BG_URL } from "@/lib/backgrounds";
import { preload } from "react-dom";
import sprite from "@/data/agent-icon-sprite.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'ZZZendle - Daily Zenless Zone Zero Guessing Game',
  description: 'Guess the daily Zenless Zone Zero agent across 4 game modes: Classic attribute comparison, Quote guessing, Emoji hints, and Splash art reveal. New agent every day. Free to play!',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Start fetching the agent icon sprite with the page, so icons in search
  // results and guess rows are already there on the first keystroke.
  preload(sprite.url, { as: "image" });

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Full-page background image + dark overlay */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div
            id="zzz-bg-image"
            className="absolute inset-0"
            style={{
              backgroundImage: `url("${DEFAULT_BG_URL}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} />
        </div>

        <DevAuthProvider>
          <div className="relative z-10 flex flex-col flex-1">
            {children}
          </div>
          <Footer />
          <DevPanel />
          <BackgroundManager />
        </DevAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

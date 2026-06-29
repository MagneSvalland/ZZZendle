import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DevAuthProvider } from "@/contexts/DevAuthContext";
import DevPanel from "@/components/DevPanel";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'ZZZendle — Daily ZZZ Agent Guessing Game',
  description: 'Guess the daily Zenless Zone Zero agent. New agent every day!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Full-page background image + dark overlay */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/dhs8uis-2c9f5bda-287e-42a7-8d63-a51df778ead7.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} />
        </div>

        <DevAuthProvider>
          <div className="relative z-10 flex flex-col min-h-full">
            {children}
          </div>
          <DevPanel />
        </DevAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

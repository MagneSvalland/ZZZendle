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
import { SITE_URL } from "@/lib/links";
import { SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pages set their own title/canonical/Open Graph via pageMetadata (lib/seo.ts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

// Structured data so Google knows the site's name (also as "ZZZ Wordle") and
// that it's a free browser game.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: ["ZZZ Wordle", "Zenless Zone Zero Wordle"],
      url: SITE_URL,
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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

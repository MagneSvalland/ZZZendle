import type { Metadata } from 'next'

// Search wording is based on Google Search Console queries: people find the
// site via "zzzdle", "zzz wordle", "zzz dle", "zenlessdle" and
// "zenless zone zero wordle", so titles and descriptions use those terms.

export const SITE_NAME = 'ZZZendle'
export const DEFAULT_TITLE = 'ZZZendle – Zenless Zone Zero Wordle | Daily ZZZdle Guessing Game'
export const DEFAULT_DESCRIPTION =
  'Guess the daily Zenless Zone Zero agent in ZZZendle, a free ZZZ Wordle (ZZZdle). ' +
  'Five modes: Classic, Quote, Emoji, Splash art and Endless. New agent every day!'

/**
 * Per-page metadata. Each page sets its own canonical URL and Open Graph
 * block — setting them in the root layout would make every page inherit the
 * home page's canonical.
 */
export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string
  title?: string
  description: string
}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  // A page-level openGraph block replaces the file-based app/opengraph-image
  // on child routes, so reference the generated image explicitly.
  const images = [{ url: '/opengraph-image', width: 1200, height: 630, alt: DEFAULT_TITLE }]
  return {
    title: title ?? { absolute: DEFAULT_TITLE },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images,
    },
  }
}
